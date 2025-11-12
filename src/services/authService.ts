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
    return response.data;
  },

  getCompanyLogo: async (companyId: number): Promise<string> => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.auth.GET_COMPANY_LOGO(companyId)
      );

      let logoUrl = response.data;
      console.log("📥 Original logo URL:", logoUrl);

      if (typeof logoUrl === "string") {
        // ✅ Step 1: Replace ALL backslashes (encoded and unencoded)
        logoUrl = logoUrl.replace(/\\/g, "/").replace(/%5C/gi, "/");

        // ✅ Step 2: Encode spaces properly
        if (logoUrl.includes("blob.core.windows.net")) {
          try {
            const urlObj = new URL(logoUrl);

            // Encode pathname segments individually
            const pathSegments = urlObj.pathname.split("/");
            urlObj.pathname = pathSegments
              .map((segment) => {
                // Skip empty segments and already encoded ones
                if (!segment || segment.includes("%20")) return segment;
                // Encode spaces and special chars
                return segment.includes(" ")
                  ? encodeURIComponent(segment)
                  : segment;
              })
              .join("/");

            logoUrl = urlObj.toString();
          } catch (urlError) {
            console.error("URL parsing failed:", urlError);
          }
        }

        console.log("🔧 Processed logo URL:", logoUrl);
      }

      return logoUrl;
    } catch (error) {
      console.error("❌ Failed to get company logo:", error);
      return ""; // ✅ Return empty string instead of throwing
    }
  },

  getCompanyLogoThumbnail: async (companyId: number): Promise<string> => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.auth.GET_COMPANY_LOGO_THUMBNAIL(companyId)
      );

      let thumbnailUrl = response.data;
      console.log("📥 Original thumbnail URL:", thumbnailUrl);

      if (typeof thumbnailUrl === "string") {
        // ✅ Step 1: Replace ALL backslashes
        thumbnailUrl = thumbnailUrl.replace(/\\/g, "/").replace(/%5C/gi, "/");

        // ✅ Step 2: Encode spaces properly
        if (thumbnailUrl.includes("blob.core.windows.net")) {
          try {
            const urlObj = new URL(thumbnailUrl);

            const pathSegments = urlObj.pathname.split("/");
            urlObj.pathname = pathSegments
              .map((segment) => {
                if (!segment || segment.includes("%20")) return segment;
                return segment.includes(" ")
                  ? encodeURIComponent(segment)
                  : segment;
              })
              .join("/");

            thumbnailUrl = urlObj.toString();
          } catch (urlError) {
            console.error("URL parsing failed:", urlError);
          }
        }

        console.log("🔧 Processed thumbnail URL:", thumbnailUrl);
      }

      return thumbnailUrl;
    } catch (error) {
      console.error("❌ Failed to get company logo thumbnail:", error);
      return ""; // ✅ Return empty string
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


  checkDuplicateEmail: async (email: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.auth.CHECK_DUPLICATE_EMAIL,
        {
          params: { Email: email },
          validateStatus: (status) => {
            // ✅ Accept both 200 and 409 as valid responses
            // 409 = Conflict = Email already exists
            return status === 200 || status === 409;
          },
        }
      );

      // ✅ If status is 409, email is duplicate
      if (response.status === 409) {
        return true;
      }

      // ✅ If status is 200, check response body
      if (response.status === 200) {
        const data = response.data;

        if (typeof data === "boolean") {
          return data;
        } else if (typeof data === "string") {
          return data.toLowerCase() === "true";
        }
      }

      return false;
    } catch (error: any) {
      console.error("❌ Failed to check duplicate email:", error);
      // Return false to allow form submission if API fails
      return false;
    }
  },
};
