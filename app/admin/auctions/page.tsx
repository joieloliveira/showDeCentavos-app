import { AdminAuctionsPanel } from '@/components/admin/AdminAuctionsPanel';
export const metadata = { title: 'Administração | Leilões' };
export default function Page() { return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Administração · Leilões</span><h1>Gerenciar leilões</h1><p>Vitrine demonstrativa de produtos e disputas.</p></div><AdminAuctionsPanel /></div>; }
