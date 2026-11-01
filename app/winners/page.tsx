import Link from 'next/link';

export const metadata = { title: 'Ganhadores' };
export const dynamic = 'force-dynamic';

type Winner = {
  auctionId: string;
  productName: string;
  finalPriceCents: number;
  finishedAt: string | null;
  winnerNickname: string;
};

export default async function Winners() {
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let winners: Winner[] = [];
  let failed = false;
  try {
    const response = await fetch(apiBase.replace(/\/$/, '') + '/auctions/winners', { cache: 'no-store' });
    if (!response.ok) throw new Error('API indisponível');
    const data = await response.json();
    winners = Array.isArray(data.winners) ? data.winners : [];
  } catch { failed = true; }
  return <div className="site-container page-content">
    <div className="page-heading"><span className="eyebrow">Histórico transparente</span><h1>Ganhadores</h1><p>Resultados públicos de leilões encerrados, com identificação por apelido.</p></div>
    {failed ? <div className="panel" role="alert"><p>Não foi possível consultar os ganhadores. Tente novamente mais tarde.</p></div> :
      winners.length === 0 ? <div className="panel"><p>Ainda não há resultados com vencedores identificados por apelido público.</p></div> :
      <div style={{ display: 'grid', gap: 16 }}>
        {winners.map(w => <article className="panel" key={w.auctionId} style={{ display: 'grid', gap: 8 }}>
          <strong>{w.productName}</strong>
          <span>Vencedor: <strong>{w.winnerNickname}</strong></span>
          <span>Preço final: <strong>{(w.finalPriceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
          {w.finishedAt && <span>Encerrado em: {new Date(w.finishedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>}
          <Link href={`/auctions/registered/${w.auctionId}`}>Ver leilão</Link>
        </article>)}
      </div>}
  </div>;
}
