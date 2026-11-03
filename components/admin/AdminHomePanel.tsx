'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuctionOperationsSummary, type AuctionOperationsSummary } from '@/services/adminOperations';
import { getApiError } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveAuctionsOverview } from './ActiveAuctionsOverview';
import { FulfillmentAlertsOverview } from './FulfillmentAlertsOverview';

const sections = [
  { href: '/admin/products', title: 'Produtos', description: 'Cadastre e organize os produtos disponíveis para leilão.' },
  { href: '/admin/auctions', title: 'Leilões', description: 'Gerencie agendamentos, acompanhe disputas e consulte auditorias.' },
  { href: '/admin/fulfillments', title: 'Arremates e entregas', description: 'Acompanhe pagamentos, endereços e etapas de entrega.' },
  { href: '/admin/wallet/incidents', title: 'Incidentes financeiros', description: 'Consulte reembolsos, contestações e ocorrências que exigem revisão.' },
];

export function AdminHomePanel() {
  const { user, isLoading, getToken } = useAuth();
  const [summary, setSummary] = useState<AuctionOperationsSummary | null>(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (isLoading || user?.role !== 'admin') return;
    const token = getToken();
    if (!token) { setError('Sessão administrativa indisponível.'); return; }
    let active = true;
    let inFlight = false;
    const load = async () => {
      if (!active || inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      try {
        const data = await getAuctionOperationsSummary(token);
        if (active) {
          setSummary(data);
          setUpdatedAt(new Date());
          setError('');
        }
      } catch (err: unknown) {
        if (active) setError(getApiError(err));
      } finally {
        inFlight = false;
      }
    };
    void load();
    const interval = window.setInterval(() => { void load(); }, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isLoading, user?.role, getToken, refresh]);
  if (isLoading) return <section className="panel">Verificando sua sessão...</section>;
  if (!user) return <section className="panel"><h2>Entre como administrador</h2><Link href="/login?next=/admin">Entrar</Link></section>;
  if (user.role !== 'admin') return <section className="panel"><h2>Acesso restrito</h2><p>Esta área é exclusiva de administradores.</p></section>;
  return <div className="admin-home-grid">
    <ActiveAuctionsOverview />
    <FulfillmentAlertsOverview />
    <section className="panel">
      <h2>Indicadores operacionais</h2>
      <p>Atualização automática a cada 30 segundos enquanto esta aba estiver visível.</p>
      <button type="button" className="incident-action" onClick={() => setRefresh(value => value + 1)}>Atualizar agora</button>
      {updatedAt && <p>Última atualização: <time dateTime={updatedAt.toISOString()}>{updatedAt.toLocaleTimeString('pt-BR')}</time></p>}
      {summary && summary.incidentsRequiringReview > 0 && <p role="status"><strong>Atenção:</strong> {summary.incidentsRequiringReview} incidente(s) aguardando revisão. <Link href="/admin/wallet/incidents">Consultar incidentes</Link></p>}
      {summary && summary.auctions.active > 0 && <p role="status">{summary.auctions.active} leilão(ões) ativo(s). <Link href="/admin/auctions">Acompanhar leilões</Link></p>}
      {error && <p role="alert">{error}</p>}
      {!summary && !error && <p role="status">Carregando indicadores...</p>}
      {summary && <ul>
        <li>Leilões agendados: <strong>{summary.auctions.scheduled}</strong></li>
        <li>Leilões ativos: <strong>{summary.auctions.active}</strong></li>
        <li>Leilões encerrados: <strong>{summary.auctions.finished}</strong></li>
        <li>Pagamentos de arremates pendentes: <strong>{summary.payments.pending}</strong></li>
        <li>Entregas em preparação: <strong>{summary.deliveries.preparing}</strong></li>
        <li>Produtos enviados: <strong>{summary.deliveries.shipped}</strong></li>
        <li>Entregas concluídas: <strong>{summary.deliveries.delivered}</strong></li>
        <li>Incidentes financeiros para revisão: <strong>{summary.incidentsRequiringReview}</strong></li>
      </ul>}
      <p>Contagens atuais do banco de dados. Não representam faturamento.</p>
    </section>
    {sections.map(section => <section className="panel" key={section.href}>
      <h2>{section.title}</h2>
      <p>{section.description}</p>
      <Link className="btn-primary" href={section.href}>Acessar módulo</Link>
    </section>)}
    <section className="panel">
      <h2>Operação segura</h2>
      <p>Os pagamentos reais e os lances financeiros permanecem sujeitos às configurações de segurança e à homologação antes de serem habilitados.</p>
    </section>
  </div>;
}
