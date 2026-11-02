'use client';
import Link from 'next/link';
import { CheckCircle2, Clock3, Gavel, XCircle, ArrowUpRight } from 'lucide-react';
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
const participationStatus = (item: Participation) => {
  if (item.won) return { label: 'Você venceu', color: '#166534', bg: '#dcfce7', icon: CheckCircle2 };
  if (item.status === 'finished') return { label: 'Encerrado sem vitória', color: '#475569', bg: '#f1f5f9', icon: XCircle };
  if (item.status === 'active') return { label: 'Em andamento', color: '#9a3412', bg: '#ffedd5', icon: Clock3 };
  if (item.status === 'cancelled') return { label: 'Cancelado', color: '#991b1b', bg: '#fee2e2', icon: XCircle };
  if (item.status === 'scheduled') return { label: 'Agendado', color: '#1d4ed8', bg: '#dbeafe', icon: Clock3 };
  return { label: 'Indisponível', color: '#475569', bg: '#f1f5f9', icon: Gavel };
};
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
      {!error && data?.items.map(item => {
        const status = participationStatus(item);
        const StatusIcon = status.icon;
        return <article key={item.auctionId} className="panel" style={{ padding: 18, border: '1px solid #e2e8f0', borderRadius: 12, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>{item.productName}</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12, background: status.bg, color: status.color }}><StatusIcon size={15} />{status.label}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <div><small style={{ display: 'block', color: '#64748b' }}>Seus lances</small><strong>{item.bidCount}</strong></div>
            <div><small style={{ display: 'block', color: '#64748b' }}>Total utilizado</small><strong>{money(item.totalSpentCents)}</strong></div>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Último lance: {new Date(item.lastBidAt).toLocaleString('pt-BR')}</p>
          <Link href={`/auctions/${item.auctionId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#ea580c', width: 'fit-content' }}>Ver detalhes do leilão <ArrowUpRight size={16} /></Link>
        </article>;
      })}
      {!!data && data.total > data.limit && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
        <span>Página {page} de {Math.ceil(data.total / data.limit)}</span>
        <button type="button" disabled={loading || page * data.limit >= data.total} onClick={() => setPage(p => p + 1)}>Próxima</button>
      </div>}
    </div>
  </section>;
}
