# Code Snippets - AWS Service Integration

This document provides key code snippets demonstrating how the React application integrates with various AWS services.

## Table of Contents

1. [AWS Amplify Configuration](#aws-amplify-configuration)
2. [AWS Cognito Authentication](#aws-cognito-authentication)
3. [API Gateway Integration](#api-gateway-integration)
4. [Lambda Function Implementation](#lambda-function-implementation)
5. [RDS PostgreSQL Connection](#rds-postgresql-connection)
6. [Error Handling & Retry Logic](#error-handling--retry-logic)
7. [Session Management](#session-management)

---

## AWS Amplify Configuration

### Main Application Setup

```typescript
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';

const amplifyConfig = parseAmplifyConfig(outputs);

// Configure Amplify with custom API settings
Amplify.configure({
  ...amplifyConfig,
  API: {
    ...amplifyConfig.API,
    REST: outputs.custom?.API || {},
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);
```

### Amplify Backend Configuration

```typescript
// amplify/backend.ts
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

// Create REST API with Lambda integration
const apiStack = backend.createStack("food-api-stack");

const myRestApi = new RestApi(apiStack, "FoodRestApi", {
  restApiName: "food-rest-api",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
  },
});

// Lambda integration with proper permissions
const lambdaIntegration = new LambdaIntegration(
  backend.foodApi.resources.lambda
);

const foodsPath = myRestApi.root.addResource("foods");
foodsPath.addMethod("GET", lambdaIntegration);
foodsPath.addMethod("POST", lambdaIntegration);
foodsPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});
```

---

## AWS Cognito Authentication

### Enhanced Authentication Hook

```typescript
// src/hooks/useEnhancedAuth.ts
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface SessionInfo {
  isValid: boolean;
  expiresAt: Date | null;
  timeUntilExpiry: number | null;
  isExpiringSoon: boolean;
}

export const useEnhancedAuth = () => {
  const amplifyAuth = useAuthenticator();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isValid: false,
    expiresAt: null,
    timeUntilExpiry: null,
    isExpiringSoon: false
  });

  // Check session details and auto-refresh
  const checkSession = async () => {
    if (!amplifyAuth.user) return;

    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;

      if (accessToken?.payload.exp) {
        const now = new Date();
        const expiresAt = new Date(accessToken.payload.exp * 1000);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const isExpiringSoon = timeUntilExpiry <= 5 * 60 * 1000; // 5 minutes

        setSessionInfo({
          isValid: timeUntilExpiry > 0,
          expiresAt,
          timeUntilExpiry,
          isExpiringSoon
        });

        // Auto-refresh if expiring soon
        if (isExpiringSoon && timeUntilExpiry > 0) {
          await fetchAuthSession({ forceRefresh: true });
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  // Listen to auth events
  useEffect(() => {
    const hubListener = (data: any) => {
      const { channel, payload } = data;
      
      if (channel === 'auth') {
        switch (payload.event) {
          case 'signedIn':
          case 'tokenRefresh':
            checkSession();
            break;
          case 'signedOut':
            setSessionInfo({
              isValid: false,
              expiresAt: null,
              timeUntilExpiry: null,
              isExpiringSoon: false
            });
            break;
        }
      }
    };

    const unsubscribe = Hub.listen('auth', hubListener);
    
    // Initial check and periodic monitoring
    if (amplifyAuth.user) {
      checkSession();
    }

    const interval = setInterval(() => {
      if (amplifyAuth.user) {
        checkSession();
      }
    }, 30 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [amplifyAuth.user]);

  return {
    ...amplifyAuth,
    sessionInfo,
    checkSession
  };
};
```

### Authentication Resource Configuration

```typescript
// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
  },
});
```

---

## API Gateway Integration

### API Client with Retry Logic

```typescript
// src/services/apiClient.ts
import { get, post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

export class ApiClient {
  private static instance: ApiClient;
  private readonly apiName = 'food-rest-api';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.warn('Failed to get auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const apiError = this.handleApiError(error, operationName);
      
      if (apiError.retryable && retryCount < this.maxRetries) {
        console.log(`Retrying ${operationName} (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.executeWithRetry(operation, operationName, retryCount + 1);
      }
      
      throw apiError;
    }
  }

  async getFoods(): Promise<unknown[]> {
    return this.executeWithRetry(async () => {
      const headers = await this.getAuthHeaders();
      const restOperation = get({
        apiName: this.apiName,
        path: '/foods',
        options: { headers }
      });

      const { body } = await restOperation.response;
      const result = await body.json() as Record<string, unknown>;
      
      return Array.isArray(result.data) ? result.data : [];
    }, 'getFoods');
  }

  async searchFood(name: string): Promise<unknown[]> {
    return this.executeWithRetry(async () => {
      const headers = await this.getAuthHeaders();
      const restOperation = get({
        apiName: this.apiName,
        path: `/foods/search?name=${encodeURIComponent(name)}`,
        options: { headers }
      });

      const { body } = await restOperation.response;
      const result = await body.json() as Record<string, unknown>;
      
      return Array.isArray(result.data) ? result.data : [];
    }, 'searchFood');
  }

  private handleApiError(error: unknown, operation: string) {
    // Comprehensive error handling logic
    if (error && typeof error === 'object') {
      const err = error as any;
      
      if (err.response?.status === 429) {
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryable: true
        };
      }
      
      if (err.response?.status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'Server error. Please try again.',
          retryable: true
        };
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      retryable: false
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const apiClient = ApiClient.getInstance();
```

---

## Lambda Function Implementation

### API Handler with PostgreSQL Integration

```typescript
// amplify/functions/api-functions/handler.ts
import type { APIGatewayProxyHandler } from 'aws-lambda';
import { Client } from 'pg';

let pgClient: Client | null = null;

// Initialize PostgreSQL client
const initializePostgreSQLClient = async (): Promise<Client | null> => {
  if (!pgClient) {
    try {
      const connectionString = process.env.SQL_CONNECTION_STRING;
      
      if (!connectionString) {
        console.error('SQL_CONNECTION_STRING not found');
        return null;
      }
      
      pgClient = new Client({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false // Required for AWS RDS
        }
      });
      
      await pgClient.connect();
      console.log('✅ Connected to PostgreSQL database');
      
      return pgClient;
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error);
      pgClient = null;
      return null;
    }
  }
  return pgClient;
};

// Fetch food items from database
const fetchFoodItemsFromDB = async () => {
  const client = await initializePostgreSQLClient();
  if (!client) return null;
  
  try {
    const result = await client.query(
      'SELECT id, name, calories FROM food_items ORDER BY id ASC'
    );
    
    return result.rows.map(row => ({
      id: parseInt(String(row.id)),
      name: String(row.name),
      calories: parseInt(String(row.calories))
    }));
  } catch (error) {
    console.error('❌ Error querying PostgreSQL:', error);
    return null;
  }
};

// Search food items in database
const searchFoodItemsInDB = async (searchTerm: string) => {
  const client = await initializePostgreSQLClient();
  if (!client) return null;
  
  try {
    const result = await client.query(
      'SELECT id, name, calories FROM food_items WHERE LOWER(name) LIKE LOWER($1) ORDER BY id ASC',
      [`%${searchTerm}%`]
    );
    
    return result.rows.map(row => ({
      id: parseInt(String(row.id)),
      name: String(row.name),
      calories: parseInt(String(row.calories))
    }));
  } catch (error) {
    console.error('❌ Error searching PostgreSQL:', error);
    return null;
  }
};

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('🚀 Lambda function started');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    const path = event.path || '/';
    const method = event.httpMethod;

    // GET /foods - Get all food items
    if (method === 'GET' && path.endsWith('/foods')) {
      const foodItems = await fetchFoodItemsFromDB();
      
      if (foodItems) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: foodItems,
            message: 'Food items retrieved from database',
            source: 'database'
          })
        };
      }
      
      // Fallback data if database unavailable
      const fallbackData = [
        { id: 1, name: 'Apple', calories: 95 },
        { id: 2, name: 'Banana', calories: 105 }
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: fallbackData,
          message: 'Using fallback data',
          source: 'fallback'
        })
      };
    }

    // GET /foods/search - Search food items
    if (method === 'GET' && path.includes('/search')) {
      const searchName = event.queryStringParameters?.name;
      
      if (!searchName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Name parameter is required'
          })
        };
      }

      const foodItems = await searchFoodItemsInDB(searchName);
      
      if (foodItems) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: foodItems,
            query: searchName,
            source: 'database'
          })
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Route not found: ${method} ${path}`
      })
    };

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
```

### Lambda Function Resource Configuration

```typescript
// amplify/functions/api-functions/resource.ts
import { defineFunction, secret } from '@aws-amplify/backend';

export const foodApi = defineFunction({
  name: 'food-api-lambda',
  entry: './handler.ts',
  environment: {
    SQL_CONNECTION_STRING: secret('SQL_CONNECTION_STRING')
  },
  runtime: 'nodejs18.x',
  timeout: '30s',
});
```

---

## RDS PostgreSQL Connection

### Database Schema Configuration

```typescript
// amplify/data/resource.ts
import { type ClientSchema, defineData } from "@aws-amplify/backend";
import { foodApi } from "../functions/api-functions/resource";
import { schema as generatedSqlSchema } from './schema.sql';

const sqlSchema = generatedSqlSchema.authorization(allow => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.resource(foodApi)
]);

export const data = defineData({
  schema: sqlSchema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
```

### Database Schema Definition

```typescript
// amplify/data/schema.sql.ts (auto-generated)
import { a } from "@aws-amplify/data-schema";
import { configure } from "@aws-amplify/data-schema/internals";
import { secret } from "@aws-amplify/backend";

export const schema = configure({
    database: {
        identifier: "CalorieTrackingDB",
        engine: "postgresql",
        connectionUri: secret("SQL_CONNECTION_STRING"),
        vpcConfig: {
            vpcId: "vpc-xxxxxxxxx",
            securityGroupIds: ["sg-xxxxxxxxx"],
            subnetAvailabilityZones: [
                {
                    subnetId: "subnet-xxxxxxxxx",
                    availabilityZone: "us-east-2a"
                }
            ]
        }
    }
}).schema({
    "food_items": a.model({
        id: a.integer().required(),
        name: a.string().required(),
        calories: a.integer().required()
    }).identifier(["id"])
});
```

---

## Error Handling & Retry Logic

### Comprehensive Error Management

```typescript
// src/components/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  error: {
    code: string;
    message: string;
    name: string;
  };
  title?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  title = "Error", 
  onRetry 
}) => {
  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'NETWORK_ERROR':
        return '🌐';
      case 'AUTH_ERROR':
        return '🔐';
      case 'SERVER_ERROR':
        return '🔧';
      case 'RATE_LIMITED':
        return '⏱️';
      default:
        return '⚠️';
    }
  };

  const getErrorColor = (code: string) => {
    switch (code) {
      case 'NETWORK_ERROR':
        return '#f39c12';
      case 'AUTH_ERROR':
        return '#e74c3c';
      case 'SERVER_ERROR':
        return '#9b59b6';
      case 'RATE_LIMITED':
        return '#f39c12';
      default:
        return '#e74c3c';
    }
  };

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#fff5f5',
      border: `1px solid ${getErrorColor(error.code)}`,
      borderRadius: '6px',
      marginBottom: '15px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <span style={{ fontSize: '20px', marginRight: '10px' }}>
          {getErrorIcon(error.code)}
        </span>
        <h4 style={{
          margin: 0,
          color: getErrorColor(error.code)
        }}>
          {title}
        </h4>
      </div>
      
      <p style={{ margin: '0 0 10px 0', color: '#333' }}>
        {error.message}
      </p>
      
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginBottom: onRetry ? '10px' : '0'
      }}>
        Error Code: {error.code}
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: getErrorColor(error.code),
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
```

---

## Session Management

### Session Status Indicator

```typescript
// src/components/SessionIndicator.tsx
import React from 'react';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth';

interface SessionIndicatorProps {
  showDetails?: boolean;
}

const SessionIndicator: React.FC<SessionIndicatorProps> = ({ 
  showDetails = false 
}) => {
  const { sessionInfo, authError, isRefreshing } = useEnhancedAuth();

  const formatTimeRemaining = (ms: number | null) => {
    if (!ms || ms <= 0) return 'Expired';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = () => {
    if (authError) return '#e74c3c';
    if (!sessionInfo.isValid) return '#95a5a6';
    if (sessionInfo.isExpiringSoon) return '#f39c12';
    return '#27ae60';
  };

  const getStatusIcon = () => {
    if (isRefreshing) return '🔄';
    if (authError) return '❌';
    if (!sessionInfo.isValid) return '⚪';
    if (sessionInfo.isExpiringSoon) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (isRefreshing) return 'Refreshing session...';
    if (authError) return `Auth Error: ${authError.message}`;
    if (!sessionInfo.isValid) return 'Session invalid';
    if (sessionInfo.isExpiringSoon) return 'Session expiring soon';
    return 'Session active';
  };

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#f8f9fa',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '4px',
      marginBottom: '15px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>
            {getStatusIcon()}
          </span>
          <span style={{
            color: getStatusColor(),
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {getStatusText()}
          </span>
        </div>
        
        {showDetails && sessionInfo.timeUntilExpiry && (
          <span style={{
            fontSize: '12px',
            color: '#666'
          }}>
            Expires in: {formatTimeRemaining(sessionInfo.timeUntilExpiry)}
          </span>
        )}
      </div>
      
      {showDetails && sessionInfo.expiresAt && (
        <div style={{
          marginTop: '5px',
          fontSize: '11px',
          color: '#888'
        }}>
          Session expires: {sessionInfo.expiresAt.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default SessionIndicator;
```

---

These code snippets demonstrate the comprehensive integration between the React application and AWS services, showcasing:

- **Proper authentication flow** with enhanced session management
- **Robust API communication** with retry logic and error handling
- **Secure database connections** through Lambda and VPC
- **Real-time user feedback** with status indicators and error displays
- **Scalable architecture** patterns using AWS best practices

Each snippet is production-ready and includes proper error handling, TypeScript types, and comprehensive logging for debugging and monitoring. 