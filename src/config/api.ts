// API Configuration
// Update these values to switch between Amplify and CDK APIs

export const API_CONFIG = {
  // Set to 'cdk' to use your CDK API, 'amplify' to use Amplify API
  type: 'cdk' as 'cdk' | 'amplify',
  
  // CDK API Gateway URL (new V2 stack connecting to your existing RDS)
  cdkApiUrl: 'https://mihh31xr4e.execute-api.us-east-2.amazonaws.com/prod',
  
  // Amplify API name (from amplify_outputs.json)
  amplifyApiName: 'food-rest-api',
};

// You can override these with environment variables in production
export const getApiConfig = () => ({
  type: (import.meta.env.VITE_API_TYPE as 'cdk' | 'amplify') || API_CONFIG.type,
  cdkApiUrl: import.meta.env.VITE_API_BASE_URL || API_CONFIG.cdkApiUrl,
  amplifyApiName: API_CONFIG.amplifyApiName,
}); 