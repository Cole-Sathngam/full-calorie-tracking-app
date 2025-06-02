import { get, post, put, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  retryable?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly apiName = 'food-rest-api';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }
      
      return {
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.warn('Failed to get auth headers:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  private handleApiError(error: unknown, operation: string): ApiError {
    console.error(`API Error in ${operation}:`, error);

    // Handle different types of errors
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      
      // Handle HTTP errors
      if (err.response && typeof err.response === 'object') {
        const response = err.response as Record<string, unknown>;
        const statusCode = response.status as number;
        
        switch (statusCode) {
          case 401:
            return {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please sign in again.',
              statusCode,
              retryable: false
            };
          case 403:
            return {
              code: 'FORBIDDEN',
              message: 'You do not have permission to perform this action.',
              statusCode,
              retryable: false
            };
          case 429:
            return {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
              statusCode,
              retryable: true
            };
          case 500:
            return {
              code: 'SERVER_ERROR',
              message: 'Internal server error. Please try again later.',
              statusCode,
              retryable: true
            };
          case 503:
            return {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable. Please try again later.',
              statusCode,
              retryable: true
            };
          default:
            return {
              code: 'HTTP_ERROR',
              message: `HTTP ${statusCode}: ${response.statusText || 'Request failed'}`,
              statusCode,
              retryable: statusCode >= 500
            };
        }
      }

      // Handle network errors
      if (err.name === 'NetworkError' || err.message?.toString().includes('Network')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection and try again.',
          retryable: true
        };
      }

      // Handle timeout errors
      if (err.name === 'TimeoutError' || err.message?.toString().includes('timeout')) {
        return {
          code: 'TIMEOUT_ERROR',
          message: 'Request timed out. Please try again.',
          retryable: true
        };
      }

      // Handle auth errors
      if (err.name === 'NotAuthorizedException' || err.code === 'NotAuthorizedException') {
        return {
          code: 'AUTH_ERROR',
          message: 'Authentication failed. Please sign in again.',
          retryable: false
        };
      }
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.toString() || 'An unexpected error occurred',
      retryable: false
    };
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
      
      // Check if we should retry
      if (apiError.retryable && retryCount < this.maxRetries) {
        console.log(`Retrying ${operationName} (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.executeWithRetry(operation, operationName, retryCount + 1);
      }
      
      throw apiError;
    }
  }

  async getFoods(): Promise<unknown[]> {
    return this.executeWithRetry(async () => {
      console.log('🚀 Fetching foods from API...');
      
      const headers = await this.getAuthHeaders();
      const restOperation = get({
        apiName: this.apiName,
        path: '/foods',
        options: { headers }
      });

      const { body } = await restOperation.response;
      const result = await body.json() as Record<string, unknown>;
      
      console.log('✅ Foods fetched successfully:', result);
      
      // Safely handle the response structure
      if (result?.data && Array.isArray(result.data)) {
        return result.data as unknown[];
      } else if (Array.isArray(result)) {
        return result;
      } else {
        // Fallback - convert to array if possible
        return [];
      }
    }, 'getFoods');
  }

  async searchFood(name: string): Promise<unknown[]> {
    return this.executeWithRetry(async () => {
      console.log('🔍 Searching for food:', name);
      
      const headers = await this.getAuthHeaders();
      const restOperation = get({
        apiName: this.apiName,
        path: `/foods/search?name=${encodeURIComponent(name)}`,
        options: { headers }
      });

      const { body } = await restOperation.response;
      const result = await body.json() as Record<string, unknown>;
      
      console.log('✅ Food search completed:', result);
      return (result?.data as unknown[]) || [];
    }, 'searchFood');
  }

  async createFood(name: string, calories: number): Promise<unknown> {
    return this.executeWithRetry(async () => {
      console.log('➕ Creating food:', { name, calories });
      
      const headers = await this.getAuthHeaders();
      const restOperation = post({
        apiName: this.apiName,
        path: '/foods',
        options: {
          headers,
          body: { name, calories }
        }
      });

      const { body } = await restOperation.response;
      const result = await body.json() as Record<string, unknown>;
      
      console.log('✅ Food created successfully:', result);
      return result?.data || result;
    }, 'createFood');
  }

  async updateFood(id: string, name: string, calories: number): Promise<unknown> {
    return this.executeWithRetry(async () => {
      console.log('📝 Updating food:', { id, name, calories });
      
      const headers = await this.getAuthHeaders();
      const restOperation = put({
        apiName: this.apiName,
        path: `/foods/${id}`,
        options: {
          headers,
          body: { name, calories }
        }
      });

      const { body } = await restOperation.response;
      const result = await body.json() as Record<string, unknown>;
      
      console.log('✅ Food updated successfully:', result);
      return result?.data || result;
    }, 'updateFood');
  }

  async deleteFood(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      console.log('🗑️ Deleting food:', id);
      
      const headers = await this.getAuthHeaders();
      const restOperation = del({
        apiName: this.apiName,
        path: `/foods/${id}`,
        options: { headers }
      });

      await restOperation.response;
      console.log('✅ Food deleted successfully');
    }, 'deleteFood');
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance(); 