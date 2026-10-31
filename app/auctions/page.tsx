import { RegisteredAuctions } from '@/components/auctions/RegisteredAuctions';
export const metadata={title:'Leilões'};
export default function AuctionsPage(){return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Descubra oportunidades</span><h1>Todos os leilões</h1><p>Explore os leilões cadastrados. A participação por lances ainda não está habilitada nesta versão.</p></div><RegisteredAuctions/></div>}
