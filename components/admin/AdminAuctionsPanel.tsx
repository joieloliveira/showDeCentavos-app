'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AdminAuctionCreateForm } from './AdminAuctionCreateForm';
import { listAdminAuctions, type AdminAuction, type AdminAuctionList } from '@/services/adminAuctions';
import { getApiError } from '@/services/auth';
import { money } from '@/utils/format';

const labels: Record<string, string> = { scheduled: 'Agendado', active: 'Ativo', finished: 'Encerrado', cancelled: 'Cancelado' };
export function AdminAuctionsPanel() {
  const { user, isLoading, getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<AdminAuctionList | null>(null);
  const [selected, setSelected] = useState<AdminAuction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = user?.role === 'admin';
  useEffect(() => {
    if (isLoading || !isAdmin) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setResult(null); setSelected(null); setError(''); } });
    listAdminAuctions(token, page, status)
      .then(data => { if (active) setResult(data); })
      .catch(err => { if (active) setError(getApiError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [getToken, isAdmin, isLoading, page, status, refresh]);
  if (isLoading) return <div className="panel">Verificando sua sessão...</div>;
  if (!user) return <div className="panel"><h2>Entre como administrador</h2><Link className="btn-primary" href="/login?next=/admin/auctions">Entrar</Link></div>;
  if (!isAdmin) return <div className="panel"><h2>Acesso restrito</h2><p>Área exclusiva de administradores.</p></div>;
  const auctions = result?.auctions.filter(a => (a.product?.name ?? '').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))) ?? [];
  return <div className="admin-auctions">
    <div className="admin-auction-notice"><strong>Consulta administrativa · somente leitura</strong><p>Dados reais do MongoDB. Esta tela não permite criar, publicar ou iniciar leilões. A busca por nome filtra apenas a página carregada.</p></div>
    <div className="admin-auction-stats"><div><span>Total de leilões cadastrados {status ? '(filtro atual)' : ''}</span><strong>{result?.pagination.total ?? '—'}</strong></div><div><span>Registros nesta página</span><strong>{result?.auctions.length ?? '—'}</strong></div><div><span>Página atual</span><strong>{page}</strong></div></div>
    <AdminAuctionCreateForm onCreated={() => { setPage(1); setRefresh(n => n + 1); }} />
    <section className="panel admin-auction-panel"><h2>Leilões cadastrados</h2>
      <div className="admin-auction-filters"><label>Buscar nesta página<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do produto..." /></label><label>Situação<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Todas</option><option value="scheduled">Agendado</option><option value="active">Ativo</option><option value="finished">Encerrado</option><option value="cancelled">Cancelado</option></select></label></div>
      {loading && <p role="status">Carregando leilões...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && result && <><div className="admin-auction-table-wrap"><table className="admin-auction-table"><thead><tr><th>Produto</th><th>Situação</th><th>Preço inicial</th><th>Preço atual</th><th>Custo do lance</th><th>Detalhes</th></tr></thead><tbody>{auctions.map(a => <tr key={a._id}><td><span className="admin-auction-product"><strong>{a.product?.name ?? 'Produto indisponível'}</strong></span></td><td>{labels[a.status] ?? a.status}</td><td>{money(a.startPriceCents)}</td><td>{money(a.currentPriceCents)}</td><td>{money(a.bidCostCents)}</td><td><button type="button" className="incident-action" onClick={() => setSelected(a)}>Detalhes</button> <Link href={`/auctions/registered/${a._id}`} className="incident-action">Ver na vitrine</Link></td></tr>)}</tbody></table></div>
        {auctions.length === 0 && <p>Nenhum leilão encontrado nesta página.</p>}
        <p>{result.pagination.total} leilão(ões) no banco para o filtro selecionado.</p>
        <div className="incident-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page} de {Math.max(1, result.pagination.totalPages)}</span><button type="button" disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage(p => p + 1)}>Próxima</button></div>
      </>}
    </section>
    {selected && <section className="panel admin-auction-panel"><h2>{selected.product?.name ?? 'Leilão'}</h2><p><strong>ID:</strong> {selected._id}</p><p><Link href={`/auctions/registered/${selected._id}`} className="incident-action">Abrir página pública do leilão</Link></p><p><strong>Situação:</strong> {labels[selected.status] ?? selected.status}</p><p><strong>Quantidade de lances:</strong> {selected.bidCount}</p><p><strong>Duração por lance:</strong> {selected.durationSeconds} segundos</p><p><strong>Início:</strong> {selected.startsAt ? new Date(selected.startsAt).toLocaleString('pt-BR') : 'Não iniciado'}</p><p><strong>Término:</strong> {selected.endsAt ? new Date(selected.endsAt).toLocaleString('pt-BR') : 'Não definido'}</p><button type="button" className="incident-action" onClick={() => setSelected(null)}>Fechar detalhes</button></section>}
  </div>;
}
