'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import { listAdminFulfillments, type FulfillmentList } from '@/services/adminFulfillments';

const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string) => new Date(value).toLocaleString('pt-BR');

export function AdminFulfillmentsPanel() {
  const { user, isLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [payment, setPayment] = useState('');
  const [delivery, setDelivery] = useState('');
  const [result, setResult] = useState<FulfillmentList | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(''); setResult(null); } });
    listAdminFulfillments(token, page, payment, delivery)
      .then(data => { if (active) setResult(data); })
      .catch((err: unknown) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoading, isAdmin, getToken, page, payment, delivery]);

  if (isLoading) return <section className="panel">Verificando sessão...</section>;
  if (!user) return <section className="panel"><h2>Acesso administrativo</h2><Link href="/login?next=/admin/fulfillments">Entrar</Link></section>;
  if (!isAdmin) return <section className="panel"><h2>Acesso restrito</h2><p>Somente administradores.</p></section>;

  return <section className="panel">
    <h2>Arremates e entregas</h2>
    <p>Consulta administrativa. Esta tela não confirma pagamentos nem altera entregas.</p>
    <div className="incident-filters">
      <label>Pagamento{' '}<select aria-label="Filtrar pagamento" value={payment} onChange={e => { setPayment(e.target.value); setPage(1); }}>
        <option value="">Todos</option>
        {['not_started', 'pending', 'paid', 'failed', 'refunded', 'cancelled'].map(x => <option key={x} value={x}>{x}</option>)}
      </select></label>
      <label>Entrega{' '}<select aria-label="Filtrar entrega" value={delivery} onChange={e => { setDelivery(e.target.value); setPage(1); }}>
        <option value="">Todas</option>
        {['not_started', 'preparing', 'shipped', 'delivered', 'cancelled'].map(x => <option key={x} value={x}>{x}</option>)}
      </select></label>
    </div>
    {loading && <p role="status">Carregando arremates...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && result && <>
      <p>{result.total} arremate(s) encontrado(s).</p>
      <div className="incident-table-wrap"><table className="incident-table">
        <thead><tr><th>Arremate</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Entrega</th><th>Destinatário</th></tr></thead>
        <tbody>{result.items.map(item => <tr key={item.auctionId}>
          <td>{item.auctionId}</td><td>{money(item.winningPriceCents)}</td><td>{date(item.paymentDeadline)}</td>
          <td>{item.paymentStatus}</td><td>{item.deliveryStatus}</td>
          <td>{item.shippingAddress?.recipientName || 'Endereço pendente'}</td>
        </tr>)}</tbody>
      </table></div>
      {result.items.length === 0 && <p>Nenhum arremate encontrado.</p>}
      <div className="incident-pagination">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(n => n - 1)}>Anterior</button>
        <span>Página {page} de {Math.max(1, Math.ceil(result.total / result.limit))}</span>
        <button type="button" disabled={page * result.limit >= result.total || loading} onClick={() => setPage(n => n + 1)}>Próxima</button>
      </div>
    </>}
  </section>;
}
