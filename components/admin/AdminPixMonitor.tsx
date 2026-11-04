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
export function AdminPixMonitor() {
  const { user, getToken, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') { setData(null); return; }
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
  }, [authLoading, user, getToken, status, page, refresh]);
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
      <button type="button" disabled={loading} onClick={() => setRefresh(n => n + 1)}>
        {loading ? 'Atualizando...' : 'Atualizar'}
      </button>
    </div>
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Consultando registros...</p>}
    {!loading && data && <p>{data.total} pagamento(s) encontrado(s).</p>}
    {!loading && data?.items.length === 0 && <p>Nenhum pagamento neste filtro.</p>}
    {data?.items.map(item => <article key={item.paymentId} style={{
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
    {data && data.total > data.limit && <nav aria-label="Paginação financeira" style={{ display: 'flex', gap: 12 }}>
      <button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
      <span>Página {page} de {Math.ceil(data.total / data.limit)}</span>
      <button type="button" disabled={loading || page * data.limit >= data.total} onClick={() => setPage(p => p + 1)}>Próxima</button>
    </nav>}
  </main>;
}
