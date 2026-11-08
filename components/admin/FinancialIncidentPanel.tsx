'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import { listAdminFinancialIncidents, updateAdminFinancialIncident, listAdminFinancialIncidentAudit, type FinancialIncidentList, type FinancialIncidentStatus, type FinancialIncidentAudit } from '@/services/adminFinancialIncidents';

const statusLabels: Record<FinancialIncidentStatus, string> = {
  pending: 'Pendente', investigating: 'Em análise', resolved: 'Resolvido'
};
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não disponível' : date.toLocaleString('pt-BR');
};

export function FinancialIncidentPanel() {
  const { user, isLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | FinancialIncidentStatus>('pending');
  const [result, setResult] = useState<FinancialIncidentList | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [audit, setAudit] = useState<FinancialIncidentAudit[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const isAdmin = user?.role === 'admin';
  const closeDetails = () => {
    setSelectedId(null);
    setAudit(null);
    setNote('');
    setActionError('');
    setActionMessage('');
  };

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    queueMicrotask(() => {
      if (active) { setResult(null); setError(''); setLoading(true); }
    });
    listAdminFinancialIncidents(token, page, status)
      .then(data => { if (active) setResult(data); })
      .catch((err: unknown) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoading, isAdmin, getToken, page, status, refresh]);

  const selected = result?.items.find(item => item._id === selectedId);
  const nextStatus = selected?.status === 'pending' ? 'investigating' : selected?.status === 'investigating' ? 'resolved' : null;

  const showAudit = async (incidentId: string) => {
    setSelectedId(incidentId);
    setAudit(null);
    setNote('');
    setActionError('');
    setActionMessage('');
    const token = getToken();
    if (!token) { setActionError('Sessão expirada. Entre novamente.'); return; }
    setAuditLoading(true);
    try {
      setAudit(await listAdminFinancialIncidentAudit(token, incidentId));
    } catch (err: unknown) {
      setActionError(getApiError(err));
    } finally {
      setAuditLoading(false);
    }
  };

  const submitTransition = async () => {
    if (!selected || !nextStatus || !note.trim() || saving) return;
    const token = getToken();
    if (!token) { setActionError('Sessão expirada. Entre novamente.'); return; }
    setSaving(true);
    setActionError('');
    setActionMessage('');
    try {
      await updateAdminFinancialIncident(token, selected._id, nextStatus, note.trim());
      closeDetails();
      setActionMessage('Situação atualizada e registrada na auditoria. Consulte o filtro correspondente para visualizar o incidente.');
      setRefresh(n => n + 1);
    } catch (err: unknown) {
      setActionError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <section className="panel">Verificando sua sessão...</section>;
  if (!user) return <section className="panel"><h2>Entre como administrador</h2><Link href="/login?next=/admin/financial/incidents">Entrar</Link></section>;
  if (!isAdmin) return <section className="panel"><h2>Acesso restrito</h2><p>Esta área é exclusiva de administradores.</p></section>;

  return <section className="panel incident-panel">
    <h2>Incidentes de cobrança</h2>
    <p>Gerencie a investigação com justificativa e histórico de auditoria. Nenhuma ação aqui movimenta dinheiro ou estoque.</p>
    <div className="incident-filters">
      <label className="incident-field">Situação{' '}
        <select value={status} onChange={e => { closeDetails(); setStatus(e.target.value as '' | FinancialIncidentStatus); setPage(1); }}>
          <option value="">Todas</option>
          <option value="pending">Pendentes</option>
          <option value="investigating">Em análise</option>
          <option value="resolved">Resolvidos</option>
        </select>
      </label>
      <button type="button" className="incident-action" onClick={() => { closeDetails(); setRefresh(n => n + 1); }} disabled={loading || saving}>Atualizar</button>
    </div>
    {!selectedId && actionMessage && <p role="status">{actionMessage}</p>}
    {loading && <p role="status">Carregando incidentes...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && result && <>
      <p>{result.total} incidente(s) encontrado(s).</p>
      <div className="incident-table-wrap">
        <table className="incident-table">
          <thead><tr><th>Pedido</th><th>Cobrança</th><th>Motivo</th><th>Situação</th><th>Ocorrências</th><th>Última notificação</th><th>Gerenciar</th></tr></thead>
          <tbody>{result.items.map(item => <tr key={item._id}>
            <td className="incident-order">{item.order}</td>
            <td className="incident-order">{item.providerOrderId}</td>
            <td>{item.reason === 'late_approval_after_closure' ? 'Aprovação após encerramento' : item.reason === 'approved_amount_mismatch' ? 'Divergência no valor da cobrança' : item.reason}</td>
            <td>{statusLabels[item.status] ?? item.status}</td>
            <td>{item.occurrences}</td>
            <td>{formatDate(item.lastSeenAt)}</td>
            <td><button type="button" onClick={() => void showAudit(item._id)}>Detalhes</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {selected && <div className="panel" aria-label="Detalhes do incidente">
        <h3>Investigação e auditoria</h3>
        <button type="button" onClick={closeDetails}>Fechar</button>
        <>
          <p>Pedido: {selected.order} | Cobrança: {selected.providerOrderId}</p>
          <p>Situação: {statusLabels[selected.status]}</p>
          {nextStatus && <div className="incident-filters">
            <label className="incident-field">Justificativa obrigatória
              <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={2000} rows={3} disabled={saving} />
            </label>
            <button type="button" className="incident-action" disabled={saving || !note.trim()} onClick={() => void submitTransition()}>
              {saving ? 'Salvando...' : nextStatus === 'investigating' ? 'Iniciar investigação' : 'Marcar como resolvido'}
            </button>
          </div>}
        </>
        {actionError && <p role="alert">{actionError}</p>}
        {actionMessage && <p role="status">{actionMessage}</p>}
        <h4>Histórico de auditoria</h4>
        {auditLoading ? <p>Carregando histórico...</p> : audit && (audit.length
          ? <ol>{audit.map(entry => <li key={entry._id} style={{ marginBottom: '1rem', overflowWrap: 'anywhere' }}>
              <strong>{statusLabels[entry.fromStatus]} → {statusLabels[entry.toStatus]}</strong>
              <div><small>{formatDate(entry.createdAt)} · Administrador: {entry.actor}</small></div>
              <p>{entry.note}</p>
            </li>)}</ol>
          : <p>Nenhuma alteração administrativa registrada.</p>)}
      </div>}
      {result.items.length === 0 && <p>Nenhum incidente encontrado para o filtro selecionado.</p>}
      <div className="incident-pagination">
        <button type="button" disabled={page <= 1} onClick={() => { closeDetails(); setPage(n => n - 1); }}>Anterior</button>
        <span>Página {page} de {Math.max(1, Math.ceil(result.total / result.limit))}</span>
        <button type="button" disabled={page * result.limit >= result.total} onClick={() => { closeDetails(); setPage(n => n + 1); }}>Próxima</button>
      </div>
    </>}
  </section>;
}
