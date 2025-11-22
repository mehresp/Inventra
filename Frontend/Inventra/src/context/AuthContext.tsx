/**
 * Authentication Context
 */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import type { User, UserProfile, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      
      // Refresh profile
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      const data: AuthResponse = response.data;

      setToken(data.access);
      setUser(data.user);
      setRole(data.role || null);

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.role) {
        localStorage.setItem('role', data.role);
      }

      // Fetch profile
      await refreshProfile();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    try {
      const response = await authApi.register(data);
      const authData: AuthResponse = response.data;

      setToken(authData.access);
      setUser(authData.user);
      setRole(authData.role || null);

      localStorage.setItem('access_token', authData.access);
      localStorage.setItem('refresh_token', authData.refresh);
      localStorage.setItem('user', JSON.stringify(authData.user));
      if (authData.role) {
        localStorage.setItem('role', authData.role);
      }

      // Fetch profile
      await refreshProfile();
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    setRole(null);

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  const refreshProfile = async () => {
    try {
      const response = await authApi.getProfile();
      const profileData = response.data;
      setProfile(profileData);
      if (profileData.role) {
        setRole(profileData.role);
        localStorage.setItem('role', profileData.role);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  const value: AuthContextType = {
    user,
    profile,
    token,
    role,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    hasRole,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

