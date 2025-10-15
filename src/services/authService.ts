// src/services/authService.ts
import axiosInstance from '../api/axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupData {
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  CompanyName: string;
  Address: string;
  City: string;
  ZipCode: string;
  Industry: string;
  CurrencySymbol: string;
  logo?: File;
}

export interface AuthResponse {
  token: string;
  user: {
    userID: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  company: {
    companyID: number;
    companyName: string;
    currencySymbol: string;
  };
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      console.log('📤 Sending login request:', { email: data.email });
      
      const response = await axiosInstance.post(API_ENDPOINTS.auth.LOGIN, {
        email: data.email,
        password: data.password,
      });
      
      console.log('📥 Login response:', response.data);
      
      // Store auth data based on rememberMe flag
      if (response.data.token) {
        const storage = data.rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', response.data.token);
        storage.setItem('user', JSON.stringify(response.data.user));
        storage.setItem('company', JSON.stringify(response.data.company));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login request failed:', error);
      
      // Re-throw with proper error message
      if (error.response) {
        // Server responded with error
        console.error('Server error response:', error.response.data);
        throw error; // Let the caller handle it
      } else if (error.request) {
        // Request made but no response
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        // Something else happened
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key as keyof SignupData];
      if (value !== undefined && value !== null) {
        if (key === 'logo' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await axiosInstance.post(
      API_ENDPOINTS.auth.SIGNUP, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('company', JSON.stringify(response.data.company));
    }
    
    return response.data;
  },

  getCompanyLogo: async (companyId: number): Promise<string> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.auth.GET_COMPANY_LOGO(companyId)
    );
    return response.data;
  },

  getCompanyLogoThumbnail: async (companyId: number): Promise<string> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.auth.GET_COMPANY_LOGO_THUMBNAIL(companyId)
    );
    return response.data;
  },

  logout: () => {
    ['token', 'user', 'company'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },

  isAuthenticated: (): boolean => {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  },

  getToken: (): string | null => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },
};