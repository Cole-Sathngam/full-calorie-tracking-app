import { defineFunction, secret } from '@aws-amplify/backend';

export const foodApi = defineFunction({
  // The function name
  name: 'food-api-lambda',
  // Path to the function code
  entry: './handler.ts',
  // Environment variables for database connection
  environment: {
    SQL_CONNECTION_STRING: secret('SQL_CONNECTION_STRING')
  }
});