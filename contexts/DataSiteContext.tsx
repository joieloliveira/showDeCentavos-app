'use client';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { demoAuctions } from '@/data/demo-auctions';
import type { Auction } from '@/types/auction';
type DataContextValue = { auctions: Auction[]; filter: string; setFilter: (value: string) => void; visibleAuctions: Auction[] };
const DataContext = createContext<DataContextValue | null>(null);
export function DataSiteProvider({ children }: { children: ReactNode }) { const [filter, setFilter] = useState('Todos'); const auctions = demoAuctions; const visibleAuctions = useMemo(() => filter === 'Todos' ? auctions : auctions.filter((a) => a.category === filter || (filter === 'Ao vivo' && a.status === 'live') || (filter === 'Em breve' && a.status === 'upcoming')), [filter, auctions]); return <DataContext.Provider value={{ auctions, filter, setFilter, visibleAuctions }}>{children}</DataContext.Provider> }
export function useDataSite() { const ctx = useContext(DataContext); if (!ctx) throw new Error('useDataSite deve ser usado dentro de DataSiteProvider'); return ctx; }
