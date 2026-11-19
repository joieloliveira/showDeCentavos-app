import Link from 'next/link';
import { WalletGate } from '@/components/wallet/WalletGate';
export const metadata = { title: 'Minha carteira' };
export default function WalletPage() {
  return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Sua conta</span><h1>Minha carteira</h1><p>Área reservada para saldo e movimentações.</p></div><WalletGate/><p style={{ marginTop: 22 }}><Link className="section-link" href="/auctions">Explorar leilões →</Link></p></div>;
}
