'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { WalletCards } from '@/components/wallet/WalletCards';
import { PixDepositPreview } from '@/components/wallet/PixDepositPreview';
import { PixDepositTracker } from '@/components/wallet/PixDepositTracker';
export function WalletGate() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="panel">Verificando sua sessão...</div>;
  if (!user) return <div className="panel"><h2>Entre para acessar sua carteira</h2><p>Esta área é reservada a usuários autenticados.</p><Link className="btn-primary" href="/login?next=/wallet">Fazer login</Link></div>;
  return <><p>Olá, {user.name}!</p><WalletCards /><PixDepositPreview /><PixDepositTracker /></>;
}
