'use client';
import Link from 'next/link';
import { ArrowUpRight, CircleUserRound, LogOut, Menu, Wallet, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
export function Header() {
  const { user, logout } = useAuth();
  return <header className="site-header"><div className="site-container header-inner">
    <Link className="brand" href="/"><span className="brand-symbol"><Zap size={23} fill="currentColor" /></span><span>SHOW<span className="brand-em">DE</span>CENTAVOS<small>LEILÕES COM EMOÇÃO</small></span></Link>
    <nav className="desktop-nav"><Link href="/">Início</Link><Link href="/auctions">Leilões</Link><Link href="/how-it-works">Como funciona</Link><Link href="/winners">Ganhadores</Link></nav>
    <div className="header-actions">{user?.role === "admin" && <><Link className="header-admin-link" href="/admin/products">Produtos</Link><Link className="header-admin-link" href="/admin/auctions">Gerenciar leilões</Link><Link className="header-admin-link" href="/admin/wallet/incidents">Incidentes</Link></>}<Link className="header-wallet" href="/wallet"><Wallet size={17}/> Minha carteira</Link>
      {user ? <><Link className="sign-in" href="/account"><CircleUserRound size={18}/>{user.name}</Link><button type="button" className="header-logout" onClick={logout} aria-label="Sair da conta"><LogOut size={17}/> Sair</button></> :
        <Link className="sign-in" href="/login"><CircleUserRound size={18}/> Entrar <ArrowUpRight size={14}/></Link>}
      <Link className="mobile-menu" href="/auctions" aria-label="Ver leilões"><Menu/></Link>
    </div></div></header>;
}
