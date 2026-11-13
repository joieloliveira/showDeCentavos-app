'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import {
  getAdminWalletIncident, listAdminWalletIncidents,
  type IncidentDetail, type IncidentList,
} from '@/services/adminWalletIncidents';

const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value?: string | null) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('pt-BR') : 'Não disponível';
const statusLabel = (value: string) => ({ refunded: 'Reembolso', charged_back: 'Contestação', review_required: 'Revisão necessária', resolved: 'Resolvido', approved: 'Aprovado', pending: 'Pendente', failed: 'Falhou', cancelled: 'Cancelado' } as Record<string, string>)[value] ?? value;

export function WalletIncidentPanel() {
  const { user, isLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [providerStatus, setProviderStatus] = useState('');
  const [resolution, setResolution] = useState('review_required');
  const [result, setResult] = useState<IncidentList | null>(null);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    // Clearing prior data prevents showing results from another filter or session.
    queueMicrotask(() => {
      if (active) { setResult(null); setDetail(null); setError(''); setLoading(true); }
    });
    listAdminWalletIncidents(token, page, providerStatus, resolution)
      .then((data) => { if (active) setResult(data); })
      .catch((err: unknown) => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoading, isAdmin, getToken, page, providerStatus, resolution]);

  const openDetail = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try { setDetail(await getAdminWalletIncident(token, id)); }
    catch (err) { setDetailError(getApiError(err)); }
    finally { setDetailLoading(false); }
  };

  if (isLoading) return <div className="panel">Verificando sua sessão...</div>;
  if (!user) return <div className="panel"><h2>Faça login como administrador</h2><Link href="/login?next=/admin/wallet/incidents" className="btn-primary">Entrar</Link></div>;
  if (!isAdmin) return <div className="panel"><h2>Acesso restrito</h2><p>Esta área é exclusiva de administradores.</p></div>;

  return <div className="incident-layout">
    <section className="panel incident-panel">
      <h2>Incidentes financeiros</h2>
      <p>Consulta somente de leitura. Nenhuma operação altera saldo ou situação do incidente.</p>
      <div className="incident-filters">
        <label className="incident-field">Tipo de ocorrência{' '}
          <select aria-label="Tipo de ocorrência" value={providerStatus} onChange={(e) => { setPage(1); setProviderStatus(e.target.value); }}>
            <option value="">Todos</option><option value="refunded">Reembolso</option><option value="charged_back">Contestação</option>
          </select>
        </label>
        <label className="incident-field">Situação{' '}
          <select aria-label="Situação do incidente" value={resolution} onChange={(e) => { setPage(1); setResolution(e.target.value); }}>
            <option value="">Todas</option><option value="review_required">Revisão necessária</option><option value="resolved">Resolvido</option>
          </select>
        </label>
      </div>
      {loading && <p role="status">Carregando incidentes...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && result && <><p>{result.pagination.total} ocorrência(s) encontrada(s).</p>
        <div className="incident-table-wrap">
          <table className="incident-table">
            <thead><tr><th>Data</th><th>Tipo</th><th>Situação</th><th>Pedido</th><th>Ação</th></tr></thead>
            <tbody>{result.incidents.map((incident) => <tr key={incident._id}>
              <td>{date(incident.createdAt)}</td><td>{statusLabel(incident.providerStatus)}</td><td><span className={incident.resolution === 'review_required' ? 'incident-badge warning' : 'incident-badge resolved'}>{statusLabel(incident.resolution)}</span></td>
              <td className="incident-order">{incident.providerOrderId}</td>
              <td><button type="button" className="incident-action" disabled={detailLoading} onClick={() => void openDetail(incident._id)}>Ver detalhes</button></td>
            </tr>)}</tbody>
          </table>
        </div>
        {result.incidents.length === 0 && <p>Nenhum incidente encontrado para os filtros selecionados.</p>}
        <div className="incident-pagination">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((n) => n - 1)}>Anterior</button>
          <span>Página {page} de {Math.max(1, result.pagination.totalPages)}</span>
          <button type="button" disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((n) => n + 1)}>Próxima</button>
        </div>
      </>}
    </section>
    {(detailLoading || detailError || detail) && <section className="panel incident-panel">
      <h2>Detalhes da ocorrência</h2>
      {detailLoading && <p>Carregando detalhes...</p>}
      {detailError && <p role="alert">{detailError}</p>}
      {detail && <div className="incident-detail">
        <p><strong>ID:</strong> {detail.incident._id}</p>
        <p><strong>Tipo:</strong> {statusLabel(detail.incident.providerStatus)}</p>
        <p><strong>Situação:</strong> {statusLabel(detail.incident.resolution)}</p>
        <p><strong>Última observação:</strong> {date(detail.incident.lastObservedAt)}</p>
        <h3>Depósito</h3>
        {detail.deposit ? <><p><strong>Valor:</strong> {money(detail.deposit.amountCents)}</p>
          <p><strong>Status:</strong> {statusLabel(detail.deposit.status)}</p>
          <p><strong>Pedido:</strong> {detail.deposit.providerOrderId}</p>
          <p><strong>Pagamento:</strong> {detail.deposit.providerPaymentId ?? 'Não disponível'}</p></> : <p>Depósito indisponível ou vínculo inconsistente.</p>}
        <h3>Usuário</h3>
        {detail.user ? <><p><strong>Nome:</strong> {detail.user.name}</p>
          <p><strong>Email:</strong> {detail.user.email}</p>
          <p><strong>Conta ativa:</strong> {detail.user.isActive ? 'Sim' : 'Não'}</p></> : <p>Usuário não encontrado.</p>}
        <button type="button" className="incident-action" onClick={() => setDetail(null)}>Fechar detalhes</button>
      </div>}
    </section>}
  </div>;
}
