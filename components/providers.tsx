'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataSiteProvider } from '@/contexts/DataSiteContext';
import { WalletProvider } from '@/contexts/WalletContext';
export function Providers({children}:{children:React.ReactNode}){return <AuthProvider><WalletProvider><DataSiteProvider>{children}</DataSiteProvider></WalletProvider></AuthProvider>}
