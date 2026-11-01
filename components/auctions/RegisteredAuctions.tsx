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
  waitingStartedAt?: string | null;
  product?: { name: string; coverImage?: Image; images?: Image[]; price?: number } | null;
};
export function RegisteredAuctions() {
  const [auctions, setAuctions] = useState<RegisteredAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let sequence = 0;
    const refresh = async () => {
      if (!mounted || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      const requestId = ++sequence;
      try {
        const { data } = await api.get<{ auctions: RegisteredAuction[] }>('/auctions');
        if (!mounted || requestId !== sequence) return;
        setAuctions((data.auctions ?? []).filter(a => a.status !== 'cancelled' && a.product));
        setError(false);
      } catch {
        if (mounted) setError(true);
      } finally {
        inFlight = false;
        if (mounted) setLoading(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 5000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  if (loading) return <p role="status">Carregando leilões cadastrados...</p>;
  if (error && !auctions.length) return <p role="alert">Não foi possível carregar os leilões cadastrados. Verifique se a API está disponível.</p>;
  if (!auctions.length) return <p className="empty-state">Ainda não existem leilões cadastrados para exibição.</p>;
  const upcoming = auctions.filter(a => a.status === 'active' || a.status === 'scheduled')
    .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1));
  const finished = auctions.filter(a => a.status === 'finished')
    .sort((a, b) => Date.parse(b.endsAt || '') - Date.parse(a.endsAt || ''));
  const renderCards = (items: RegisteredAuction[]) => <div className="auction-grid">{items.map(auction => {
    const image = auction.product?.coverImage?.url || auction.product?.images?.[0]?.url;
    const status = auction.status === 'active' ? 'Em andamento' : auction.status === 'finished' ? 'Encerrado' : 'Agendado';
    const scheduledSeconds = auction.status === 'scheduled' && auction.waitingStartedAt && auction.startsAt && now !== null ? Math.max(0, Math.ceil((Date.parse(auction.startsAt) - now) / 1000)) : null;
    const secondsLeft = auction.status === 'active' && auction.endsAt && now !== null ? Math.max(0, Math.ceil((Date.parse(auction.endsAt) - now) / 1000)) : null;
    return <article key={auction._id} className="auction-card">
      <div className="auction-visual" style={{ background: '#f3f5f9' }}>
        {image ? <img src={image} alt={auction.product?.name ?? 'Produto'} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 230 }} /> : <span className="auction-emoji" aria-hidden="true">📦</span>}
        <span className={`auction-status ${auction.status === "active" ? "live" : ""}`}>{status}</span>
        {auction.status === 'active' && <span role="timer" aria-label="Tempo restante do leilão" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, padding: '9px 13px', borderRadius: 10, background: '#fff', border: '2px solid #ff6b35', color: '#e65320', fontWeight: 800, fontSize: 18, boxShadow: '0 3px 10px #0002' }}>{secondsLeft === null ? 'Aguardando início' : secondsLeft === 0 ? 'Encerrando...' : `⏱ ${secondsLeft}s`}</span>}
      </div>
      <div className="auction-body">
        <div className="auction-title-row"><h3>{auction.product?.name ?? 'Produto indisponível'}</h3></div>
        {auction.status === "active" && <p className="auction-live-note">● Ao vivo · Acompanhe a contagem regressiva</p>}
        {auction.status === "scheduled" && <p className="auction-scheduled-note">{scheduledSeconds !== null ? `◷ Início previsto em ${Math.floor(scheduledSeconds / 3600) > 0 ? `${Math.floor(scheduledSeconds / 3600)}h ` : ""}${Math.floor(scheduledSeconds % 3600 / 60)}min ${scheduledSeconds % 60}s` : "◷ Aguardando definição do início"}</p>}
        {auction.status === "scheduled" && auction.waitingStartedAt && auction.startsAt && <p className="retail">Previsão: {new Date(auction.startsAt).toLocaleString("pt-BR")}</p>}
        <p className="retail">Valor de referência: {typeof auction.product?.price === 'number' ? auction.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'}</p>
        <div className="bid-info"><div><span className="metric-label">{auction.status === "finished" ? "Preço final" : "Preço atual"}</span><strong>{money(auction.currentPriceCents)}</strong></div><div><span className="metric-label">Custo por lance</span><strong>{money(auction.bidCostCents)}</strong></div></div>
        {auction.status === 'finished' && <div style={{ padding: '12px 14px', background: '#fff8df', border: '1px solid #f2d783', borderRadius: 10, display: 'grid', gap: 5, textAlign: 'center' }}>
          <strong>🏆 Leilão encerrado</strong>
          <span>{auction.winnerNickname ? <>Ganhador: <strong>{auction.winnerNickname}</strong></> : 'Ganhador não identificado publicamente'}</span>
          <span>Preço de arremate: <strong>{money(auction.currentPriceCents)}</strong></span>
        </div>}
        {auction.status === 'finished' && auction.endsAt && <p className="retail">Encerrado em: {new Date(auction.endsAt).toLocaleString('pt-BR')}</p>}
        <div className="card-bottom"><span>{auction.bidCount} lance(s)</span><Link className="card-cta" href={`/auctions/registered/${auction._id}`}>{auction.status === "finished" ? "Ver resultado" : auction.status === "active" ? "Acompanhar leilão" : "Ver detalhes"}</Link></div>
      </div>
    </article>;
  })}</div>;
  const activeCount = auctions.filter(a => a.status === 'active').length;
  return <div>
    <div className="page-heading" style={{ textAlign: activeCount > 0 ? 'center' : 'left' }}>
      <span className="eyebrow">{activeCount > 0 ? 'Acompanhe em tempo real' : 'Descubra oportunidades'}</span>
      <h1>{activeCount > 0 ? 'Leilões Ativos Agora' : 'Todos os leilões'}</h1>
      <p>{activeCount > 0 ? 'Acompanhe os leilões em andamento. Cada segundo conta!' : 'Explore os leilões cadastrados. A participação por lances ainda não está habilitada nesta versão.'}</p>
      {activeCount > 0 && <p style={{ fontSize: 13, marginTop: 8 }}>Participação por lances ainda indisponível nesta versão.</p>}
    </div>
    {error && <p role="status">Não foi possível atualizar a listagem. Exibindo os últimos dados disponíveis.</p>}
    {upcoming.length === 0 && <p className="empty-state" role="status">Nenhum leilão ativo ou agendado no momento.</p>}
    {renderCards([...upcoming, ...finished])}
  </div>;
}
