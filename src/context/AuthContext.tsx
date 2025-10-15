// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { SignupData, AuthResponse } from '../services/authService';

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
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthData: (user: User, company: Company, token: string, rememberMe: boolean) => void;
  signup: (data: SignupData) => Promise<AuthResponse>;  // Add signup method
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper functions (same as before)
const storage = {
  set: (key: string, value: any, rememberMe: boolean = true) => {
    const data = typeof value === 'object' ? JSON.stringify(value) : value;
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
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = storage.get('token');
        const savedUser = storage.get('user');
        const savedCompany = storage.get('company');
        
        if (token && savedUser && savedCompany) {
          setUser(savedUser);
          setCompany(savedCompany);
        }
      } catch (error) {
        console.error('Error parsing saved auth data:', error);
        storage.remove('token');
        storage.remove('user');
        storage.remove('company');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const setAuthData = (userData: User, companyData: Company, token: string, rememberMe: boolean = true) => {
    // Save to appropriate storage
    storage.set('token', token, rememberMe);
    storage.set('user', userData, rememberMe);
    storage.set('company', companyData, rememberMe);
    
    // Update state
    setUser(userData);
    setCompany(companyData);
  };

  // Signup method - automatic login after successful signup
  const signup = async (data: SignupData) => {
    try {
      // Call signup API
      const response = await authService.signup(data);
      
      // Automatically login the user after successful signup
      // Signup always uses localStorage (rememberMe = true by default)
      setAuthData(response.user, response.company, response.token, true);
      
      return response;
    } catch (error: any) {
      console.error('Signup error:', error);
      // Re-throw the error so the component can handle it
      throw new Error(
        error.response?.data?.message || 
        error.response?.data || 
        'Failed to create account. Please try again.'
      );
    }
  };

  const logout = () => {
    storage.remove('token');
    storage.remove('user');
    storage.remove('company');
    
    setUser(null);
    setCompany(null);
    
    window.location.href = '/login';
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};