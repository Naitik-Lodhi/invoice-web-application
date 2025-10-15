// src/utils/errorHandler.ts
import { AxiosError } from 'axios';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

export const handleAPIError = (error: unknown): APIError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.response?.data?.message;

    switch (status) {
      case 400:
        return {
          message: message || 'Invalid request. Please check your input.',
          status: 400,
          code: 'BAD_REQUEST',
        };
      case 401:
        return {
          message: 'Your session has expired. Please login again.',
          status: 401,
          code: 'UNAUTHORIZED',
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          status: 403,
          code: 'FORBIDDEN',
        };
      case 404:
        return {
          message: message || 'The requested resource was not found.',
          status: 404,
          code: 'NOT_FOUND',
        };
      case 409:
        return {
          message: message || 'This record already exists.',
          status: 409,
          code: 'CONFLICT',
        };
      case 412:
        return {
          message: message || 'The record was modified by another user. Please reload.',
          status: 412,
          code: 'PRECONDITION_FAILED',
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          status: 429,
          code: 'TOO_MANY_REQUESTS',
        };
      case 500:
        return {
          message: 'A server error occurred. Please try again later.',
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
        };
      default:
        return {
          message: message || 'An unexpected error occurred.',
          status,
          code: 'UNKNOWN_ERROR',
        };
    }
  }

  // Non-Axios error
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'CLIENT_ERROR',
    };
  }

  return {
    message: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
  };
};

// Usage example:
// try {
//   await someAPICall();
// } catch (error) {
//   const apiError = handleAPIError(error);
//   console.error(apiError.message);
// }