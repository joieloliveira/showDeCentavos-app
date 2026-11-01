'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { money } from '@/utils/format';

type Image = { url?: string; key?: string };
type RegisteredAuction = {
  _id: string;
  status: 'scheduled' | 'active' | 'finished' | 'cancelled';
  currentPriceCents: number;
  startPriceCents: number;
  bidCostCents: number;
  bidCount: number;
  winnerNickname?: string | null;
  endsAt?: string | null;
  startsAt?: string | null;
  product?: { name: string; coverImage?: Image; images?: Image[]; price?: number } | null;
};
export function RegisteredAuctions() {
  const [auctions, setAuctions] = useState<RegisteredAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    api.get<{ auctions: RegisteredAuction[] }>('/auctions')
      .then(({ data }) => { if (mounted) setAuctions((data.auctions ?? []).filter(a => a.status !== 'cancelled' && a.product)); })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  if (loading) return <p role="status">Carregando leilões cadastrados...</p>;
  if (error) return <p role="alert">Não foi possível carregar os leilões cadastrados. Verifique se a API está disponível.</p>;
  if (!auctions.length) return <p className="empty-state">Ainda não existem leilões cadastrados para exibição.</p>;
  const upcoming = auctions.filter(a => a.status === 'active' || a.status === 'scheduled')
    .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1));
  const finished = auctions.filter(a => a.status === 'finished')
    .sort((a, b) => Date.parse(b.endsAt || '') - Date.parse(a.endsAt || ''));
  const renderCards = (items: RegisteredAuction[]) => <div className="auction-grid">{items.map(auction => {
    const image = auction.product?.coverImage?.url || auction.product?.images?.[0]?.url;
    const status = auction.status === 'active' ? 'Em andamento' : auction.status === 'finished' ? 'Encerrado' : 'Agendado';
    return <article key={auction._id} className="auction-card">
      <div className="auction-visual" style={{ background: '#f3f5f9' }}>
        {image ? <img src={image} alt={auction.product?.name ?? 'Produto'} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 230 }} /> : <span className="auction-emoji" aria-hidden="true">📦</span>}
        <span className="auction-status">{status}</span>
      </div>
      <div className="auction-body">
        <div className="auction-title-row"><h3>{auction.product?.name ?? 'Produto indisponível'}</h3></div>
        <p className="retail">Valor de referência: {typeof auction.product?.price === 'number' ? auction.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}</p>
        <div className="bid-info"><div><span className="metric-label">Preço atual</span><strong>{money(auction.currentPriceCents)}</strong></div><div><span className="metric-label">Custo por lance</span><strong>{money(auction.bidCostCents)}</strong></div></div>
        {auction.status === 'finished' && <div style={{ padding: '12px 14px', background: '#fff8df', border: '1px solid #f2d783', borderRadius: 10, display: 'grid', gap: 5, textAlign: 'center' }}>
          <strong>🏆 Leilão encerrado</strong>
          <span>{auction.winnerNickname ? <>Ganhador: <strong>{auction.winnerNickname}</strong></> : 'Ganhador não identificado publicamente'}</span>
          <span>Preço de arremate: <strong>{money(auction.currentPriceCents)}</strong></span>
        </div>}
        {auction.status === 'finished' && auction.endsAt && <p className="retail">Encerrado em: {new Date(auction.endsAt).toLocaleString('pt-BR')}</p>}
        <div className="card-bottom"><span>{auction.bidCount} lance(s)</span><Link className="card-cta" href={`/auctions/registered/${auction._id}`}>Ver detalhes</Link></div>
      </div>
    </article>;
  })}</div>;
  return <div>
    {upcoming.length === 0 && <p className="empty-state" role="status">Nenhum leilão ativo ou agendado no momento.</p>}
    {renderCards([...upcoming, ...finished])}
  </div>;
}
