'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import { fetchWalletBalance, fetchWalletTransactions, type WalletTransaction } from '@/services/wallet';
type WalletContextValue = {
  balanceCents: number | null;
  transactions: WalletTransaction[];
  page: number;
  totalPages: number;
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  changePage: (page: number) => Promise<void>;
};
const WalletContext = createContext<WalletContextValue | null>(null);
export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [requestedPage, setRequestedPage] = useState(1);
  const refresh = useCallback(async () => { setVersion((v) => v + 1); }, []);
  const changePage = useCallback(async (nextPage: number) => {
    if (Number.isSafeInteger(nextPage) && nextPage > 0) setRequestedPage(nextPage);
  }, []);
  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      queueMicrotask(() => {
        if (!active) return;
        setBalanceCents(null); setTransactions([]); setPage(1); setRequestedPage(1);
        setTotalPages(0); setTotalTransactions(0); setError(null); setIsLoading(false);
      });
      return () => { active = false; };
    }
    const token = getToken();
    if (!token) {
      queueMicrotask(() => { if (active) { setError('Sessão não encontrada. Entre novamente.'); setIsLoading(false); } });
      return () => { active = false; };
    }
    queueMicrotask(() => { if (active) { setIsLoading(true); setError(null); } });
    Promise.all([fetchWalletBalance(token), fetchWalletTransactions(token, requestedPage)])
      .then(([balance, history]) => {
        if (!active) return;
        setBalanceCents(balance);
        setTransactions(history.transactions);
        setPage(history.pagination.page);
        setTotalPages(history.pagination.totalPages);
        setTotalTransactions(history.pagination.total);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setBalanceCents(null);
        setTransactions([]);
        setError(getApiError(err));
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [authLoading, user, getToken, requestedPage, version]);
  return <WalletContext.Provider value={{ balanceCents, transactions, page, totalPages, totalTransactions, isLoading, error, refresh, changePage }}>{children}</WalletContext.Provider>;
}
export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet requer WalletProvider');
  return value;
}
