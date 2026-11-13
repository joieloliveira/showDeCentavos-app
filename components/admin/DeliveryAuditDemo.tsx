'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const sample = [
  { fromStatus: 'not_started', toStatus: 'preparing', occurredAt: '2026-11-03T13:00:00-03:00', actor: 'Administrador de demonstração' },
  { fromStatus: 'preparing', toStatus: 'shipped', occurredAt: '2026-11-03T15:30:00-03:00', actor: 'Administrador de demonstração' },
  { fromStatus: 'shipped', toStatus: 'delivered', occurredAt: '2026-11-03T18:45:00-03:00', actor: 'Administrador de demonstração' },
];

export function DeliveryAuditDemo() {
  const { user, isLoading } = useAuth();
  const [expanded, setExpanded] = useState(false);
  if (isLoading) return <section className="panel">Verificando sessão...</section>;
  if (!user) return <section className="panel"><p>Entre com sua conta administrativa para visualizar a demonstração.</p><Link href="/login?next=/admin/fulfillments/demo">Entrar</Link></section>;
  if (user.role !== 'admin') return <section className="panel">Acesso restrito a administradores.</section>;
  return <section className="panel">
    <h2>Arremate fictício — demonstração visual</h2>
    <p role="status"><strong>SIMULAÇÃO:</strong> estes dados são locais da interface. Nenhuma consulta, pagamento, lance, gravação no MongoDB ou alteração de entrega será realizada.</p>
    <div className="incident-table-wrap"><table className="incident-table">
      <thead><tr><th>Arremate</th><th>Valor</th><th>Pagamento</th><th>Entrega</th><th>Auditoria</th></tr></thead>
      <tbody><tr>
        <td>DEMO-ENTREGA-001</td><td>R$ 1,50 (fictício)</td><td>paid (simulado)</td><td>delivered (simulado)</td>
        <td><button type="button" className="incident-action" aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}>{expanded ? 'Fechar histórico' : 'Ver histórico'}</button></td>
      </tr></tbody>
    </table></div>
    {expanded && <section className="panel" aria-label="Histórico simulado de entrega">
      <h3>Histórico de entrega — simulação</h3>
      <ol>{sample.map(event => <li key={event.toStatus}>
        <strong>{event.fromStatus} → {event.toStatus}</strong> — {new Date(event.occurredAt).toLocaleString('pt-BR')}
        <span> · {event.actor}</span>
      </li>)}</ol>
      <p>Os eventos acima são exemplos visuais, não registros reais de auditoria.</p>
    </section>}
    <p><Link href="/admin/fulfillments">Voltar à gestão real de entregas</Link></p>
  </section>;
}
