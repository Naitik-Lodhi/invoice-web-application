// src/context/AuthContext.tsx
// REPLACE ENTIRE FILE

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import type { SignupData, AuthResponse } from "../services/authService";

interface User {
  userID: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Company {
  companyID: number;
  companyName: string;
  currencySymbol: string;
  logoUrl?: string;
  thumbnailUrl?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthData: (
    user: User,
    company: Company,
    token: string,
    rememberMe: boolean
  ) => Promise<void>;
  signup: (data: SignupData) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper functions
const storage = {
  set: (key: string, value: any, rememberMe: boolean = true) => {
    const data = typeof value === "object" ? JSON.stringify(value) : value;
    if (rememberMe) {
      localStorage.setItem(key, data);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, data);
      localStorage.removeItem(key);
    }
  },

  get: (key: string): any => {
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      try {
        return JSON.parse(sessionData);
      } catch {
        return sessionData;
      }
    }

    const localData = localStorage.getItem(key);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch {
        return localData;
      }
    }

    return null;
  },

  remove: (key: string) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Helper function to fetch company logos with retry logic
  const fetchCompanyLogos = async (
    companyID: number,
    retries: number = 3,
    delay: number = 1000
  ): Promise<{ logoUrl: string; thumbnailUrl: string }> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Fetching logos (attempt ${attempt}/${retries})...`);

        const [logoUrl, thumbnailUrl] = await Promise.all([
          authService.getCompanyLogo(companyID),
          authService.getCompanyLogoThumbnail(companyID),
        ]);

        if (logoUrl && thumbnailUrl) {
          console.log("✅ Logo URLs fetched successfully");
          return { logoUrl, thumbnailUrl };
        }

        if (attempt < retries) {
          console.warn(`⚠️ Empty logo URLs, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Logo fetch attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.warn("⚠️ Failed to fetch logos after all retries");
    return { logoUrl: "", thumbnailUrl: "" };
  };

  // ✅ Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = storage.get("token");
        const savedUser = storage.get("user");
        const savedCompany = storage.get("company");

        if (token && savedUser && savedCompany) {
          setUser(savedUser);

          // If logo URLs not in storage, fetch them
          if (savedCompany.companyID && !savedCompany.logoUrl) {
            try {
              const { logoUrl, thumbnailUrl } = await fetchCompanyLogos(
                savedCompany.companyID,
                3,
                1500
              );

              const updatedCompany = {
                ...savedCompany,
                logoUrl: logoUrl || undefined,
                thumbnailUrl: thumbnailUrl || undefined,
              };

              setCompany(updatedCompany);
              
              // Update storage with logo URLs
              storage.set(
                "company",
                updatedCompany,
                !!localStorage.getItem("token")
              );
            } catch (err) {
              console.warn("Failed to fetch company logos:", err);
              setCompany(savedCompany);
            }
          } else {
            setCompany(savedCompany);
          }
        }
      } catch (error) {
        console.error("Error parsing saved auth data:", error);
        storage.remove("token");
        storage.remove("user");
        storage.remove("company");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ Set auth data with logo fetching
  const setAuthData = async (
    userData: User,
    companyData: Company,
    token: string,
    rememberMe: boolean = true
  ) => {
    try {
      let enrichedCompany = companyData;

      if (companyData.companyID) {
        console.log("🔄 Fetching company logos for ID:", companyData.companyID);

        try {
          const { logoUrl, thumbnailUrl } = await fetchCompanyLogos(
            companyData.companyID,
            3,
            1500
          );

          console.log("✅ Logo URL:", logoUrl);
          console.log("✅ Thumbnail URL:", thumbnailUrl);

          enrichedCompany = {
            ...companyData,
            logoUrl: logoUrl || undefined,
            thumbnailUrl: thumbnailUrl || undefined,
          };
        } catch (logoError) {
          console.warn("⚠️ Failed to fetch company logos:", logoError);
          enrichedCompany = companyData;
        }
      }

      // Save to storage
      storage.set("token", token, rememberMe);
      storage.set("user", userData, rememberMe);
      storage.set("company", enrichedCompany, rememberMe);

      // Update state
      setUser(userData);
      setCompany(enrichedCompany);

      console.log("✅ Auth data set successfully");
    } catch (error) {
      console.error("❌ Error in setAuthData:", error);

      // Fallback
      storage.set("token", token, rememberMe);
      storage.set("user", userData, rememberMe);
      storage.set("company", companyData, rememberMe);

      setUser(userData);
      setCompany(companyData);
    }
  };

  // ✅ Signup method
  const signup = async (data: SignupData) => {
    try {
      console.log("📤 Starting signup process...");

      const response = await authService.signup(data);

      console.log("✅ Signup successful, setting auth data...");

      await setAuthData(response.user, response.company, response.token, true);

      console.log("✅ Auth data set, signup complete");

      return response;
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to create account. Please try again."
      );
    }
  };

  // ✅ Logout
  const logout = () => {
    // Clear logo from localStorage
    if (company?.companyID) {
      localStorage.removeItem(`company_logo_base64_${company.companyID}`);
      console.log("🗑️ Cleared logo from localStorage");
    }

    storage.remove("token");
    storage.remove("user");
    storage.remove("company");

    setUser(null);
    setCompany(null);

    window.location.href = "/login";
  };

  const value: AuthContextType = {
    user,
    company,
    isAuthenticated: !!user,
    isLoading,
    setAuthData,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};