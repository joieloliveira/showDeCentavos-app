'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { WinShippingAddressForm } from './WinShippingAddressForm';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

type Win = { auctionId: string; productName: string; coverImageUrl: string | null; finalPriceCents: number; finishedAt: string | null; bidCount: number; paymentStatus: string; deliveryStatus: string; fulfillmentAvailable: boolean };
type WinsResponse = { page: number; limit: number; total: number; items: Win[] };
const money = (value: number) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function MyWins() {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WinsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    api.get<WinsResponse>('/auctions/my/wins', { params: { page }, headers: { Authorization: `Bearer ${token}` } })
      .then(({ data: result }) => { if (active) { setData(result); setError(''); } })
      .catch(err => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, page, getToken]);
  if (authLoading) return <p role="status">Verificando sua sessão...</p>;
  if (!user) return <div className="panel"><p>Faça login para consultar suas vitórias.</p><Link href="/login?next=/account/wins">Entrar</Link></div>;
  return <div>
    <div className="page-heading"><span className="eyebrow">Área do usuário</span><h1>Minhas vitórias</h1><p>Consulte os leilões em que você foi confirmado como vencedor.</p></div>
    <div style={{ display: 'grid', gap: 16 }}>
      {loading && <p role="status">Carregando vitórias...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && data?.items.length === 0 && <div className="panel" style={{ padding: 24 }}><Trophy size={32}/><h2>Você ainda não tem vitórias registradas.</h2><Link href="/auctions">Explorar leilões</Link></div>}
      {!error && data?.items.map(win => <article key={win.auctionId} className="panel" style={{ padding: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {win.coverImageUrl && <img src={win.coverImageUrl} alt={win.productName} style={{ width: 120, height: 100, objectFit: 'contain' }} />}
        <div style={{ display: 'grid', gap: 8, flex: 1 }}>
          <strong>{win.productName}</strong>
          <span style={{ color: '#166534', fontWeight: 700 }}>Vitória confirmada</span>
          <span>Preço final do leilão: {money(win.finalPriceCents)}</span>
          {win.finishedAt && <span>Encerrado em: {new Date(win.finishedAt).toLocaleString('pt-BR')}</span>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ borderRadius: 8, background: '#f1f5f9', padding: '7px 10px', color: '#475569' }}>Pagamento: não iniciado</span>
            <span style={{ borderRadius: 8, background: '#f1f5f9', padding: '7px 10px', color: '#475569' }}>Entrega: não iniciada</span>
          </div>
          <span style={{ color: '#64748b' }}>Acompanhamento informativo. Pagamentos e envios ainda não estão habilitados.</span>
          <Link href={`/auctions/${win.auctionId}`}>Ver detalhes do leilão</Link>
          <WinShippingAddressForm auctionId={win.auctionId} getToken={getToken} />
        </div>
      </article>)}
      {!!data && data.total > data.limit && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage(p => p - 1); }}>Anterior</button>
        <span>Página {page} de {Math.ceil(data.total / data.limit)}</span>
        <button type="button" disabled={loading || page * data.limit >= data.total} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Próxima</button>
      </div>}
    </div>
  </div>;
}
