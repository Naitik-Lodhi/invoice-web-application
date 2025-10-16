// src/services/authService.ts
import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

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
      console.log("📤 Sending login request:", { email: data.email });

      const response = await axiosInstance.post(API_ENDPOINTS.auth.LOGIN, {
        email: data.email,
        password: data.password,
      });

      console.log("📥 Login response:", response.data);

      // Store auth data based on rememberMe flag
      if (response.data.token) {
        const storage = data.rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", response.data.token);
        storage.setItem("user", JSON.stringify(response.data.user));
        storage.setItem("company", JSON.stringify(response.data.company));
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Login request failed:", error);

      // Re-throw with proper error message
      if (error.response) {
        // Server responded with error
        console.error("Server error response:", error.response.data);
        throw error; // Let the caller handle it
      } else if (error.request) {
        // Request made but no response
        throw new Error(
          "No response from server. Please check your internet connection."
        );
      } else {
        // Something else happened
        throw new Error("An unexpected error occurred. Please try again.");
      }
    }
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof SignupData];
      if (value !== undefined && value !== null) {
        if (key === "logo" && value instanceof File) {
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
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("company", JSON.stringify(response.data.company));
    }

    return response.data;
  },

   getCompanyLogo: async (companyId: number): Promise<string> => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.auth.GET_COMPANY_LOGO(companyId)
      );
      
      let logoUrl = response.data;
      
      if (typeof logoUrl === 'string') {
        console.log("📥 Original logo URL:", logoUrl);
        
        // ✅ Replace backslashes with forward slashes
        logoUrl = logoUrl.replace(/\\/g, '/');
        
        // ✅ Only encode spaces in the path portion (not the whole URL)
        if (logoUrl.includes('blob.core.windows.net')) {
          const urlObj = new URL(logoUrl);
          
          // Encode only the pathname (spaces → %20)
          urlObj.pathname = urlObj.pathname
            .split('/')
            .map(segment => {
              // If segment has spaces, encode it
              if (segment.includes(' ')) {
                return encodeURIComponent(segment);
              }
              return segment;
            })
            .join('/');
          
          logoUrl = urlObj.toString();
        }
        
        console.log("🔧 Processed logo URL:", logoUrl);
      }
      
      return logoUrl;
    } catch (error) {
      console.error("❌ Failed to get company logo:", error);
      throw error;
    }
  },

  getCompanyLogoThumbnail: async (companyId: number): Promise<string> => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.auth.GET_COMPANY_LOGO_THUMBNAIL(companyId)
      );
      
      let thumbnailUrl = response.data;
      
      if (typeof thumbnailUrl === 'string') {
        console.log("📥 Original thumbnail URL:", thumbnailUrl);
        
        // ✅ Replace backslashes with forward slashes
        thumbnailUrl = thumbnailUrl.replace(/\\/g, '/');
        
        // ✅ Only encode spaces in the path portion
        if (thumbnailUrl.includes('blob.core.windows.net')) {
          const urlObj = new URL(thumbnailUrl);
          
          urlObj.pathname = urlObj.pathname
            .split('/')
            .map(segment => {
              if (segment.includes(' ')) {
                return encodeURIComponent(segment);
              }
              return segment;
            })
            .join('/');
          
          thumbnailUrl = urlObj.toString();
        }
        
        console.log("🔧 Processed thumbnail URL:", thumbnailUrl);
      }
      
      return thumbnailUrl;
    } catch (error) {
      console.error("❌ Failed to get company logo thumbnail:", error);
      throw error;
    }
  },

  logout: () => {
    ["token", "user", "company"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },

  isAuthenticated: (): boolean => {
    return !!(localStorage.getItem("token") || sessionStorage.getItem("token"));
  },

  getToken: (): string | null => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  },
};
