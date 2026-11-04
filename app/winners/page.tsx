import Link from 'next/link';

export const metadata = { title: 'Ganhadores' };
export const dynamic = 'force-dynamic';

type Winner = {
  auctionId: string;
  productName: string;
  coverImageUrl: string | null;
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
      <div className="auction-grid">
        {winners.map(w => <article className="auction-card" key={w.auctionId}>
          <div className="auction-visual" style={{ background: "#f3f5f9" }}>{w.coverImageUrl ? <img src={w.coverImageUrl} alt={w.productName} style={{ width: "100%", height: "100%", maxHeight: 230, objectFit: "contain" }} /> : <span className="auction-emoji" aria-hidden="true">🏆</span>}<span className="auction-status">Encerrado</span></div>
          <div className="auction-body" style={{ display: "grid", gap: 12 }}>
            <h3>{w.productName}</h3>
            <div style={{ padding: 14, borderRadius: 10, background: "#fff8df", border: "1px solid #f2d783", textAlign: "center" }}><strong style={{ display: "block" }}>🏆 Ganhador</strong><strong style={{ display: "block", marginTop: 6 }}>{w.winnerNickname}</strong></div>
            <div className="bid-info"><div><span className="metric-label">Preço de arremate</span><strong>{(w.finalPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div></div>
            {w.finishedAt && <p className="retail">Encerrado em {new Date(w.finishedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>}
            <Link className="card-cta" href={`/auctions/registered/${w.auctionId}`}>Ver resultado do leilão</Link>
          </div>
        </article>)}
      </div>}
  </div>;
}
