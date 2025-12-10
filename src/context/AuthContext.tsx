import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { setupInterceptors } from '../lib/api'; // Import the setup function

interface User {
  id: string;
  name: string;
  email: string;
  telefon: string;
}

interface Transactions {
  userTransactions: any[];
}

interface AuthContextType {
  user: User | null;
  userTranscations: Transactions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const api = import.meta.env.VITE_API_URL;

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userTranscations, setUserTransactions] = useState<Transactions | null>(null);

  const logout = async () => {
    try {
      const refresh_token = localStorage.getItem("refresh_token");
      if (refresh_token) {
        await axios.post(`${api}/auth/logout`, {
          refresh_token
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setUserTransactions(null);
    }
  };

  const refreshUser = async () => {
    const refresh_token = localStorage.getItem("refresh_token");
    const access_token = localStorage.getItem("access_token");

    if (!refresh_token || !access_token) {
      await logout();
      throw new Error("Missing tokens");
    }

    try {
      const response = await axios.post(
        `${api}/auth/verify`,
        { refresh_token },
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );

      const user = response.data.user;
      const userTransactions = response.data.transactions;
      setUser(user);
      setUserTransactions(userTransactions);
      
      if (response.data.new_acces_token) {
        localStorage.setItem("access_token", response.data.new_acces_token);
      }
    } catch (error: any) {
      await logout();
      throw error;
    }
  };

  useEffect(() => {
    // Setup axios interceptors with logout and refreshUser functions
    setupInterceptors(logout, refreshUser);

    const savedUser = localStorage.getItem('access_token');
    if (savedUser) {
      refreshUser().catch(() => {
        // If refresh fails, logout is already called in refreshUser
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${api}/loginDash`, {
        email: email,
        password: password,
      });
      
      const data = response.data;

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.loggedinuser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      userTranscations,
      isAuthenticated: !!user,
      isLoading,
      login,
      refreshUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};