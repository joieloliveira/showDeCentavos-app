'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { listAdminAuctions, type AdminAuctionList } from '@/services/adminAuctions';
import { getApiError } from '@/services/auth';

export function ActiveAuctionsOverview() {
  const { user, isLoading, getToken } = useAuth();
  const [data, setData] = useState<AdminAuctionList | null>(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  useEffect(() => {
    if (isLoading || user?.role !== 'admin') return;
    const token = getToken();
    if (!token) { setError('Sessão administrativa indisponível.'); return; }
    let alive = true;
    let busy = false;
    async function refresh() {
      if (!alive || busy || document.visibilityState === 'hidden') return;
      busy = true;
      try {
        const result = await listAdminAuctions(token!, 1, 'active');
        if (alive) {
          setData(result);
          setError('');
          const checked = Date.now();
          setCheckedAt(checked);
          setUpdatedAt(new Date(checked).toLocaleTimeString('pt-BR'));
        }
      } catch (err: unknown) {
        if (alive) setError(getApiError(err));
      } finally {
        busy = false;
      }
    }
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [getToken, isLoading, user?.role]);

  if (isLoading || user?.role !== 'admin') return null;
  const overdue = data?.auctions.filter(auction => {
    if (!auction.endsAt || checkedAt === null) return false;
    const deadline = Date.parse(auction.endsAt);
    return Number.isFinite(deadline) && deadline < checkedAt - 30000;
  }) ?? [];
  const withoutDeadline = data?.auctions.filter(auction => !auction.endsAt || !Number.isFinite(Date.parse(auction.endsAt))) ?? [];
  return <section className="panel">
    <h2>Leilões em andamento</h2>
    <p>Consulta de leitura a cada 15 segundos, apenas enquanto a aba estiver visível. Até 20 leilões recentes são exibidos. Os alertas são indicativos e não alteram o estado dos leilões.</p>
    {updatedAt && <p>Atualizado às {updatedAt}</p>}
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Consultando leilões ativos...</p>}
    {data && <p><strong>{data.pagination.total}</strong> leilão(ões) ativo(s) no total.</p>}
    {overdue.length > 0 && <p role="status"><strong>Atenção:</strong> {overdue.length} leilão(ões) ainda constavam como ativos mais de 30 segundos após o prazo registrado na última consulta. Verifique o agendador e o histórico antes de qualquer intervenção. <Link href="/admin/auctions">Investigar</Link></p>}
    {withoutDeadline.length > 0 && <p role="status">{withoutDeadline.length} leilão(ões) ativo(s) sem prazo válido de encerramento registrado. Isso pode ser esperado antes do primeiro lance. <Link href="/admin/auctions">Consultar</Link></p>}
    {data && data.auctions.length === 0 && <p>Nenhum leilão em andamento.</p>}
    {data && data.auctions.length > 0 && <ul>
      {data.auctions.map(auction => <li key={auction._id}>
        <strong>{auction.product?.name ?? 'Produto não disponível'}</strong>
        {' — '} {auction.bidCount} lance(s), preço atual {(auction.currentPriceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        {' — '} {auction.endsAt ? `Prazo registrado: ${new Date(auction.endsAt).toLocaleString('pt-BR')}` : 'Sem prazo de encerramento registrado'}
        {' — '} {overdue.some(item => item._id === auction._id) ? <strong>Prazo ultrapassado — verificar</strong> : withoutDeadline.some(item => item._id === auction._id) ? 'Sem prazo válido' : 'Dentro do prazo registrado'}
        {' — '} <Link href="/admin/auctions">Gerenciar</Link>
      </li>)}
    </ul>}
    {data && data.pagination.total > data.auctions.length && <p>Há mais leilões ativos na página de gerenciamento.</p>}
  </section>;
}
