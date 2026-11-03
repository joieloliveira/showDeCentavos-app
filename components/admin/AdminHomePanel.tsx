'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const sections = [
  { href: '/admin/products', title: 'Produtos', description: 'Cadastre e organize os produtos disponíveis para leilão.' },
  { href: '/admin/auctions', title: 'Leilões', description: 'Gerencie agendamentos, acompanhe disputas e consulte auditorias.' },
  { href: '/admin/fulfillments', title: 'Arremates e entregas', description: 'Acompanhe pagamentos, endereços e etapas de entrega.' },
  { href: '/admin/wallet/incidents', title: 'Incidentes financeiros', description: 'Consulte reembolsos, contestações e ocorrências que exigem revisão.' },
];

export function AdminHomePanel() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <section className="panel">Verificando sua sessão...</section>;
  if (!user) return <section className="panel"><h2>Entre como administrador</h2><Link href="/login?next=/admin">Entrar</Link></section>;
  if (user.role !== 'admin') return <section className="panel"><h2>Acesso restrito</h2><p>Esta área é exclusiva de administradores.</p></section>;
  return <div className="admin-home-grid">
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
