# Calorie Tracking API - AWS CDK Infrastructure

This repository contains the AWS CDK infrastructure code for the Calorie Tracking API, demonstrating the architecture used in the main Amplify application.

## Architecture Overview

This CDK stack creates the following AWS resources:

### Core Infrastructure
- **VPC**: Multi-AZ VPC with public, private, and isolated subnets
- **Security Groups**: Properly configured for Lambda and RDS communication
- **NAT Gateway**: For Lambda internet access in private subnets

### Authentication
- **Amazon Cognito User Pool**: User authentication and management
- **User Pool Client**: Web application client configuration

### Database
- **Amazon RDS PostgreSQL**: Database for storing food items and calorie data
- **AWS Secrets Manager**: Secure storage of database credentials and connection strings
- **Database Security**: Isolated subnets with restricted access

### API Layer
- **AWS Lambda**: Serverless function for API logic
- **Amazon API Gateway**: RESTful API endpoints with CORS configuration
- **IAM Roles**: Least-privilege access for Lambda functions

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- AWS CDK CLI installed globally: `npm install -g aws-cdk`

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd calorie-api-infrastructure
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Bootstrap CDK (if not done before):
   ```bash
   cdk bootstrap
   ```

## Deployment

1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Review the changes:
   ```bash
   cdk diff
   ```

3. Deploy the stack:
   ```bash
   cdk deploy
   ```

4. Note the outputs - you'll need these for your application configuration:
   - User Pool ID
   - User Pool Client ID
   - API Gateway URL
   - Database Endpoint

## Configuration

After deployment, you'll need to:

1. **Database Setup**: Connect to the RDS instance and create the required tables:
   ```sql
   CREATE TABLE food_items (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     calories INTEGER NOT NULL
   );

   INSERT INTO food_items (name, calories) VALUES
   ('Apple', 95),
   ('Banana', 105),
   ('Chicken Breast (100g)', 165),
   ('Rice (1 cup cooked)', 205),
   ('Broccoli (100g)', 34);
   ```

2. **Update Lambda Function**: Replace the inline code with your actual implementation that connects to PostgreSQL.

3. **Frontend Configuration**: Update your React application with the Cognito and API Gateway endpoints.

## Code Structure

```
calorie-api-infrastructure/
├── bin/
│   └── calorie-api-infrastructure.ts    # CDK app entry point
├── lib/
│   └── calorie-api-infrastructure-stack.ts  # Main stack definition
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── cdk.json                            # CDK configuration
└── README.md                           # This file
```

## Key Features Demonstrated

### 1. AWS Cognito Integration
```typescript
const userPool = new cognito.UserPool(this, 'CalorieAppUserPool', {
  userPoolName: 'calorie-app-users',
  selfSignUpEnabled: true,
  signInAliases: { email: true },
  autoVerify: { email: true },
  // ... additional configuration
});
```

### 2. RDS PostgreSQL with Secrets Manager
```typescript
const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'postgres' }),
    generateStringKey: 'password',
    excludeCharacters: '"@/\\',
  },
});

const database = new rds.DatabaseInstance(this, 'CalorieDatabase', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),
  credentials: rds.Credentials.fromSecret(dbCredentials),
  // ... additional configuration
});
```

### 3. Lambda with VPC and Security Groups
```typescript
const apiFunction = new lambda.Function(this, 'CalorieApiFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [lambdaSecurityGroup],
  environment: {
    CONNECTION_STRING_SECRET_ARN: connectionString.secretArn,
  },
});
```

### 4. API Gateway with CORS
```typescript
const api = new apigateway.RestApi(this, 'CalorieApi', {
  restApiName: 'Calorie Tracking API',
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'Authorization', /* ... */],
  },
});
```

## Security Considerations

- Database is deployed in isolated subnets with no internet access
- Lambda functions use least-privilege IAM roles
- Secrets are managed through AWS Secrets Manager
- Security groups restrict access between components
- CORS is properly configured for web application access

## Cost Optimization

- Uses t3.micro RDS instance (eligible for free tier)
- Single NAT Gateway to minimize costs
- Lambda functions with appropriate timeout settings
- Secrets Manager for secure credential storage

## Cleanup

To avoid ongoing charges, destroy the stack when no longer needed:

```bash
cdk destroy
```

**Note**: This will delete all resources including the database. Make sure to backup any important data first.

## Related Projects

This infrastructure supports the main Amplify application located in the `calorie-tracking-app` directory. The Amplify app uses a similar architecture but is managed through the Amplify CLI.

## Support

For questions or issues, please refer to the main project documentation or create an issue in the repository. 