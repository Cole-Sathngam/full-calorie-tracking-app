import { fetchAuthSession } from 'aws-amplify/auth';

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
  protein: number;
  carbs: number;
  fat: number;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    // API Configuration - Updated to use the correct CDK API Gateway endpoint
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://iy0tyajsdj.execute-api.us-east-2.amazonaws.com/prod';
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
      
      return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.warn('Failed to get auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  private handleApiError(error: unknown, operation: string): ApiError {
    console.error(`API Error in ${operation}:`, error);

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      
      if (err.name === 'TypeError' && err.message?.toString().includes('fetch')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection and try again.',
          retryable: true
        };
      }

      if (typeof err.status === 'number') {
        const statusCode = err.status as number;
        return {
          code: statusCode >= 500 ? 'SERVER_ERROR' : 'HTTP_ERROR',
          message: `HTTP ${statusCode}: Request failed`,
          statusCode,
          retryable: statusCode >= 500
        };
      }
    }

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
      
      if (apiError.retryable && retryCount < this.maxRetries) {
        console.log(`Retrying ${operationName} (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.executeWithRetry(operation, operationName, retryCount + 1);
      }
      
      throw apiError;
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async searchFood(name: string): Promise<Food[]> {
    return this.executeWithRetry(async () => {
      const result = await this.makeRequest<{ success: boolean; data: Food[] }>(
        `/foods/search?name=${encodeURIComponent(name)}`
      );
      return (result?.data as Food[]) || [];
    }, 'searchFood');
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance(); 