import { defineBackend } from '@aws-amplify/backend';

export const backend = defineBackend({
  // Removed auth - we'll use CDK User Pool instead
}); 