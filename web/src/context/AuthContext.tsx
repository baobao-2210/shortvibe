import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, AuthResponse } from '../services/api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    fullName?: string;
  }) => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shortvibe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('shortvibe_token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('shortvibe_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('shortvibe_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('shortvibe_token');
          localStorage.removeItem('shortvibe_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (res: AuthResponse) => {
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('shortvibe_token', res.accessToken);
    localStorage.setItem('shortvibe_user', JSON.stringify(res.user));
    closeAuthModal();
  };

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await authApi.login(usernameOrEmail, password);
    handleAuthSuccess(res);
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    fullName?: string;
  }) => {
    const res = await authApi.register(data);
    handleAuthSuccess(res);
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updated };
      localStorage.setItem('shortvibe_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shortvibe_token');
    localStorage.removeItem('shortvibe_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
