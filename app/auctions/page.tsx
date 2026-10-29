import { AuctionGrid } from '@/components/auctions/AuctionGrid';
export const metadata={title:'Leilões'};
export default function AuctionsPage(){return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Descubra oportunidades</span><h1>Todos os leilões</h1><p>Explore os leilões demonstrativos por categoria. Nenhum lance real pode ser realizado nesta versão.</p></div><AuctionGrid/></div>}
