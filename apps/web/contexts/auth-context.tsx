'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api/auth';
import type { AuthUser, LoginPayload } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  setSession: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = useCallback((user: AuthUser, accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 3600}`;
    setUser(user);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user, accessToken } = await authApi.login(payload);
    setSession(user, accessToken);
    router.push('/dashboard');
  }, [router, setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    document.cookie = 'accessToken=; path=/; max-age=0';
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
