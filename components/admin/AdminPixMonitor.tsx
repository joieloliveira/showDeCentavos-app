'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';

type Payment = {
  paymentId: string; auctionId: string; amountCents: number;
  status: string; attemptState: string | null; requiresReview: boolean;
  createdAt: string; processedAt: string | null;
};
type Response = { page: number; limit: number; total: number; items: Payment[] };
const statuses = [
  ['','Todos'], ['not_started','Não iniciado'], ['pending','Pendente'],
  ['paid','Pago'], ['failed','Falhou'], ['refunded','Reembolsado'], ['cancelled','Cancelado']
];
const labels: Record<string,string> = {
  reserved: 'Reservada', request_unknown: 'Resultado desconhecido',
  reconciliation_required: 'Reconciliação necessária',
  provider_confirmed: 'Confirmada pelo provedor',
};
const demoItems: Payment[] = [
  { paymentId: 'demo-pending', auctionId: 'DEMO-LEILAO-001', amountCents: 1750, status: 'pending', attemptState: 'reserved', requiresReview: false, createdAt: '2026-11-07T12:00:00.000Z', processedAt: null },
  { paymentId: 'demo-paid', auctionId: 'DEMO-LEILAO-002', amountCents: 2990, status: 'paid', attemptState: 'provider_confirmed', requiresReview: false, createdAt: '2026-11-07T12:05:00.000Z', processedAt: '2026-11-07T12:10:00.000Z' },
  { paymentId: 'demo-unknown', auctionId: 'DEMO-LEILAO-003', amountCents: 4250, status: 'pending', attemptState: 'request_unknown', requiresReview: true, createdAt: '2026-11-07T12:15:00.000Z', processedAt: null },
  { paymentId: 'demo-reconcile', auctionId: 'DEMO-LEILAO-004', amountCents: 5300, status: 'pending', attemptState: 'reconciliation_required', requiresReview: true, createdAt: '2026-11-07T12:20:00.000Z', processedAt: null },
];
const demoEnabled = process.env.NODE_ENV === 'development';
export function AdminPixMonitor() {
  const { user, getToken, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState('');
  const [demo, setDemo] = useState(false);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') { setData(null); return; }
    if (demoEnabled && demo) { setData(null); setError(''); setLoading(false); return; }
    const token = getToken();
    if (!token) { setData(null); setError('Sessão expirada.'); return; }
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    api.get<Response>('/auctions/admin/pix-monitor', {
      params: { page, ...(status ? { status } : {}) },
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal
    }).then(({ data: result }) => {
      if (!controller.signal.aborted && getToken() === token) setData(result);
    }).catch(err => {
      if (!controller.signal.aborted) setError(getApiError(err));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, user, getToken, status, page, refresh, demo]);
  const filteredDemo = demoItems.filter(item => !status || item.status === status);
  const displayed: Response | null = demoEnabled && demo
    ? { page, limit: 2, total: filteredDemo.length, items: filteredDemo.slice((page - 1) * 2, page * 2) }
    : data;
  if (authLoading) return <p>Verificando sessão...</p>;
  if (!user || user.role !== 'admin') return <p>Acesso restrito a administradores.</p>;
  return <main className="panel" style={{ padding: 24, display: 'grid', gap: 16 }}>
    <h1>Monitor financeiro PIX</h1>
    <p>Consulta administrativa de pagamentos de arremates. Não cria cobranças, confirma pagamentos ou libera reconciliações.</p>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <label htmlFor="pix-status">Situação</label>
      <select id="pix-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      {demoEnabled && <button type="button" aria-pressed={demo} onClick={() => { setDemo(value => !value); setPage(1); }}>
        {demo ? 'Sair da demonstração' : 'Visualizar dados fictícios'}
      </button>}
      <button type="button" disabled={loading || demo} onClick={() => setRefresh(n => n + 1)}>
        {loading ? 'Atualizando...' : 'Atualizar'}
      </button>
    </div>
    {demoEnabled && demo && <p role="status" style={{ fontWeight: 700, color: '#92400e' }}>MODO DEMONSTRAÇÃO — dados fictícios locais. Nenhum pagamento ou registro foi criado no banco.</p>}
    {error && !demo && <p role="alert">{error}</p>}
    {loading && !demo && <p role="status">Consultando registros...</p>}
    {!loading && displayed && <p>{displayed.total} pagamento(s) encontrado(s).</p>}
    {!loading && displayed?.items.length === 0 && <p>Nenhum pagamento neste filtro.</p>}
    {displayed?.items.map(item => <article key={item.paymentId} style={{
      padding: 14, border: '1px solid #cbd5e1', borderRadius: 8, display: 'grid', gap: 6
    }}>
      <strong>Leilão: {item.auctionId}</strong>
      <span>Valor: {(item.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
      <span>Pagamento: {statuses.find(([key]) => key === item.status)?.[1] ?? 'Desconhecido'}</span>
      <span>Tentativa: {item.attemptState ? labels[item.attemptState] ?? 'Estado desconhecido' : 'Sem tentativa registrada'}</span>
      {item.requiresReview && <strong role="status" style={{ color: '#b45309' }}>
        Exige análise manual. Não repita a cobrança.
      </strong>}
      <small>Registro: {new Date(item.createdAt).toLocaleString('pt-BR')}</small>
      {item.processedAt && <small>Processado: {new Date(item.processedAt).toLocaleString('pt-BR')}</small>}
    </article>)}
    {displayed && displayed.total > displayed.limit && <nav aria-label="Paginação financeira" style={{ display: 'flex', gap: 12 }}>
      <button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
      <span>Página {page} de {Math.ceil(displayed.total / displayed.limit)}</span>
      <button type="button" disabled={loading || page * displayed.limit >= displayed.total} onClick={() => setPage(p => p + 1)}>Próxima</button>
    </nav>}
  </main>;
}
