'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import { FulfillmentDetails, paymentLabels, deliveryLabels } from '@/components/admin/FulfillmentDetails';
import { advanceAdminDelivery, getAdminDeliveryAudit, listAdminFulfillments, type DeliveryAuditEvent, type FulfillmentList } from '@/services/adminFulfillments';

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [auditAuctionId, setAuditAuctionId] = useState<string | null>(null);
  const [auditItems, setAuditItems] = useState<DeliveryAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const auditRequest = useRef(0);
  const isAdmin = user?.role === 'admin';
  const deliveryWritesEnabled = process.env.NEXT_PUBLIC_AUCTION_DELIVERY_MANAGEMENT_ENABLED === 'true';
  const selectedDetail = result?.items.find(item => item.auctionId === detailId);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    const token = getToken();
    if (!token) { queueMicrotask(() => setError('Sessão administrativa indisponível.')); return; }
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setError(''); setResult(null); } });
    listAdminFulfillments(token, page, payment, delivery)
      .then(data => { if (active) setResult(data); })
      .catch((err: unknown) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoading, isAdmin, getToken, page, payment, delivery, refresh]);

  const advance = async (auctionId: string, target: string) => {
    const token = getToken();
    if (!token || updatingId || !deliveryWritesEnabled) return;
    setUpdatingId(auctionId);
    setError('');
    setNotice('');
    try {
      await advanceAdminDelivery(token, auctionId, target);
      setNotice('Entrega atualizada com sucesso.');
      setDetailId(null);
      auditRequest.current += 1;
      setAuditAuctionId(null);
      setAuditItems([]);
      setRefresh(n => n + 1);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleAudit = async (auctionId: string) => {
    if (auditAuctionId === auctionId) { auditRequest.current += 1; setAuditAuctionId(null); return; }
    const token = getToken();
    if (!token) { setAuditAuctionId(auctionId); setAuditError('Sessão administrativa indisponível.'); return; }
    const request = ++auditRequest.current;
    setAuditAuctionId(auctionId);
    setAuditItems([]);
    setAuditError('');
    setAuditLoading(true);
    try {
      const items = await getAdminDeliveryAudit(token, auctionId);
      if (request === auditRequest.current) setAuditItems(items);
    } catch (err: unknown) {
      if (request === auditRequest.current) setAuditError(getApiError(err));
    } finally {
      if (request === auditRequest.current) setAuditLoading(false);
    }
  };

  if (isLoading) return <section className="panel">Verificando sessão...</section>;
  if (!user) return <section className="panel"><h2>Acesso administrativo</h2><Link href="/login?next=/admin/fulfillments">Entrar</Link></section>;
  if (!isAdmin) return <section className="panel"><h2>Acesso restrito</h2><p>Somente administradores.</p></section>;

  return <section className="panel">
    <h2>Arremates e entregas</h2>
    <p>A confirmação de pagamento não está disponível nesta tela. As entregas exigem pagamento confirmado e endereço válido.</p>
    {!deliveryWritesEnabled && <p role="status">Modo somente leitura: alterações de entrega desabilitadas neste frontend.</p>}
    <div className="incident-filters">
      <label>Pagamento{' '}<select aria-label="Filtrar pagamento" value={payment} onChange={e => { auditRequest.current += 1; setAuditAuctionId(null); setDetailId(null); setPayment(e.target.value); setPage(1); }}>
        <option value="">Todos</option>
        {['not_started', 'pending', 'paid', 'failed', 'refunded', 'cancelled'].map(x => <option key={x} value={x}>{x}</option>)}
      </select></label>
      <label>Entrega{' '}<select aria-label="Filtrar entrega" value={delivery} onChange={e => { auditRequest.current += 1; setAuditAuctionId(null); setDetailId(null); setDelivery(e.target.value); setPage(1); }}>
        <option value="">Todas</option>
        {['not_started', 'preparing', 'shipped', 'delivered', 'cancelled'].map(x => <option key={x} value={x}>{x}</option>)}
      </select></label>
    </div>
    {notice && <p role="status">{notice}</p>}
    {loading && <p role="status">Carregando arremates...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && result && <>
      <p>{result.total} arremate(s) encontrado(s).</p>
      <div className="incident-table-wrap"><table className="incident-table">
        <thead><tr><th>Arremate</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Entrega</th><th>Destinatário</th><th>Ação</th><th>Detalhes</th><th>Auditoria</th></tr></thead>
        <tbody>{result.items.map(item => <tr key={item.auctionId}>
          <td>{item.auctionId}</td><td>{money(item.winningPriceCents)}</td><td>{date(item.paymentDeadline)}</td>
          <td>{paymentLabels[item.paymentStatus] || item.paymentStatus}</td><td>{deliveryLabels[item.deliveryStatus] || item.deliveryStatus}</td>
          <td>{item.shippingAddress?.recipientName || 'Endereço pendente'}</td>
          <td>{deliveryWritesEnabled && item.paymentStatus === 'paid' && item.addressSubmittedAt && item.shippingAddress && ['not_started', 'preparing', 'shipped'].includes(item.deliveryStatus)
            ? <button type="button" className="incident-action"
                disabled={updatingId !== null || loading}
                onClick={() => {
                  const next = ({ not_started: 'preparing', preparing: 'shipped', shipped: 'delivered' } as Record<string, string>)[item.deliveryStatus];
                  const labels = ({ preparing: 'iniciar a preparação', shipped: 'marcar como enviado', delivered: 'confirmar a entrega' } as Record<string, string>);
                  if (next && window.confirm('Deseja ' + labels[next] + ' deste arremate?')) void advance(item.auctionId, next);
                }}>
                {({ not_started: 'Preparar', preparing: 'Marcar enviado', shipped: 'Confirmar entrega' } as Record<string, string>)[item.deliveryStatus]}
              </button>
            : 'Indisponível'}</td>
          <td><button type="button" className="incident-action" aria-expanded={detailId === item.auctionId}
            onClick={() => setDetailId(current => current === item.auctionId ? null : item.auctionId)}>
            {detailId === item.auctionId ? 'Fechar detalhes' : 'Ver detalhes'}
          </button></td>
          <td><button type="button" className="incident-action" onClick={() => void toggleAudit(item.auctionId)}
            aria-expanded={auditAuctionId === item.auctionId}>
            {auditAuctionId === item.auctionId ? 'Fechar histórico' : 'Ver histórico'}
          </button></td>
        </tr>)}</tbody>
      </table></div>
      {result.items.length === 0 && <p>Nenhum arremate encontrado.</p>}
      {selectedDetail && <FulfillmentDetails item={selectedDetail} />}
      {auditAuctionId && <section className="panel" aria-label="Histórico administrativo de entrega">
        <h3>Histórico de entrega</h3>
        <p>Arremate: {auditAuctionId}</p>
        {auditLoading && <p role="status">Carregando histórico...</p>}
        {auditError && <p role="alert">{auditError}</p>}
        {!auditLoading && !auditError && auditItems.length === 0 && <p>Nenhuma movimentação administrativa registrada.</p>}
        {!auditLoading && !auditError && auditItems.length > 0 && <ol>
          {auditItems.map((event, index) => <li key={event.toStatus + index}>
            <strong>{event.fromStatus} → {event.toStatus}</strong> — {date(event.occurredAt)}
            <span> · Administrador: {event.actorName || event.actorId}</span>
          </li>)}
        </ol>}
        <p>Consulta somente leitura. Nenhum endereço é exibido neste histórico.</p>
      </section>}

      <div className="incident-pagination">
        <button type="button" disabled={page <= 1 || loading} onClick={() => { auditRequest.current += 1; setAuditAuctionId(null); setDetailId(null); setPage(n => n - 1); }}>Anterior</button>
        <span>Página {page} de {Math.max(1, Math.ceil(result.total / result.limit))}</span>
        <button type="button" disabled={page * result.limit >= result.total || loading} onClick={() => { auditRequest.current += 1; setAuditAuctionId(null); setDetailId(null); setPage(n => n + 1); }}>Próxima</button>
      </div>
    </>}
  </section>;
}
