'use client';
import Link from 'next/link';
import { ArrowRight, CircleUserRound, Clock3, Gavel, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
export function AccountDashboard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="panel" role="status">Verificando sua sessão...</div>;
  if (!user) return <div className="panel account-login-prompt"><CircleUserRound size={35}/><h2>Entre para acessar seu painel</h2><p>Consulte sua carteira e acompanhe as novidades do Show de Centavos em um só lugar.</p><Link className="btn-primary" href="/login?next=/account">Fazer login <ArrowRight size={17}/></Link></div>;
  return <>
    <div className="account-welcome"><span className="eyebrow">Área do usuário</span><h1>Olá, {user.name}!</h1><p>Este é seu espaço para acompanhar sua conta e acessar os recursos da plataforma.</p></div>
    <div className="account-summary-grid">
      <Link href="/wallet" className="account-summary-card"><span className="account-summary-icon"><Wallet/></span><strong>Minha carteira</strong><p>Consulte seu saldo, depósitos PIX e histórico de movimentações.</p><span className="account-summary-action">Acessar carteira <ArrowRight size={16}/></span></Link>
      <div className="account-summary-card"><span className="account-summary-icon"><Gavel/></span><strong>Minhas participações</strong><p>O acompanhamento de lances e leilões participados será disponibilizado quando os leilões forem habilitados.</p><span className="account-summary-muted"><Clock3 size={15}/> Em desenvolvimento</span></div>
      <Link href="/auctions" className="account-summary-card"><span className="account-summary-icon"><ShieldCheck/></span><strong>Explorar leilões</strong><p>Conheça os produtos e consulte as condições das disputas demonstrativas.</p><span className="account-summary-action">Ver leilões <ArrowRight size={16}/></span></Link>
    </div>
    <section className="account-details"><div><span className="eyebrow">Dados da conta</span><h2>Meu perfil</h2><p>Informações vinculadas à sua sessão autenticada.</p></div><dl><div><dt>Nome</dt><dd>{user.name}</dd></div><div><dt>E-mail</dt><dd>{user.email}</dd></div><div><dt>Tipo de conta</dt><dd>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</dd></div></dl></section>
    <div className="account-safety-note"><ShieldCheck size={19}/><span>Os leilões apresentados atualmente são demonstrativos. Não é possível realizar lances reais nesta versão.</span></div>
  </>;
}
