import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, AuthResponse } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('shortvibe_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('shortvibe_token');
      const storedUser = localStorage.getItem('shortvibe_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          const me = await authApi.getMe();
          if (me) {
            setUser(me);
            localStorage.setItem('shortvibe_user', JSON.stringify(me));
          }
        } catch {
          // Token expired or server unreachable
          localStorage.removeItem('shortvibe_token');
          localStorage.removeItem('shortvibe_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, pass: string) => {
    setIsLoading(true);
    try {
      const res: AuthResponse = await authApi.login(usernameOrEmail, pass);
      localStorage.setItem('shortvibe_token', res.accessToken);
      localStorage.setItem('shortvibe_user', JSON.stringify(res.user));
      setToken(res.accessToken);
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; username: string; password: string; displayName?: string }) => {
    setIsLoading(true);
    try {
      const res: AuthResponse = await authApi.register(data);
      localStorage.setItem('shortvibe_token', res.accessToken);
      localStorage.setItem('shortvibe_user', JSON.stringify(res.user));
      setToken(res.accessToken);
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('shortvibe_token');
    localStorage.removeItem('shortvibe_user');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshUser = async () => {
    try {
      const me = await authApi.getMe();
      if (me) {
        setUser(me);
        localStorage.setItem('shortvibe_user', JSON.stringify(me));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        refreshUser,
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
