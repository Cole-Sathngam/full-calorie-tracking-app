import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CalorieApiInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Existing RDS instance details (publicly accessible)
    const existingRdsEndpoint = 'calorie-db-1.czyq4e4syyy0.us-east-2.rds.amazonaws.com';
    const existingRdsPort = 5432;
    const existingDbName = 'postgres';
    const existingDbUsername = 'postgres';

    // Database credentials secret (manually update with your RDS password)
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      description: 'Credentials for the existing calorie-db-1 database',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: existingDbUsername }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // IMPORTANT: After deployment, update this secret with your actual RDS password:
    // aws secretsmanager update-secret --secret-id <secret-arn> --secret-string '{"username":"postgres","password":"your-actual-password"}'

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: 'vpc-0034494c10a7de603'
      }),
      description: 'Security group for RDS PostgreSQL database',
      allowAllOutbound: false,
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: 'vpc-0034494c10a7de603'
      }),
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // RDS PostgreSQL Database
    const database = new rds.DatabaseInstance(this, 'CalorieDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      vpc: ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: 'vpc-0034494c10a7de603'
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'caloriedb',
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true in production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN in production
    });

    // Cognito User Pool for Authentication
    const userPool = new cognito.UserPool(this, 'CalorieAppUserPool', {
      userPoolName: 'calorie-app-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN in production
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'CalorieAppUserPoolClient', {
      userPool,
      userPoolClientName: 'calorie-app-client',
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      generateSecret: false, // Required for web applications
    });

    // Lambda Layer with PostgreSQL dependencies
    // const dependenciesLayer = new lambda.LayerVersion(this, 'CalorieApiDependencies', {
    //   code: lambda.Code.fromAsset('lambda-layer'),
    //   compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
    //   description: 'PostgreSQL client and AWS SDK dependencies for Calorie API',
    // });

    // Lambda function for API
    const apiFunction = new lambda.Function(this, 'CalorieApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      // layers: [dependenciesLayer],
      code: lambda.Code.fromAsset('lambda'), // Use our deployment package
      // Remove VPC for now since existing RDS is publicly accessible
      // vpc,
      // vpcSubnets: {
      //   subnetType: ec2.SubnetType.PUBLIC,
      // },
      // securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_ENDPOINT: database.instanceEndpoint.hostname,
        DB_PORT: database.instanceEndpoint.port.toString(),
        DB_NAME: 'caloriedb',
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant Lambda permissions to access secrets
    dbCredentials.grantRead(apiFunction);

    // Grant Lambda permissions to connect to RDS
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rds:DescribeDBInstances',
        'rds:Connect'
      ],
      resources: [database.instanceArn]
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'CalorieApi', {
      restApiName: 'Calorie Tracking API',
      description: 'API for calorie tracking application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent'
        ],
        allowCredentials: false,
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction);

    // API resources and methods
    const foodsResource = api.root.addResource('foods');
    foodsResource.addMethod('GET', lambdaIntegration);
    foodsResource.addMethod('POST', lambdaIntegration);

    // Add proxy resource for dynamic routes
    const proxyResource = foodsResource.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbCredentials.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: 'vpc-0034494c10a7de603'
      }).vpcId,
      description: 'VPC ID',
    });
  }
} 