// src/constants/apiEndpoints.ts

/**
 * Base URL for the API.
 * It's a good practice to use environment variables for this.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Collection of all API endpoints used in the application.
 * Grouped by feature for better organization.
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    checkEmail: '/auth/check-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // User management endpoints
  users: {
    getAll: '/users',
    // Example of an endpoint with a dynamic parameter
    getById: (userId: string) => `/users/${userId}`, 
  },

  // Invoice endpoints (future use)
  invoices: {
    create: '/invoices',
    getAll: '/invoices',
    getById: (invoiceId: string) => `/invoices/${invoiceId}`,
    update: (invoiceId: string) => `/invoices/${invoiceId}`,
    delete: (invoiceId: string) => `/invoices/${invoiceId}`,
  },

  // Add more features as the app grows
  // e.g., clients, products, etc.
};