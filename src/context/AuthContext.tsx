// src/context/AuthContext.tsx
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
  logoUrl?: string; // ✅ Added
  thumbnailUrl?: string; // ✅ Added
  address?: string; // ✅ Added (for invoice)
  city?: string; // ✅ Added (for invoice)
  zipCode?: string; // ✅ Added (for invoice)
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
  ) => Promise<void>; // ✅ Changed to async
  signup: (data: SignupData) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper functions (keep as is)
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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = storage.get("token");
        const savedUser = storage.get("user");
        const savedCompany = storage.get("company");

        if (token && savedUser && savedCompany) {
          setUser(savedUser);

          // ✅ If logo URLs not in storage, fetch them
          if (savedCompany.companyID && !savedCompany.logoUrl) {
            try {
              const [logoUrl, thumbnailUrl] = await Promise.all([
                authService.getCompanyLogo(savedCompany.companyID),
                authService.getCompanyLogoThumbnail(savedCompany.companyID),
              ]);

              const updatedCompany = {
                ...savedCompany,
                logoUrl,
                thumbnailUrl,
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
              setCompany(savedCompany); // Use company data without logos
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

  // ✅ Update setAuthData to fetch logos
  const setAuthData = async (
    userData: User,
    companyData: Company,
    token: string,
    rememberMe: boolean = true
  ) => {
    try {
      let enrichedCompany = companyData;

      // ✅ Only fetch logos if companyID exists
      if (companyData.companyID) {
        try {
          console.log(
            "🔄 Fetching company logos for ID:",
            companyData.companyID
          );

          const [logoUrl, thumbnailUrl] = await Promise.all([
            authService.getCompanyLogo(companyData.companyID),
            authService.getCompanyLogoThumbnail(companyData.companyID),
          ]);

          console.log("✅ Logo URL:", logoUrl);
          console.log("✅ Thumbnail URL:", thumbnailUrl);

          enrichedCompany = {
            ...companyData,
            logoUrl,
            thumbnailUrl,
          };
        } catch (logoError) {
          console.warn("⚠️ Failed to fetch company logos:", logoError);
          // Continue without logos
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

      // Fallback: Save without logos
      storage.set("token", token, rememberMe);
      storage.set("user", userData, rememberMe);
      storage.set("company", companyData, rememberMe);

      setUser(userData);
      setCompany(companyData);
    }
  };

  // ✅ Update signup method
  const signup = async (data: SignupData) => {
    try {
      const response = await authService.signup(data);

      // Automatically login with logo fetch
      await setAuthData(response.user, response.company, response.token, true);

      return response;
    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to create account. Please try again."
      );
    }
  };

  const logout = () => {
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
