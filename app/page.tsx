import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BadgeCheck, BellRing, CheckCircle2, Clock3, Gift, LockKeyhole, MousePointerClick, ShieldCheck, Sparkles, Trophy, UsersRound, Wallet, Zap } from 'lucide-react';
import { RegisteredAuctions } from '@/components/auctions/RegisteredAuctions';

const benefits = [
  { icon: ShieldCheck, title: 'Regras claras', description: 'Consulte as condições e os detalhes de cada leilão antes de participar.' },
  { icon: Clock3, title: 'Cada segundo importa', description: 'Acompanhe o tempo restante e a evolução dos lances na disputa.' },
  { icon: Wallet, title: 'Sua carteira em um só lugar', description: 'Consulte saldo, depósitos e movimentações na sua área.' },
];

export default function Home() {
  return <>
    <section className="home-hero">
      <div className="site-container home-hero-grid">
        <div className="home-hero-content">
          <span className="home-kicker"><Sparkles size={15}/> A emoção está em cada lance</span>
          <h1>Seu próximo grande prêmio pode começar com <em>centavos.</em></h1>
          <p>Descubra uma nova maneira de acompanhar leilões online. Produtos desejados, disputas emocionantes e regras que você pode consultar antes de entrar.</p>
          <div className="home-hero-actions">
            <Link href="/auctions" className="btn-primary">Explorar leilões <ArrowRight size={18}/></Link>
            <Link href="/how-it-works" className="home-outline-btn">Entenda como funciona <ArrowUpRight size={16}/></Link>
          </div>
          <div className="home-hero-foot"><span><CheckCircle2 size={16}/> Navegue gratuitamente</span><span><LockKeyhole size={16}/> Ambiente demonstrativo</span></div>
        </div>
        <div className="home-hero-art" aria-label="Ilustração de controle de videogame em destaque">
          <div className="home-art-ring ring-one"/><div className="home-art-ring ring-two"/>
          <span className="home-art-glow"/>
          <span className="home-art-controller" aria-hidden="true">🎮</span>
          <div className="home-art-tag tag-top"><Zap size={17}/> A disputa é emocionante</div>
          <div className="home-art-tag tag-bottom"><Clock3 size={17}/> Acompanhe cada lance</div>
          <div className="home-art-dot dot-one"/><div className="home-art-dot dot-two"/>
        </div>
      </div>
    </section>

    <section className="home-trust-strip" aria-label="Diferenciais da plataforma"><div className="site-container home-trust-grid">
      <div><Zap/><span><strong>Disputas dinâmicas</strong><small>Acompanhe cada lance</small></span></div>
      <div><Clock3/><span><strong>Contagem regressiva</strong><small>O tempo faz parte do jogo</small></span></div>
      <div><ShieldCheck/><span><strong>Regras acessíveis</strong><small>Informação antes de participar</small></span></div>
      <div><UsersRound/><span><strong>Feito para você</strong><small>Uma experiência intuitiva</small></span></div>
    </div></section>

    <section className="section home-featured" id="leiloes"><div className="site-container">
      <div className="home-section-top"><div><span className="eyebrow">Explore a vitrine</span><h2>Leilões em <span>destaque</span></h2><p>Encontre seu próximo favorito e conheça a dinâmica das disputas.</p></div><Link className="home-view-all" href="/auctions">Ver todos os leilões <ArrowUpRight size={17}/></Link></div>
      <div className="home-demo-note"><BellRing size={17}/><span>Leilões cadastrados na plataforma. A participação por lances ainda não está habilitada nesta vitrine.</span></div>
      <RegisteredAuctions/>
      <div className="home-after-grid"><Link href="/auctions" className="home-outline-dark">Explorar todos os leilões <ArrowRight size={17}/></Link></div>
    </div></section>

    <section className="site-container"><div className="home-promo">
      <div className="home-promo-icon"><Gift size={44}/></div>
      <div><span className="home-promo-label">O próximo lance pode surpreender</span><h2>Grandes produtos. Uma experiência diferente.</h2><p>Conheça a vitrine, acompanhe as disputas demonstrativas e descubra o que estamos preparando.</p></div>
      <Link href="/auctions" className="home-promo-link">Conhecer leilões <ArrowRight size={18}/></Link>
    </div></section>

    <section className="section home-how"><div className="site-container">
      <div className="home-centered-heading"><span className="eyebrow">Simples de entender</span><h2>Como funciona o <span>Show de Centavos?</span></h2><p>Três passos para conhecer a experiência antes de participar.</p></div>
      <div className="home-steps">
        <div className="home-step"><span className="home-step-number">01</span><div className="home-step-icon"><BadgeCheck/></div><h3>Crie sua conta</h3><p>Cadastre-se para acessar sua área e conhecer os recursos da plataforma.</p></div>
        <div className="home-step"><span className="home-step-number">02</span><div className="home-step-icon"><MousePointerClick/></div><h3>Escolha seu leilão</h3><p>Explore os produtos e consulte informações, condições e regras da disputa.</p></div>
        <div className="home-step"><span className="home-step-number">03</span><div className="home-step-icon"><Trophy/></div><h3>Acompanhe a disputa</h3><p>Observe os lances e a contagem regressiva. A participação real ainda não está disponível.</p></div>
      </div>
      <div className="home-centered-action"><Link href="/how-it-works" className="btn-secondary">Saiba mais sobre as regras <ArrowRight size={17}/></Link></div>
    </div></section>

    <section className="section home-benefits"><div className="site-container home-benefits-grid">
      <div className="home-benefits-intro"><span className="eyebrow">Pensado em cada detalhe</span><h2>Uma experiência para acompanhar com <span>confiança.</span></h2><p>Design simples, informações acessíveis e recursos organizados para você encontrar o que precisa.</p><Link href="/register" className="btn-primary">Criar minha conta <ArrowRight size={17}/></Link></div>
      <div className="home-benefit-list">{benefits.map(({icon:Icon,title,description})=><div className="home-benefit" key={title}><span className="home-benefit-icon"><Icon size={23}/></span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
    </div></section>

    <section className="site-container home-final-wrap"><div className="home-final-cta"><span className="eyebrow">Sua próxima descoberta começa aqui</span><h2>Pronto para conhecer o Show de Centavos?</h2><p>Explore nossa vitrine demonstrativa e acompanhe a evolução da plataforma.</p><div><Link href="/auctions" className="btn-primary">Ver leilões <ArrowRight size={17}/></Link><Link href="/register" className="home-outline-btn">Criar conta <ArrowUpRight size={17}/></Link></div></div></section>
  </>;
}
