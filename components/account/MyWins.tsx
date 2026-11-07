'use client';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { WinShippingAddressForm } from './WinShippingAddressForm';
import { WinPaymentPreview } from './WinPaymentPreview';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

type ShippingAddress = { recipientName: string; phone: string; zipCode: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string };
type Win = { shippingAddress?: ShippingAddress | null; addressSubmittedAt?: string | null; addressEditable?: boolean; auctionId: string; productName: string; coverImageUrl: string | null; finalPriceCents: number; finishedAt: string | null; paymentDeadline?: string | null; paymentWindowStatus?: string | null; bidCount: number; paymentStatus: string; deliveryStatus: string; fulfillmentAvailable: boolean };
type WinsResponse = { page: number; limit: number; total: number; items: Win[] };
const paymentLabels: Record<string, string> = { not_started: 'não iniciado', pending: 'pendente', paid: 'pago', failed: 'falhou', refunded: 'reembolsado', cancelled: 'cancelado' };
const deliveryLabels: Record<string, string> = { not_started: 'não iniciada', preparing: 'em preparação', shipped: 'enviada', delivered: 'entregue', cancelled: 'cancelada' };
const money = (value: number) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const demoWins: Win[] = [
  { auctionId: 'DEMO-WIN-001', productName: 'Smartphone premium (demonstração)', coverImageUrl: null, finalPriceCents: 3250, finishedAt: '2026-11-07T12:00:00.000Z', paymentDeadline: null, paymentWindowStatus: 'awaiting_payment', bidCount: 18, paymentStatus: 'pending', deliveryStatus: 'not_started', fulfillmentAvailable: true, addressEditable: false },
  { auctionId: 'DEMO-WIN-002', productName: 'Fone sem fio (demonstração)', coverImageUrl: null, finalPriceCents: 1790, finishedAt: '2026-11-07T12:30:00.000Z', paymentDeadline: null, paymentWindowStatus: 'paid', bidCount: 9, paymentStatus: 'paid', deliveryStatus: 'preparing', fulfillmentAvailable: true, addressEditable: false },
  { auctionId: 'DEMO-WIN-003', productName: 'Console de jogos (demonstração)', coverImageUrl: null, finalPriceCents: 8900, finishedAt: '2026-11-07T13:00:00.000Z', paymentDeadline: null, paymentWindowStatus: 'paid', bidCount: 42, paymentStatus: 'paid', deliveryStatus: 'shipped', fulfillmentAvailable: true, addressEditable: false },
];
const demoAvailable = process.env.NODE_ENV === 'development';
const deliverySteps = ['not_started', 'preparing', 'shipped', 'delivered'] as const;
function DeliveryProgress({ paymentStatus, deliveryStatus }: { paymentStatus: string; deliveryStatus: string }) {
  if (deliveryStatus === 'cancelled') return <p role="status">Entrega cancelada. Consulte o suporte para esclarecimentos.</p>;
  if (paymentStatus === 'refunded' || paymentStatus === 'cancelled') return <p role="status">O pagamento não está ativo. O andamento da entrega depende de revisão administrativa.</p>;
  const current = deliverySteps.indexOf(deliveryStatus as typeof deliverySteps[number]);
  if (current < 0) return <p role="status">Estado da entrega indisponível.</p>;
  return <section aria-label="Acompanhamento da entrega">
    <h3 style={{ fontSize: 16, marginBottom: 8 }}>Acompanhamento do pedido</h3>
    <ol className="win-delivery-progress">
      {(['Pagamento confirmado', 'Em preparação', 'Enviado', 'Entregue'] as const).map((label, index) => {
        const complete = index === 0 ? paymentStatus === 'paid' : paymentStatus === 'paid' && current >= index;
        return <li key={label} className={complete ? 'win-delivery-complete' : ''}>
          <span aria-hidden="true">{complete ? '✓' : index + 1}</span>{label}
        </li>;
      })}
    </ol>
    {paymentStatus !== 'paid' && <p>O acompanhamento de envio depende da confirmação do pagamento. Nenhuma cobrança é realizada nesta tela.</p>}
  </section>;
}


export function MyWins() {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [demo, setDemo] = useState(false);
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
    {demoAvailable && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}><button type="button" onClick={() => setDemo(value => !value)} aria-pressed={demo}>{demo ? 'Sair da demonstração' : 'Visualizar vitórias fictícias'}</button></div>}
    {demo && demoAvailable && <div role="status" style={{ border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', padding: 14, borderRadius: 10, marginBottom: 16, fontWeight: 700 }}>MODO DEMONSTRAÇÃO — vitórias fictícias locais. Nenhum arremate, pagamento ou endereço foi criado no banco. Consultas de pagamento e envio de endereço estão indisponíveis nesta visualização.</div>}
    {demo && demoAvailable && <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>{demoWins.map(win => <article key={win.auctionId} className="panel" style={{ padding: 20, display: 'grid', gap: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><strong>{win.productName}</strong><p style={{ color: '#166534', fontWeight: 700 }}>Vitória fictícia confirmada</p></div><strong style={{ fontSize: 20 }}>{money(win.finalPriceCents)}</strong></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span style={{ padding: '7px 10px', borderRadius: 8, background: win.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7' }}>Pagamento: {paymentLabels[win.paymentStatus]}</span><span style={{ padding: '7px 10px', borderRadius: 8, background: '#f1f5f9' }}>Entrega: {deliveryLabels[win.deliveryStatus]}</span></div><DeliveryProgress paymentStatus={win.paymentStatus} deliveryStatus={win.deliveryStatus}/><p style={{ color: '#64748b' }}>Consulta de pagamento e cadastro de endereço desabilitados no modo demonstração.</p></article>)}</div>}
    <div style={{ display: demo ? 'none' : 'grid', gap: 16 }}>
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
          {win.paymentDeadline && Number.isFinite(Date.parse(win.paymentDeadline)) && <span>Prazo de pagamento informado: {new Date(win.paymentDeadline).toLocaleString('pt-BR')}</span>}
          {win.paymentStatus === 'paid' ? <span style={{ color: '#166534', fontWeight: 700 }}>Pagamento confirmado.</span> :
            win.paymentStatus === 'refunded' || win.paymentStatus === 'cancelled' ? <span>Pagamento {paymentLabels[win.paymentStatus]}.</span> :
            win.paymentWindowStatus === 'expired' ? <span role="status" style={{ color: '#a43c1a', fontWeight: 700 }}>Prazo ultrapassado. Consulte o suporte antes de qualquer providência.</span> :
            win.paymentWindowStatus === 'awaiting_payment' ? <span>Prazo em andamento. A cobrança de arremates ainda não está habilitada nesta versão.</span> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ borderRadius: 8, background: '#f1f5f9', padding: '7px 10px', color: '#475569' }}>Pagamento: {paymentLabels[win.paymentStatus] ?? 'indisponível'}</span>
            <span style={{ borderRadius: 8, background: '#f1f5f9', padding: '7px 10px', color: '#475569' }}>Entrega: {deliveryLabels[win.deliveryStatus] ?? 'indisponível'}</span>
          </div>
          <DeliveryProgress paymentStatus={win.paymentStatus} deliveryStatus={win.deliveryStatus} />
          <WinPaymentPreview auctionId={win.auctionId} getToken={getToken} />
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
