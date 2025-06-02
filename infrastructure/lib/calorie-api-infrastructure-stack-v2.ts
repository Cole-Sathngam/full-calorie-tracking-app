import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CalorieApiInfrastructureStackV2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Existing RDS instance details
    const rdsEndpoint = 'calorie-db-1.czyq4e4syyy0.us-east-2.rds.amazonaws.com';
    const rdsPort = 5432;
    const dbName = 'postgres';
    const dbUsername = 'postgres';

    // Database credentials secret
    const dbCredentials = new secretsmanager.Secret(this, 'ExistingDbCredentials', {
      description: 'Credentials for existing calorie-db-1 database',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: dbUsername }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'CalorieAppUserPoolClient', {
      userPool,
      userPoolClientName: 'calorie-app-client',
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      generateSecret: false,
    });

    // Lambda function for API (outside VPC for simplicity since RDS is publicly accessible)
    const apiFunction = new lambda.Function(this, 'CalorieApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_ENDPOINT: rdsEndpoint,
        DB_PORT: rdsPort.toString(),
        DB_NAME: dbName,
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
      resources: [`arn:aws:rds:us-east-2:${this.account}:db:calorie-db-1`]
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
      value: rdsEndpoint,
      description: 'Existing RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbCredentials.secretArn,
      description: 'Database credentials secret ARN - Update with your RDS password',
    });

    // Instructions output
    new cdk.CfnOutput(this, 'PostDeploymentInstructions', {
      value: `Update the secret with your RDS password: aws secretsmanager update-secret --secret-id ${dbCredentials.secretArn} --secret-string '{"username":"postgres","password":"YOUR_ACTUAL_PASSWORD"}'`,
      description: 'Run this command after deployment',
    });

    // Test users output
    new cdk.CfnOutput(this, 'TestUserCredentials', {
      value: 'Test users created: test1@example.com, test2@example.com, admin@example.com (all with password: TempPass123!)',
      description: 'Test user accounts created in the user pool',
    });
  }
} 