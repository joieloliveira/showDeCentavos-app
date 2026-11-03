'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import { listAdminFulfillments, type Fulfillment } from '@/services/adminFulfillments';

type AlertItem = { key: string; label: string; detail: string };
const isOverdue = (item: Fulfillment, now: number) => {
  const deadline = Date.parse(item.paymentDeadline);
  return item.paymentStatus !== 'paid' && item.paymentStatus !== 'refunded' &&
    item.paymentStatus !== 'cancelled' && Number.isFinite(deadline) && deadline < now;
};

export function FulfillmentAlertsOverview() {
  const { user, isLoading, getToken } = useAuth();
  const [items, setItems] = useState<Fulfillment[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isLoading || user?.role !== 'admin') return;
    const token = getToken();
    if (!token) { setError('Sessão administrativa indisponível.'); return; }
    let active = true;
    let busy = false;
    async function refresh() {
      if (!active || busy || document.visibilityState !== 'visible') return;
      busy = true;
      try {
        const result = await listAdminFulfillments(token!, 1, '', '');
        if (active) {
          setItems(result.items);
          setTotal(result.total);
          setCheckedAt(Date.now());
          setError('');
        }
      } catch (err: unknown) {
        if (active) setError(getApiError(err));
      } finally { busy = false; }
    }
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [getToken, isLoading, user?.role, refreshKey]);

  if (isLoading || user?.role !== 'admin') return null;
  const alerts: AlertItem[] = checkedAt === null ? [] : items.flatMap(item => {
    const result: AlertItem[] = [];
    if (isOverdue(item, checkedAt)) {
      result.push({ key: item.auctionId + '-payment', label: 'Prazo de pagamento ultrapassado',
        detail: 'Arremate ' + item.auctionId + ' — pagamento ' + item.paymentStatus });
    }
    if (item.paymentStatus === 'paid' && item.deliveryStatus === 'not_started') {
      result.push({ key: item.auctionId + '-delivery', label: 'Entrega ainda não iniciada',
        detail: 'Arremate ' + item.auctionId + (item.addressSubmittedAt ? ' — endereço informado' : ' — aguardando endereço') });
    }
    if (item.deliveryStatus === 'preparing' || item.deliveryStatus === 'shipped') {
      result.push({ key: item.auctionId + '-progress', label: item.deliveryStatus === 'preparing' ? 'Em preparação' : 'Enviado — acompanhar',
        detail: 'Arremate ' + item.auctionId });
    }
    return result;
  });
  return <section className="panel">
    <h2>Alertas de arremates e entregas</h2>
    <p>Consulta a cada 30 segundos enquanto a aba estiver visível. Análise limitada aos 20 arremates mais recentes; não é uma contagem global de pendências.</p>
    <button type="button" className="incident-action" onClick={() => setRefreshKey(value => value + 1)}>Atualizar alertas</button>
    {checkedAt !== null && <p>Última consulta: {new Date(checkedAt).toLocaleTimeString('pt-BR')}</p>}
    {error && <p role="alert">{error}</p>}
    {total === null && !error && <p role="status">Consultando arremates...</p>}
    {total !== null && <p>Registros consultados: {items.length} de {total}.</p>}
    {total !== null && alerts.length === 0 && <p>Nenhuma pendência identificada entre os registros consultados.</p>}
    {alerts.length > 0 && <ul>{alerts.map(alert => <li key={alert.key}>
      <strong>{alert.label}</strong> — {alert.detail}
    </li>)}</ul>}
    <p><Link href="/admin/fulfillments">Abrir gestão de arremates e entregas</Link></p>
    <p>Os alertas são informativos e não confirmam pagamentos nem modificam entregas.</p>
  </section>;
}
