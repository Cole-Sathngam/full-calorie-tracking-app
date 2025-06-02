import { type ClientSchema, defineData } from "@aws-amplify/backend";
import { foodApi } from "../functions/api-functions/resource";
import { schema as generatedSqlSchema } from './schema.sql';

// Configure SQL schema with proper authorization rules
// Allow public access for testing and authenticated users
// Also grant the Lambda function access to the data
const sqlSchema = generatedSqlSchema.authorization(allow => [
  allow.publicApiKey(), // Allow public access for testing
  allow.authenticated(), // Also allow authenticated users
  allow.resource(foodApi) // Allow Lambda function access
]);

export type Schema = ClientSchema<typeof sqlSchema>;

export const data = defineData({
  schema: sqlSchema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

// Note: This project uses only REST APIs for data operations
// The food_items table is accessed via Lambda functions through REST endpoints
// No GraphQL client code is needed in the frontend 