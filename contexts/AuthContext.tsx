'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loginRequest, meRequest, type AuthUser } from '@/services/auth';
const TOKEN_KEY = 'showdecentavos:dev-session';
type AuthValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
};
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      queueMicrotask(() => { if (active) setIsLoading(false); });
      return () => { active = false; };
    }
    meRequest(token).then((profile) => {
      if (active) setUser(profile);
    }).catch(() => {
      // A failed profile check must not leave an unverified session active.
      sessionStorage.removeItem(TOKEN_KEY);
      if (active) setUser(null);
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const login = async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
  };
  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };
  const getToken = () => typeof window === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY);
  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, getToken }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requer AuthProvider');
  return value;
}
