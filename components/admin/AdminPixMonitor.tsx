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
  const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const buttonStyle = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', fontWeight: 600 as const, cursor: 'pointer' as const, background: '#fff', color: '#172033' };
  const visible = displayed?.items ?? [];
  const reviewCount = visible.filter(item => item.requiresReview).length;
  const paidCount = visible.filter(item => item.status === 'paid').length;
  if (authLoading) return <section className="site-container page-content"><p>Verificando sessão...</p></section>;
  if (!user || user.role !== 'admin') return <section className="site-container page-content"><p>Acesso restrito a administradores.</p></section>;
  return <main className="site-container page-content" style={{ display: 'grid', gap: 20 }}>
    <header className="page-heading">
      <span className="eyebrow">ADMINISTRAÇÃO · SOMENTE LEITURA</span>
      <h1>Monitor financeiro PIX</h1>
      <p>Acompanhe pagamentos de arremates e identifique situações que exigem revisão. Nenhuma cobrança ou reconciliação é iniciada nesta tela.</p>
    </header>
    {demoEnabled && demo && <div role="status" style={{ border: '1px solid #f59e0b', borderRadius: 10, padding: 14, background: '#fffbeb', color: '#92400e', fontWeight: 700 }}>
      MODO DEMONSTRAÇÃO — registros fictícios locais. Nenhum pagamento ou registro foi criado no banco.
    </div>}
    <section className="panel" style={{ padding: 22, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
        <label htmlFor="pix-status" style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Situação do pagamento
          <select id="pix-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, minWidth: 170 }}>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {demoEnabled && <button style={buttonStyle} type="button" aria-pressed={demo} onClick={() => { setDemo(value => !value); setPage(1); }}>
          {demo ? 'Sair da demonstração' : 'Visualizar dados fictícios'}
        </button>}
        <button style={buttonStyle} type="button" disabled={loading || demo} onClick={() => setRefresh(n => n + 1)}>
          {loading ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </div>
      {error && !demo && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {loading && !demo && <p role="status">Consultando registros...</p>}
      {displayed && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {[
          { label: 'Registros no filtro', value: displayed.total, detail: 'Total de pagamentos encontrados' },
          { label: 'Pagos nesta página', value: paidCount, detail: 'Somente registros exibidos' },
          { label: 'Revisão nesta página', value: reviewCount, detail: 'Somente registros exibidos' },
        ].map(metric => <div key={metric.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'grid', gap: 4 }}>
          <span style={{ color: '#475569', fontSize: 13 }}>{metric.label}</span>
          <strong style={{ fontSize: 28, color: '#0f172a' }}>{metric.value}</strong>
          <small style={{ color: '#64748b' }}>{metric.detail}</small>
        </div>)}
      </div>}
      {displayed?.items.length === 0 && !loading && <p>Nenhum pagamento encontrado para este filtro.</p>}
      {visible.length > 0 && <div style={{ display: 'grid', gap: 12 }}>
        {visible.map(item => <article key={item.paymentId} style={{ border: `1px solid ${item.requiresReview ? '#f59e0b' : '#e2e8f0'}`, borderRadius: 12, padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <strong style={{ color: '#0f172a' }}>Leilão {item.auctionId}</strong>
              <small style={{ color: '#64748b' }}>Pagamento: {item.paymentId}</small>
            </div>
            <strong style={{ fontSize: 22, color: '#0f172a' }}>{money(item.amountCents)}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ borderRadius: 999, padding: '5px 12px', background: item.status === 'paid' ? '#dcfce7' : item.status === 'pending' ? '#fef3c7' : '#e2e8f0', color: item.status === 'paid' ? '#166534' : item.status === 'pending' ? '#92400e' : '#334155', fontWeight: 700, fontSize: 13 }}>
              {statuses.find(([key]) => key === item.status)?.[1] ?? 'Desconhecido'}
            </span>
            <span style={{ borderRadius: 999, padding: '5px 12px', background: item.requiresReview ? '#ffedd5' : '#f1f5f9', color: item.requiresReview ? '#9a3412' : '#475569', fontSize: 13 }}>
              {item.attemptState ? labels[item.attemptState] ?? 'Estado desconhecido' : 'Sem tentativa registrada'}
            </span>
          </div>
          {item.requiresReview && <p role="status" style={{ color: '#9a3412', fontWeight: 700 }}>Atenção: análise manual necessária. Não repita a cobrança.</p>}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: '#64748b', fontSize: 13 }}>
            <span>Registrado: {new Date(item.createdAt).toLocaleString('pt-BR')}</span>
            {item.processedAt && <span>Processado: {new Date(item.processedAt).toLocaleString('pt-BR')}</span>}
          </div>
        </article>)}
      </div>}
      {displayed && displayed.total > displayed.limit && <nav aria-label="Paginação financeira" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button style={buttonStyle} type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
        <span>Página {page} de {Math.ceil(displayed.total / displayed.limit)}</span>
        <button style={buttonStyle} type="button" disabled={loading || page * displayed.limit >= displayed.total} onClick={() => setPage(p => p + 1)}>Próxima</button>
      </nav>}
    </section>
  </main>;
}
