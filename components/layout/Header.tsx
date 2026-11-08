'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, CircleUserRound, LogOut, Menu, Wallet, X, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
      if (event.key !== 'Tab') return;
      const panel = document.querySelector<HTMLElement>('#mobile-navigation');
      const focusables = Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [open]);
  const close = () => setOpen(false);
  const signOut = () => { logout(); close(); };
  return <header className="site-header"><div className="site-container header-inner">
    <Link className="brand" href="/" onClick={close}><span className="brand-symbol"><Zap size={23} fill="currentColor" /></span><span>SHOW<span className="brand-em">DE</span>CENTAVOS<small>LEILÕES COM EMOÇÃO</small></span></Link>
    <nav className="desktop-nav" aria-label="Navegação principal"><Link href="/">Início</Link><Link href="/auctions">Leilões</Link><Link href="/how-it-works">Como funciona</Link><Link href="/winners">Ganhadores</Link></nav>
    <div className="header-actions">{user?.role === 'admin' && <><Link className="header-admin-link" href="/admin">Administração</Link><Link className="header-admin-link" href="/admin/auctions">Gerenciar leilões</Link><Link className="header-admin-link" href="/admin/wallet/incidents">Incidentes</Link></>}<Link className="header-wallet" href="/wallet"><Wallet size={17}/> Minha carteira</Link>
      {user ? <><Link className="sign-in" href="/account"><CircleUserRound size={18}/>{user.name}</Link><button type="button" className="header-logout" onClick={logout} aria-label="Sair da conta"><LogOut size={17}/> Sair</button></> :
        <Link className="sign-in" href="/login"><CircleUserRound size={18}/> Entrar <ArrowUpRight size={14}/></Link>}
    </div>
    <button ref={triggerRef} type="button" className="mobile-menu" aria-label="Abrir menu" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)}><Menu size={24}/></button>
  </div>
  {open && <div className="mobile-nav-layer"><button className="mobile-nav-backdrop" type="button" aria-label="Fechar menu" onClick={close}/><nav id="mobile-navigation" className="mobile-nav-panel" aria-label="Menu móvel" aria-modal="true" role="dialog">
    <div className="mobile-nav-heading"><strong>Menu</strong><button ref={closeRef} type="button" onClick={() => { close(); triggerRef.current?.focus(); }} aria-label="Fechar menu"><X size={23}/></button></div>
    <Link href="/" onClick={close}>Início</Link><Link href="/auctions" onClick={close}>Leilões</Link><Link href="/how-it-works" onClick={close}>Como funciona</Link><Link href="/winners" onClick={close}>Ganhadores</Link>
    <div className="mobile-nav-divider"/>
    {user?.role === 'admin' && <><Link href="/admin" onClick={close}>Administração</Link><Link href="/admin/auctions" onClick={close}>Gerenciar leilões</Link><Link href="/admin/wallet/incidents" onClick={close}>Incidentes</Link><div className="mobile-nav-divider"/></>}
    <Link href="/wallet" onClick={close}><Wallet size={18}/> Minha carteira</Link>
    {user ? <><Link href="/account" onClick={close}><CircleUserRound size={18}/>{user.name}</Link><button type="button" onClick={signOut}><LogOut size={18}/> Sair</button></> : <Link href="/login" onClick={close}><CircleUserRound size={18}/> Entrar</Link>}
  </nav></div>}
  </header>;
}
