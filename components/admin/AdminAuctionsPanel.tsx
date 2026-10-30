'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { demoAuctions } from '@/data/demo-auctions';
import { money } from '@/utils/format';

export function AdminAuctionsPanel() {
  const { user, isLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedSlug, setSelectedSlug] = useState('');
  if (isLoading) return <div className="panel">Verificando sua sessão...</div>;
  if (!user) return <div className="panel"><h2>Entre como administrador</h2><Link className="btn-primary" href="/login?next=/admin/auctions">Entrar</Link></div>;
  if (user.role !== 'admin') return <div className="panel"><h2>Acesso restrito</h2><p>Área exclusiva de administradores.</p></div>;
  const filtered = demoAuctions.filter(a => (status === 'all' || a.status === status) && (a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())));
  const selected = demoAuctions.find(a => a.slug === selectedSlug);
  return <div className="admin-auctions">
    <div className="admin-auction-notice" role="status"><strong>Ambiente demonstrativo · somente leitura</strong><p>Os produtos e valores são fictícios. Esta página não altera leilões nem permite publicação ou lances reais.</p></div>
    <div className="admin-auction-stats">
      <div><span>Produtos na vitrine</span><strong>{demoAuctions.length}</strong></div>
      <div><span>Simulações ativas</span><strong>{demoAuctions.filter(a => a.status === 'live').length}</strong></div>
      <div><span>Em breve</span><strong>{demoAuctions.filter(a => a.status === 'upcoming').length}</strong></div>
    </div>
    <section className="panel admin-auction-panel">
      <h2>Leilões demonstrativos</h2>
      <div className="admin-auction-filters">
        <label>Buscar produto ou categoria<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar na vitrine..." /></label>
        <label>Situação<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todas</option><option value="live">Simulação ativa</option><option value="upcoming">Em breve</option></select></label>
      </div>
      <div className="admin-auction-table-wrap"><table className="admin-auction-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Referência</th><th>Lance ilustrativo</th><th>Situação</th><th></th></tr></thead><tbody>{filtered.map(a => <tr key={a.id}><td><span className="admin-auction-product"><span>{a.emoji}</span><strong>{a.title}</strong></span></td><td>{a.category}</td><td>{money(a.retailPriceCents)}</td><td>{a.status === 'live' ? money(a.bidPriceCents) : '—'}</td><td>{a.status === 'live' ? 'Simulação ativa' : 'Em breve'}</td><td><button type="button" className="incident-action" onClick={() => setSelectedSlug(a.slug)}>Detalhes</button></td></tr>)}</tbody></table></div>
      {filtered.length === 0 && <p>Nenhum produto encontrado.</p>}
      <p>{filtered.length} produto(s) encontrado(s).</p>
    </section>
    {selected && <section className="panel admin-auction-panel"><h2>{selected.title}</h2><p><strong>Identificador:</strong> {selected.id}</p><p><strong>Categoria:</strong> {selected.category}</p><p><strong>Valor de referência:</strong> {money(selected.retailPriceCents)}</p><p><strong>Tempo fictício:</strong> {selected.secondsLeft} segundos</p><p><Link className="home-view-all" href={`/auctions/${selected.slug}`}>Ver página pública</Link></p><button type="button" className="incident-action" onClick={() => setSelectedSlug('')}>Fechar detalhes</button></section>}
  </div>;
}
