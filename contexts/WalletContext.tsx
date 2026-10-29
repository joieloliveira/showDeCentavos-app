'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
type WalletContextValue = { balanceCents: number | null; setBalanceCents: (value: number | null) => void };
const WalletContext = createContext<WalletContextValue|null>(null);
export function WalletProvider({children}:{children:ReactNode}){ const [balanceCents,setBalanceCents]=useState<number|null>(null); return <WalletContext.Provider value={{balanceCents,setBalanceCents}}>{children}</WalletContext.Provider> }
export function useWallet(){ const v=useContext(WalletContext); if(!v) throw new Error('useWallet requer WalletProvider'); return v }
