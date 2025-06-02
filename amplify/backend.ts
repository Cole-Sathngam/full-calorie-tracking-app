import { defineBackend } from '@aws-amplify/backend';
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { auth } from './auth/resource';
import { data } from './data/resource';
import { foodApi } from './functions/api-functions/resource';

const backend = defineBackend({
  auth,
  data,
  foodApi,
});

// Add IAM permissions for Lambda function to access secrets and RDS
const lambdaFunction = backend.foodApi.resources.lambda;

// Grant permissions to access RDS
lambdaFunction.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'rds:DescribeDBInstances',
    'rds:Connect'
  ],
  resources: [
    `arn:aws:rds:us-east-2:*:db:calorie-db-1`
  ]
}));

// Grant permissions to access Secrets Manager
lambdaFunction.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'secretsmanager:GetSecretValue',
    'secretsmanager:DescribeSecret'
  ],
  resources: [
    `arn:aws:secretsmanager:us-east-2:*:secret:*`
  ]
}));

// Create a new API stack
const apiStack = backend.createStack("food-api-stack");

// Create a new REST API
const myRestApi = new RestApi(apiStack, "FoodRestApi", {
  restApiName: "food-rest-api",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // You can restrict this to specific domains
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
  },
});

// Create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.foodApi.resources.lambda
);

// Create the /foods resource path
const foodsPath = myRestApi.root.addResource("foods", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.NONE, // Public access
  },
});

// Add methods to the /foods path
foodsPath.addMethod("GET", lambdaIntegration);
foodsPath.addMethod("POST", lambdaIntegration);

// Add a proxy resource for /foods/{id} and /foods/search
foodsPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// Add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
}); 