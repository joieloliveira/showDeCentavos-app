'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { isCurrentSession } from '@/services/sessionGuard';
import { loginRequest, googleLoginRequest, meRequest, type AuthUser } from '@/services/auth';
const TOKEN_KEY = 'showdecentavos:dev-session';
type AuthValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  refreshUser: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionVersion = useRef(0);
  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem(TOKEN_KEY);
    const version = sessionVersion.current;
    if (!token) {
      queueMicrotask(() => { if (active) setIsLoading(false); });
      return () => { active = false; };
    }
    meRequest(token).then((profile) => {
      if (active && isCurrentSession(version, sessionVersion.current, token, sessionStorage.getItem(TOKEN_KEY))) setUser(profile);
    }).catch(() => {
      // A failed profile check must not leave an unverified session active.
      if (active && isCurrentSession(version, sessionVersion.current, token, sessionStorage.getItem(TOKEN_KEY))) {
        sessionStorage.removeItem(TOKEN_KEY);
        if (active) setUser(null);
      }
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const login = async (email: string, password: string) => {
    const version = ++sessionVersion.current;
    const result = await loginRequest(email, password);
    if (!isCurrentSession(version, sessionVersion.current, null, null)) throw new Error('Uma operação de sessão mais recente substituiu este login.');
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
  };
  const loginWithGoogle = async (credential: string) => {
    const version = ++sessionVersion.current;
    const result = await googleLoginRequest(credential);
    if (!isCurrentSession(version, sessionVersion.current, null, null)) throw new Error('Uma operação de sessão mais recente substituiu este login.');
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
  };
  const logout = () => {
    ++sessionVersion.current;
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };
  const getToken = useCallback(() => typeof window === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY), []);
  const refreshUser = async () => {
    const token = getToken();
    if (!token) throw new Error('Sessão não encontrada.');
    const version = sessionVersion.current;
    const profile = await meRequest(token);
    if (!isCurrentSession(version, sessionVersion.current, token, getToken())) throw new Error('A sessão mudou durante a atualização.');
    setUser(profile);
  };
  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, logout, getToken, refreshUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requer AuthProvider');
  return value;
}
