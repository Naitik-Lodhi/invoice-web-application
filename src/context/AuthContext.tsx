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

const convertAndSaveLogoToBase64 = async (url: string, companyId: number): Promise<void> => {
  try {
    console.log("🔄 Converting logo to base64 for localStorage...");
    
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      console.warn(`⚠️ Logo fetch failed: ${response.status}`);
      return;
    }

    const blob = await response.blob();
    
    if (!blob.type.startsWith('image/')) {
      console.warn(`⚠️ Invalid image type: ${blob.type}`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      localStorage.setItem(`company_logo_base64_${companyId}`, base64data);
      console.log(`✅ Logo saved to localStorage (${(base64data.length / 1024).toFixed(2)} KB)`);
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error("❌ Failed to convert logo to base64:", error);
  }
};

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
  refreshLogo: () => Promise<void>; // ✅ NEW: Manually refresh logo when SAS expires
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

        // ✅ Check if URLs are valid (not empty)
        if (logoUrl && thumbnailUrl) {
          console.log("✅ Logo URLs fetched successfully");
          return { logoUrl, thumbnailUrl };
        }

        // ✅ If empty, retry after delay
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

    // ✅ Return empty strings if all retries fail
    console.warn("⚠️ Failed to fetch logos after all retries");
    return { logoUrl: "", thumbnailUrl: "" };
  };

  // ✅ NEW: Refresh logo function (for when SAS token expires)
  const refreshLogo = async () => {
    if (!company?.companyID) {
      console.warn("⚠️ No company ID available for logo refresh");
      return;
    }

    try {
      console.log("🔄 Refreshing company logos...");

      const { logoUrl, thumbnailUrl } = await fetchCompanyLogos(
        company.companyID,
        3,
        1500
      );

      if (logoUrl || thumbnailUrl) {
        const updatedCompany = {
          ...company,
          logoUrl: logoUrl || company.logoUrl,
          thumbnailUrl: thumbnailUrl || company.thumbnailUrl,
        };

        // Update state
        setCompany(updatedCompany);

        // Update storage
        const isLocalStorage = !!localStorage.getItem("token");
        storage.set("company", updatedCompany, isLocalStorage);

        console.log("✅ Logos refreshed successfully");
        console.log("   New logo URL:", logoUrl);
        console.log("   New thumbnail URL:", thumbnailUrl);
      } else {
        console.warn("⚠️ Logo refresh returned empty URLs");
      }
    } catch (error) {
      console.error("❌ Failed to refresh logos:", error);
    }
  };

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
          // ✅ Use retry logic
          const { logoUrl, thumbnailUrl } = await fetchCompanyLogos(
            companyData.companyID,
            3, // 3 retries
            1500 // 1.5 second delay between retries
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

      // ✅ Save to storage
      storage.set("token", token, rememberMe);
      storage.set("user", userData, rememberMe);
      storage.set("company", enrichedCompany, rememberMe);

      // ✅ Update state
      setUser(userData);
      setCompany(enrichedCompany);

      console.log("✅ Auth data set successfully");
      console.log("✅ Final company data:", enrichedCompany);
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

  // ✅ Signup method with logo fetch
  const signup = async (data: SignupData) => {
    try {
      console.log("📤 Starting signup process...");

      const response = await authService.signup(data);

      console.log("✅ Signup successful, setting auth data...");

      // ✅ Automatically login with logo fetch (with retry)
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

const logout = () => {
  // ✅ Clear logo from localStorage
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
    refreshLogo, // ✅ NEW: Export refresh function
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