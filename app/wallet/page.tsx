import Link from 'next/link';
import { WalletCards } from '@/components/wallet/WalletCards';
export const metadata={title:'Minha carteira'};
export default function WalletPage(){return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Sua conta</span><h1>Minha carteira</h1><p>Visualize o espaço reservado para saldo e movimentações.</p></div><WalletCards/><p style={{marginTop:22}}><Link className="section-link" href="/auctions">Explorar leilões →</Link></p></div>}
