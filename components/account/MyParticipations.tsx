'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

type Participation = {
  auctionId: string;
  productName: string;
  status: string;
  bidCount: number;
  totalSpentCents: number;
  lastBidAt: string;
  won: boolean;
};
type Response = { items: Participation[]; total: number; page: number; limit: number };
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function MyParticipations() {
  const { user, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(''); } });
    api.get<Response>('/auctions/my/participations', { params: { page }, headers: { Authorization: `Bearer ${token}` } })
      .then(({ data: response }) => { if (active) setData(response); })
      .catch(err => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, page, getToken]);
  if (!user) return null;
  return <section id="my-participations" className="account-details" style={{ scrollMarginTop: 150 }}>
    <div><span className="eyebrow">Seus leilões</span><h2>Minhas participações</h2><p>Histórico de lances e resultados dos leilões em que você participou.</p></div>
    <div style={{ display: 'grid', gap: 12 }}>
      {loading && <p role="status">Carregando participações...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && data?.items.length === 0 && <p>Você ainda não participou de nenhum leilão.</p>}
      {!error && data?.items.map(item => <article key={item.auctionId} className="panel" style={{ padding: 16 }}>
        <h3>{item.productName}</h3>
        <p>{item.won ? 'Vencedor' : item.status === 'finished' ? 'Encerrado' : item.status === 'active' ? 'Em andamento' : item.status === 'cancelled' ? 'Cancelado' : 'Agendado'}</p>
        <p>Lances: {item.bidCount} · Total utilizado: {money(item.totalSpentCents)}</p>
        <p>Último lance: {new Date(item.lastBidAt).toLocaleString('pt-BR')}</p>
        <Link href={`/auctions/${item.auctionId}`}>Ver leilão</Link>
      </article>)}
      {!!data && data.total > data.limit && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
        <span>Página {page} de {Math.ceil(data.total / data.limit)}</span>
        <button type="button" disabled={loading || page * data.limit >= data.total} onClick={() => setPage(p => p + 1)}>Próxima</button>
      </div>}
    </div>
  </section>;
}
