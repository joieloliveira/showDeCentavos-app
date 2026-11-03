'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { WinShippingAddressForm } from './WinShippingAddressForm';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

type ShippingAddress = { recipientName: string; phone: string; zipCode: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string };
type Win = { shippingAddress?: ShippingAddress | null; addressSubmittedAt?: string | null; addressEditable?: boolean; auctionId: string; productName: string; coverImageUrl: string | null; finalPriceCents: number; finishedAt: string | null; bidCount: number; paymentStatus: string; deliveryStatus: string; fulfillmentAvailable: boolean };
type WinsResponse = { page: number; limit: number; total: number; items: Win[] };
const paymentLabels: Record<string, string> = { not_started: 'não iniciado', pending: 'pendente', paid: 'pago', failed: 'falhou', refunded: 'reembolsado', cancelled: 'cancelado' };
const deliveryLabels: Record<string, string> = { not_started: 'não iniciada', preparing: 'em preparação', shipped: 'enviada', delivered: 'entregue', cancelled: 'cancelada' };
const money = (value: number) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function MyWins() {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WinsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedForUser, setLoadedForUser] = useState<string | null>(null);
  const [loadedForToken, setLoadedForToken] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setData(null); setLoadedForUser(null); setLoadedForToken(null); setLoading(false); return; }
    const token = getToken();
    if (!token) { setData(null); setLoadedForUser(null); setLoadedForToken(null); setLoading(false); setError('Sua sessão expirou. Faça login novamente.'); return; }
    let active = true;
    const controller = new AbortController();
    queueMicrotask(() => { if (active) { setLoading(true); setError(''); setData(null); } });
    api.get<WinsResponse>('/auctions/my/wins', { params: { page }, headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(({ data: result }) => { if (active && getToken() === token) { setData(result); setLoadedForUser(user.id); setLoadedForToken(token); setError(''); } })
      .catch(err => { if (!axios.isCancel(err) && active && getToken() === token) { setData(null); setError(getApiError(err)); } })
      .finally(() => { if (active && getToken() === token) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [user, page, getToken, refreshKey]);
  if (authLoading) return <p role="status">Verificando sua sessão...</p>;
  if (!user) return <div className="panel"><p>Faça login para consultar suas vitórias.</p><Link href="/login?next=/account/wins">Entrar</Link></div>;
  const visibleData = loadedForUser === user.id && loadedForToken === getToken() ? data : null;
  return <div>
    <div className="page-heading"><span className="eyebrow">Área do usuário</span><h1>Minhas vitórias</h1><p>Consulte os leilões em que você foi confirmado como vencedor.</p><button type="button" disabled={loading} onClick={() => setRefreshKey(value => value + 1)}>{loading ? 'Atualizando...' : 'Atualizar histórico'}</button></div>
    <div style={{ display: 'grid', gap: 16 }}>
      {loading && <p role="status">Carregando vitórias...</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRefreshKey(value => value + 1)}>Tentar novamente</button></div>}
      {!loading && !error && visibleData?.items.length === 0 && (page > 1 ? <div className="panel" role="status" style={{ padding: 24 }}><p>Não há vitórias nesta página.</p><button type="button" onClick={() => setPage(1)}>Voltar à primeira página</button></div> : <div className="panel" style={{ padding: 24 }}><Trophy size={32}/><h2>Você ainda não tem vitórias registradas.</h2><Link href="/auctions">Explorar leilões</Link></div>)}
      {!loading && !error && visibleData?.items.map(win => <article key={win.auctionId} className="panel" style={{ padding: 20, display: 'grid', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {win.coverImageUrl && <img src={win.coverImageUrl} alt={win.productName} style={{ width: 120, height: 100, objectFit: 'contain' }} />}
          <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 220 }}>
          <strong>{win.productName}</strong>
          <span style={{ color: '#166534', fontWeight: 700 }}>Vitória confirmada</span>
          <span>Preço final do leilão: {money(win.finalPriceCents)}</span>
          {win.finishedAt && <span>Encerrado em: {new Date(win.finishedAt).toLocaleString('pt-BR')}</span>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ borderRadius: 8, background: '#f1f5f9', padding: '7px 10px', color: '#475569' }}>Pagamento: {paymentLabels[win.paymentStatus] ?? 'indisponível'}</span>
            <span style={{ borderRadius: 8, background: '#f1f5f9', padding: '7px 10px', color: '#475569' }}>Entrega: {deliveryLabels[win.deliveryStatus] ?? 'indisponível'}</span>
          </div>
          <span style={{ color: '#64748b' }}>Acompanhamento informativo. Pagamentos e envios ainda não estão habilitados.</span>
          <Link href={`/auctions/registered/${win.auctionId}`}>Ver detalhes do leilão</Link>
          </div>
        </div>
        <WinShippingAddressForm auctionId={win.auctionId} getToken={getToken} initialAddress={win.shippingAddress ?? null} editable={win.addressEditable ?? false} />
      </article>)}
      {!loading && !error && !!visibleData && visibleData.total > visibleData.limit && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage(p => p - 1); }}>Anterior</button>
        <span>Página {page} de {Math.ceil(visibleData.total / visibleData.limit)}</span>
        <button type="button" disabled={loading || page * visibleData.limit >= visibleData.total} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Próxima</button>
      </div>}
    </div>
  </div>;
}
