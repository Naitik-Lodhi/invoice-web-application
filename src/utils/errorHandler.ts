// src/utils/errorHandler.ts
import { AxiosError } from 'axios';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
  isRetryable?: boolean;
}

export const handleAPIError = (error: unknown): APIError => {
  // Check for network errors first
  if (!navigator.onLine) {
    return {
      message: 'No internet connection. Please check your network and try again.',
      code: 'NETWORK_ERROR',
      isRetryable: true,
    };
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Extract message from response
    let message = '';
    if (typeof data === 'string') {
      message = data;
    } else if (data?.error) {
      message = data.error;
    } else if (data?.message) {
      message = data.message;
    }

    // Handle network/connection errors (no response)
    if (!error.response) {
      if (error.code === 'ERR_NETWORK') {
        return {
          message: 'Unable to connect to server. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          isRetryable: true,
        };
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          message: 'Request timed out. Please try again.',
          code: 'TIMEOUT',
          isRetryable: true,
        };
      }
      return {
        message: 'Unable to connect to server. Please try again later.',
        code: 'CONNECTION_ERROR',
        isRetryable: true,
      };
    }

    switch (status) {
      case 400:
        // For login specific bad requests
        if (message.toLowerCase().includes('invalid') || 
            message.toLowerCase().includes('incorrect')) {
          return {
            message: message || 'Invalid request. Please check your input.',
            status: 400,
            code: 'BAD_REQUEST',
            isRetryable: false,
          };
        }
        return {
          message: 'Invalid request. Please check your input.',
          status: 400,
          code: 'BAD_REQUEST',
          isRetryable: false,
        };
        
      case 401:
        // For login page, this usually means wrong credentials
        if (message.toLowerCase().includes('password') || 
            message.toLowerCase().includes('email') ||
            message.toLowerCase().includes('credentials')) {
          return {
            message: 'Invalid email or password. Please try again.',
            status: 401,
            code: 'INVALID_CREDENTIALS',
            isRetryable: false,
          };
        }
        return {
          message: 'Your session has expired. Please login again.',
          status: 401,
          code: 'UNAUTHORIZED',
          isRetryable: false,
        };
        
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          status: 403,
          code: 'FORBIDDEN',
          isRetryable: false,
        };
        
      case 404:
        // Check if it's a user not found error
        if (message.toLowerCase().includes('user') && 
            message.toLowerCase().includes('not found')) {
          return {
            message: 'No account found with this email address.',
            status: 404,
            code: 'USER_NOT_FOUND',
            isRetryable: false,
          };
        }
        return {
          message: message || 'The requested resource was not found.',
          status: 404,
          code: 'NOT_FOUND',
          isRetryable: false,
        };
        
      case 409:
        return {
          message: message || 'This record already exists.',
          status: 409,
          code: 'CONFLICT',
          isRetryable: false,
        };
        
      case 412:
        return {
          message: message || 'The record was modified by another user. Please reload.',
          status: 412,
          code: 'PRECONDITION_FAILED',
          isRetryable: true,
        };
        
      case 422:
        return {
          message: message || 'Invalid data provided. Please check your input.',
          status: 422,
          code: 'UNPROCESSABLE_ENTITY',
          isRetryable: false,
        };
        
      case 429:
        return {
          message: 'Too many login attempts. Please wait a few minutes and try again.',
          status: 429,
          code: 'TOO_MANY_REQUESTS',
          isRetryable: true,
        };
        
      case 500:
        // Parse specific server errors
        if (typeof message === 'string') {
          // Connection timeout errors
          if (message.includes('Connection Timeout') || 
              message.includes('timeout period elapsed') ||
              message.includes('Post-Login') ||
              message.includes('Pre-Login')) {
            return {
              message: 'Our servers are experiencing high load. Please wait a moment and try again.',
              status: 500,
              code: 'SERVER_TIMEOUT',
              isRetryable: true,
            };
          }
          
          // Database connection errors
          if (message.includes('database') || 
              message.includes('SQL') ||
              message.includes('connection pool')) {
            return {
              message: 'We are experiencing technical difficulties. Please try again in a few moments.',
              status: 500,
              code: 'DATABASE_ERROR',
              isRetryable: true,
            };
          }
          
          // Generic server errors - don't expose technical details
          if (message.includes('Exception') || 
              message.includes('Error') ||
              message.includes('failed')) {
            return {
              message: 'Something went wrong on our end. Please try again later.',
              status: 500,
              code: 'INTERNAL_SERVER_ERROR',
              isRetryable: true,
            };
          }
        }
        
        return {
          message: 'A server error occurred. Our team has been notified. Please try again later.',
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          isRetryable: true,
        };
        
      case 502:
        return {
          message: 'Server is temporarily unavailable. Please try again in a few moments.',
          status: 502,
          code: 'BAD_GATEWAY',
          isRetryable: true,
        };
        
      case 503:
        return {
          message: 'Service is under maintenance. Please try again later.',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          isRetryable: true,
        };
        
      case 504:
        return {
          message: 'Request timed out. Please check your connection and try again.',
          status: 504,
          code: 'GATEWAY_TIMEOUT',
          isRetryable: true,
        };
        
      default:
        // Don't show HTML error pages or technical messages to users
        if (typeof message === 'string' && message.includes('<!DOCTYPE')) {
          return {
            message: 'An unexpected error occurred. Please try again.',
            status,
            code: 'UNKNOWN_ERROR',
            isRetryable: true,
          };
        }
        
        return {
          message: message || 'An unexpected error occurred. Please try again.',
          status,
          code: 'UNKNOWN_ERROR',
          isRetryable: true,
        };
    }
  }

  // Non-Axios error
  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        isRetryable: true,
      };
    }
    
    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'CLIENT_ERROR',
      isRetryable: false,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    isRetryable: true,
  };
};

// Helper function to check if error is retryable
export const isRetryableError = (error: APIError): boolean => {
  return error.isRetryable === true;
};

// Helper function for login-specific errors
export const getLoginErrorMessage = (error: unknown): string => {
  const apiError = handleAPIError(error);
  
  // Add context for login-specific messages
  if (apiError.code === 'NETWORK_ERROR') {
    return 'Unable to sign in. Please check your internet connection and try again.';
  }
  
  if (apiError.code === 'SERVER_TIMEOUT' || apiError.code === 'DATABASE_ERROR') {
    return 'Sign in is taking longer than usual. Please wait a moment and try again.';
  }
  
  return apiError.message;
};