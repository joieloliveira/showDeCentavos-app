'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
type User = { name: string; email: string };
type AuthValue = { user: User | null; setUser: (user: User | null) => void; isAuthenticated: boolean };
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({children}:{children:ReactNode}) { const [user,setUser] = useState<User|null>(null); return <AuthContext.Provider value={{user,setUser,isAuthenticated:!!user}}>{children}</AuthContext.Provider> }
export function useAuth(){ const value=useContext(AuthContext); if(!value) throw new Error('useAuth requer AuthProvider'); return value }
