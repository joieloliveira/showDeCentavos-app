'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type Audit = { actorId: string; actorName?: string | null; fromStatus: string; toStatus: string; occurredAt: string };
type Fulfillment = { auctionId: string; winningPriceCents: number; paymentStatus: string; deliveryStatus: string };
const base = 'http://127.0.0.1:3002';
const money = (value: number) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DeliveryAuditIntegrationPage() {
  const { user, isLoading } = useAuth();
  const [record, setRecord] = useState<Fulfillment | null>(null);
  const [token, setToken] = useState('');
  const [events, setEvents] = useState<Audit[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const admin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading || !admin) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const sessionResponse = await fetch(`${base}/demo/session`, { signal: controller.signal, cache: 'no-store' });
        if (!sessionResponse.ok) throw new Error('Servidor isolado indisponível. Inicie o script de homologação na API.');
        const session: { token: string; auctionId: string; mode: string } = await sessionResponse.json();
        if (session.mode !== 'isolated-demo' || !session.token) throw new Error('Sessão de demonstração inválida.');
        const response = await fetch(`${base}/api/auctions/admin/fulfillments`, {
          headers: { Authorization: `Bearer ${session.token}` },
          signal: controller.signal, cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Falha na listagem real: HTTP ${response.status}`);
        const data: { items: Fulfillment[] } = await response.json();
        const item = data.items?.find(value => value.auctionId === session.auctionId);
        if (!item) throw new Error('Arremate temporário não encontrado na API.');
        if (!controller.signal.aborted) { setToken(session.token); setRecord(item); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Falha de integração.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [isLoading, admin]);

  const toggle = async () => {
    if (events) { setEvents(null); return; }
    if (!record || !token || auditLoading) return;
    setAuditLoading(true);
    setError('');
    try {
      const response = await fetch(`${base}/api/auctions/admin/fulfillments/${encodeURIComponent(record.auctionId)}/delivery-audit`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Falha na auditoria real: HTTP ${response.status}`);
      const data: { auctionId: string; items: Audit[] } = await response.json();
      if (data.auctionId !== record.auctionId || !Array.isArray(data.items)) throw new Error('Resposta de auditoria inválida.');
      setEvents(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar auditoria.');
    } finally {
      setAuditLoading(false);
    }
  };

  return <div className="site-container page-content">
    <div className="page-heading">
      <span className="eyebrow">Administração · Homologação isolada</span>
      <h1>Auditoria de entregas — integração real</h1>
      <p>Esta tela consulta os endpoints reais da API em localhost:3002, usando somente registros fictícios em um banco temporário. Nenhum lance, pagamento ou alteração de entrega é realizado.</p>
    </div>
    {isLoading ? <section className="panel">Verificando sessão...</section>
      : !user ? <section className="panel"><Link href="/login?next=/admin/fulfillments/integration">Entrar como administrador</Link></section>
      : !admin ? <section className="panel">Acesso restrito a administradores.</section>
      : <section className="panel">
        <h2>Consulta real à API de homologação</h2>
        {loading && <p role="status">Consultando API isolada...</p>}
        {error && <p role="alert">{error}</p>}
        {record && <><p role="status">Arremate fictício recuperado do MongoDB temporário pela API real.</p>
          <div className="incident-table-wrap"><table className="incident-table">
            <thead><tr><th>Arremate</th><th>Valor</th><th>Pagamento</th><th>Entrega</th><th>Auditoria</th></tr></thead>
            <tbody><tr><td>{record.auctionId}</td><td>{money(record.winningPriceCents)}</td>
              <td>{record.paymentStatus}</td><td>{record.deliveryStatus}</td>
              <td><button type="button" className="incident-action" disabled={auditLoading} onClick={() => void toggle()} aria-expanded={events !== null}>
                {auditLoading ? 'Consultando...' : events ? 'Fechar histórico' : 'Ver histórico'}
              </button></td></tr></tbody>
          </table></div>
          {events && <section className="panel" aria-label="Histórico real de entrega">
            <h3>Histórico obtido da API</h3>
            {events.length === 0 ? <p>Nenhum evento encontrado.</p> : <ol>{events.map((event, index) =>
              <li key={event.toStatus + index}><strong>{event.fromStatus} → {event.toStatus}</strong>
                {' — '}{new Date(event.occurredAt).toLocaleString('pt-BR')}
                {' · Administrador: '}{event.actorName || event.actorId}</li>)}</ol>}
            <p>Consulta somente leitura. Endereços não são incluídos na resposta da auditoria.</p>
          </section>}
        </>}
        <p><Link href="/admin/fulfillments">Voltar à gestão administrativa</Link></p>
      </section>}
  </div>;
}
