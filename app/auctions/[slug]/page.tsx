import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, Heart, Info, LockKeyhole, MousePointerClick, ShieldCheck, Tag, UsersRound, Wallet } from 'lucide-react';
import { demoAuctions } from '@/data/demo-auctions';
import { money, timer } from '@/utils/format';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return demoAuctions.map((auction) => ({ slug: auction.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const auction = demoAuctions.find((item) => item.slug === slug);
  return { title: auction ? `${auction.title} | Leilão demonstrativo` : 'Leilão não encontrado' };
}

export default async function AuctionDetail({ params }: Props) {
  const { slug } = await params;
  const auction = demoAuctions.find((item) => item.slug === slug);
  if (!auction) notFound();
  const isLive = auction.status === 'live';
  const related = demoAuctions.filter((item) => item.slug !== auction.slug).slice(0, 3);
  return <div className="site-container auction-detail-page">
    <nav className="auction-breadcrumb" aria-label="Navegação"><Link href="/">Início</Link><span>/</span><Link href="/auctions">Leilões</Link><span>/</span><span aria-current="page">{auction.title}</span></nav>
    <Link className="auction-back-link" href="/auctions"><ArrowLeft size={16}/> Voltar aos leilões</Link>
    <div className="auction-detail-heading"><div><span className="eyebrow">Conheça o produto</span><h1>{auction.title}</h1><p>Categoria: {auction.category} · Vitrine demonstrativa</p></div><span className={`auction-detail-status ${isLive ? 'is-live' : ''}`}>{isLive ? '● SIMULAÇÃO DE LEILÃO' : 'EM BREVE'}</span></div>
    <div className="auction-detail-grid">
      <div className="auction-product-column">
        <div className="auction-product-showcase" style={{ background: `linear-gradient(145deg, ${auction.accent}aa, #ffffff 85%)` }}>
          <span className="auction-product-category"><Tag size={14}/>{auction.category}</span>
          <span className="auction-product-emoji" role="img" aria-label={auction.title}>{auction.emoji}</span>
          <span className="auction-product-caption">Imagem ilustrativa do produto</span>
        </div>
        <div className="auction-product-facts">
          <div><BadgeCheck size={20}/><span><strong>Produto em destaque</strong><small>Confira as informações antes de participar</small></span></div>
          <div><ShieldCheck size={20}/><span><strong>Regras da plataforma</strong><small>Conheça as condições de funcionamento</small></span></div>
        </div>
      </div>
      <div className="auction-bid-column">
        <div className="auction-bid-panel">
          <div className="auction-bid-panel-top"><span><span className="auction-bid-pulse"/> {isLive ? 'Prévia da disputa' : 'Leilão ainda não iniciado'}</span><Heart size={19} aria-hidden="true"/></div>
          <p className="auction-bid-label">Valor do último lance {isLive ? '(simulado)' : ''}</p>
          <div className="auction-bid-amount">{isLive ? money(auction.bidPriceCents) : '—'}</div>
          <p className="auction-reference">Valor de referência do produto: <strong>{money(auction.retailPriceCents)}</strong></p>
          <div className="auction-bid-metrics">
            <div><Clock3 size={21}/><span><small>Tempo exibido (fictício)</small><strong>{isLive ? timer(auction.secondsLeft) : '--:--'}</strong></span></div>
            <div><UsersRound size={21}/><span><small>Participantes (fictícios)</small><strong>{isLive ? auction.bidders : '—'}</strong></span></div>
          </div>
          <div className="auction-bid-alert" role="status"><Info size={19}/><span>Esta página é uma demonstração. Não há cronômetro em tempo real, participantes reais ou lances disponíveis nesta etapa.</span></div>
          <button className="auction-bid-disabled" type="button" disabled><LockKeyhole size={18}/> Lances indisponíveis</button>
          <Link href="/how-it-works" className="auction-learn-link">Entenda como funcionam os leilões <ArrowRight size={16}/></Link>
        </div>
        <div className="auction-wallet-hint"><Wallet size={21}/><div><strong>Minha carteira</strong><p>Consulte seu saldo e o histórico de movimentações na área do usuário.</p></div><Link href="/wallet" aria-label="Ir para minha carteira"><ArrowRight size={18}/></Link></div>
      </div>
    </div>
    <div className="auction-detail-lower">
      <section className="auction-detail-information"><span className="eyebrow">Antes de participar</span><h2>Informações do leilão</h2><p>O Show de Centavos está em desenvolvimento. Os produtos desta vitrine são ilustrativos e os valores apresentados não representam ofertas comerciais ativas.</p><div className="auction-info-list"><div><MousePointerClick size={20}/><span><strong>Como funcionam os lances?</strong><small>Conheça a dinâmica e as condições de participação na página explicativa.</small></span></div><div><ShieldCheck size={20}/><span><strong>Transparência em primeiro lugar</strong><small>Consulte as regras e informações antes de qualquer participação futura.</small></span></div></div><Link className="home-outline-dark" href="/how-it-works">Ver como funciona <ArrowRight size={16}/></Link></section>
      <aside className="auction-detail-disclaimer"><Info size={24}/><h3>Ambiente demonstrativo</h3><p>Este leilão não aceita lances nem pagamentos. A contagem de tempo e o número de participantes são dados de exemplo, sem atualização automática.</p></aside>
    </div>
    <section className="auction-related"><div className="home-section-top"><div><span className="eyebrow">Continue explorando</span><h2>Outros <span>leilões</span></h2></div><Link className="home-view-all" href="/auctions">Ver todos <ArrowRight size={16}/></Link></div><div className="auction-related-grid">{related.map((item) => <Link key={item.id} href={`/auctions/${item.slug}`} className="auction-related-card"><div style={{ background: `${item.accent}55` }}><span aria-hidden="true">{item.emoji}</span></div><section><small>{item.category}</small><strong>{item.title}</strong><span>{item.status === 'live' ? `Lance ilustrativo: ${money(item.bidPriceCents)}` : 'Em breve'}</span></section><ArrowRight size={18}/></Link>)}</div></section>
  </div>;
}
