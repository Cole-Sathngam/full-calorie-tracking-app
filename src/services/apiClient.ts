import { fetchAuthSession } from 'aws-amplify/auth';
import { getApiConfig } from '../config/api';

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  retryable?: boolean;
}

export interface Food {
  id: number;
  name: string;
  calories: number;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    const config = getApiConfig();
    this.baseUrl = config.cdkApiUrl;
    
    console.log('🔧 API Client initialized with base URL:', this.baseUrl);
    console.log('🔧 API Type:', config.type);
  }

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
      
      // Handle fetch errors
      if (err.name === 'TypeError' && err.message?.toString().includes('fetch')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection and try again.',
          retryable: true
        };
      }

      // Handle HTTP response errors
      if (typeof err.status === 'number') {
        const statusCode = err.status as number;
        
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
              message: `HTTP ${statusCode}: Request failed`,
              statusCode,
              retryable: statusCode >= 500
            };
        }
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

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    console.log('🌐 Making request to:', fullUrl);
    console.log('🔑 Headers:', headers);
    console.log('📦 Options:', options);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error body:', errorText);
      
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log('✅ Response data:', data);
    return data;
  }

  async getFoods(): Promise<Food[]> {
    return this.executeWithRetry(async () => {
      console.log('🚀 Fetching foods from API...');
      
      const result = await this.makeRequest<{ success: boolean; data: Food[] }>('/foods');
      
      console.log('✅ Foods fetched successfully:', result);
      
      // Handle the response structure
      if (result?.data && Array.isArray(result.data)) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result as Food[];
      } else {
        // Fallback - return empty array
        return [];
      }
    }, 'getFoods');
  }

  async searchFood(name: string): Promise<Food[]> {
    return this.executeWithRetry(async () => {
      console.log('🔍 Searching for food:', name);
      
      const result = await this.makeRequest<{ success: boolean; data: Food[] }>(
        `/foods/search?name=${encodeURIComponent(name)}`
      );
      
      console.log('✅ Food search completed:', result);
      return (result?.data as Food[]) || [];
    }, 'searchFood');
  }

  async createFood(name: string, calories: number): Promise<Food> {
    return this.executeWithRetry(async () => {
      console.log('➕ Creating food:', { name, calories });
      
      const result = await this.makeRequest<{ success: boolean; data: Food }>('/foods', {
        method: 'POST',
        body: JSON.stringify({ name, calories }),
      });
      
      console.log('✅ Food created successfully:', result);
      return (result?.data || result) as Food;
    }, 'createFood');
  }

  async updateFood(id: string, name: string, calories: number): Promise<Food> {
    return this.executeWithRetry(async () => {
      console.log('📝 Updating food:', { id, name, calories });
      
      const result = await this.makeRequest<{ success: boolean; data: Food }>(`/foods/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, calories }),
      });
      
      console.log('✅ Food updated successfully:', result);
      return (result?.data || result) as Food;
    }, 'updateFood');
  }

  async deleteFood(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      console.log('🗑️ Deleting food:', id);
      
      await this.makeRequest<void>(`/foods/${id}`, {
        method: 'DELETE',
      });
      
      console.log('✅ Food deleted successfully');
    }, 'deleteFood');
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance(); 