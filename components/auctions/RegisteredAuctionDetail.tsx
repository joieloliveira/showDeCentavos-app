'use client';
import { useEffect, useRef, useState } from 'react';
import { Clock3, Gavel, ImageIcon, LockKeyhole, ShieldCheck, Tag, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { money } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWalletBalance } from '@/services/wallet';

type ProductImage = { key?: string; url?: string };
type Auction = {
  _id: string; status: string; startPriceCents: number; currentPriceCents: number;
  bidCostCents: number; bidCount: number; winnerNickname?: string | null; startsAt?: string | null; endsAt?: string | null;
  product?: { name: string; description?: string; price?: number; images?: ProductImage[]; coverImage?: ProductImage } | null;
};
const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', active: 'Em andamento', finished: 'Encerrado', cancelled: 'Cancelado',
};
export function RegisteredAuctionDetail({ id }: { id: string }) {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState('');
  const [showBidInfo, setShowBidInfo] = useState(false);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const serverOffsetMs = useRef(0);
  const lastLiveCheckMs = useRef(0);
  const liveStatusRef = useRef<string | null>(null);
  const latestRequestRef = useRef(0);
  const latestAppliedRef = useRef(0);
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    fetchWalletBalance(token).then(value => { if (active) { setBalance(value); setBalanceError(''); } })
      .catch(() => { if (active) setBalanceError('Saldo indisponível no momento.'); });
    return () => { active = false; };
  }, [user, getToken]);
  useEffect(() => { const tick = setInterval(() => setNow(Date.now() + serverOffsetMs.current), 1000); return () => clearInterval(tick); }, []);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const { data } = await api.get<{ auction: Auction }>(`/auctions/${encodeURIComponent(id)}`);
        if (active) {
          // The full detail request may finish after a newer /live response.
          // Keep the latest verified live fields while loading product/gallery data.
          setAuction(previous => previous && latestAppliedRef.current > 0
            ? { ...data.auction, status: previous.status, currentPriceCents: previous.currentPriceCents,
                bidCount: previous.bidCount, startsAt: previous.startsAt, endsAt: previous.endsAt,
                bidCostCents: previous.bidCostCents, winnerNickname: previous.winnerNickname }
            : data.auction);
          if (latestAppliedRef.current === 0) liveStatusRef.current = data.auction.status;
          setError('');
        }
      } catch { if (active) setError('Não foi possível atualizar este leilão.'); }
    };
    void refresh();
    // Product/gallery data is stable; avoid downloading it every few seconds.
    const refreshLive = async () => {
      try {
        const requestId = ++latestRequestRef.current;
        const sentAt = Date.now();
        const { data } = await api.get<{ auction: Pick<Auction, 'status' | 'currentPriceCents' | 'bidCount' | 'startsAt' | 'endsAt' | 'bidCostCents' | 'winnerNickname'>; serverTime: string }>(`/auctions/${encodeURIComponent(id)}/live`);
        const receivedAt = Date.now();
        if (!active || requestId < latestAppliedRef.current) return;
        latestAppliedRef.current = requestId;
        const serverTime = Date.parse(data.serverTime);
        if (Number.isFinite(serverTime)) {
          serverOffsetMs.current = serverTime - (sentAt + receivedAt) / 2;
          setNow(Date.now() + serverOffsetMs.current);
        }
        if (active) {
          setAuction(previous => previous ? { ...previous, ...data.auction } : previous);
          liveStatusRef.current = data.auction.status;
        }
      } catch { /* Keep last verified state; next poll retries. */ }
    };
    const polling = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const interval = liveStatusRef.current === 'active' ? 2000 : 10000;
      if (Date.now() - lastLiveCheckMs.current >= interval) {
        lastLiveCheckMs.current = Date.now();
        void refreshLive();
      }
    }, 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') { lastLiveCheckMs.current = Date.now(); void refreshLive(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    // SSE pushes confirmed bids immediately. Polling remains the fallback and
    // also handles scheduler changes until it publishes its own events.
    const base = api.defaults.baseURL ?? 'http://localhost:3001/api';
    const events = new EventSource(`${base.replace(/\/$/, '')}/auctions/${encodeURIComponent(id)}/events`);
    events.addEventListener('open', () => { if (active) void refreshLive(); });
    events.addEventListener('auction-update', (event: MessageEvent) => {
      try {
        JSON.parse(event.data);
        if (!active) return;
        void refreshLive(); // Fetch authoritative state, avoiding stale/out-of-order pushes.
      } catch { /* Ignore malformed messages; periodic polling continues. */ }
    });
    return () => { active = false; clearInterval(polling); document.removeEventListener('visibilitychange', onVisibility); events.close(); };
  }, [id]);
  if (error) return <p role="alert">{error}</p>;
  if (!auction) return <p role="status">Carregando leilão...</p>;

  const product = auction.product;
  const images = [...(product?.images ?? [])].filter((image): image is ProductImage & { url: string } => Boolean(image.url));
  const cover = product?.coverImage?.url;
  const gallery = cover && !images.some(image => image.url === cover) ? [{ url: cover, key: 'cover' }, ...images] : images;
  const mainImage = selectedImage && gallery.some(image => image.url === selectedImage) ? selectedImage : (cover || gallery[0]?.url);
  const label = statusLabels[auction.status] ?? auction.status;
  const secondsUntilStart = auction.status === 'scheduled' && auction.startsAt ? Math.max(0, Math.ceil((new Date(auction.startsAt).getTime() - now) / 1000)) : null;
  const secondsUntilEnd = auction.status === 'active' && auction.endsAt ? Math.max(0, Math.ceil((new Date(auction.endsAt).getTime() - now) / 1000)) : null;
  const clock = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return <div className="registered-detail">
    <div className="registered-detail-gallery">
      <div className="registered-main-image">
        {mainImage ? <img src={mainImage} alt={product?.name ?? 'Imagem do produto'} /> : <div className="registered-no-image"><ImageIcon size={46}/><span>Imagem indisponível</span></div>}
      </div>
      {gallery.length > 1 && <div className="registered-gallery-controls"><button type="button" aria-label="Imagens anteriores" onClick={() => thumbnailsRef.current?.scrollBy({ left: -300, behavior: "smooth" })}>‹</button><div className="registered-thumbnails" ref={thumbnailsRef} aria-label="Galeria do produto">
        {gallery.map((image, index) => <button key={image.key ?? image.url} type="button" className={mainImage === image.url ? 'is-selected' : ''} onClick={() => setSelectedImage(image.url)} aria-label={`Visualizar imagem ${index + 1}`} aria-pressed={mainImage === image.url}><img src={image.url} alt={`Vista ${index + 1} do produto`} /></button>)}
      </div><button type="button" aria-label="Próximas imagens" onClick={() => thumbnailsRef.current?.scrollBy({ left: 300, behavior: "smooth" })}>›</button></div>}
      <section className="registered-description">
        <h2>Sobre o produto</h2>
        <p>{product?.description || 'Não há descrição cadastrada para este produto.'}</p>
      </section>
    </div>
    <div className="registered-detail-sidebar">
      <div className="registered-detail-panel">
        <span className="registered-status"><Clock3 size={15}/>{label}</span>
        {auction.status === 'finished' && <div role="status" aria-live="polite" style={{ marginTop: 12, padding: '16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}><strong style={{ display: 'block', fontSize: '1.15rem' }}>Leilão encerrado!</strong><span>O resultado foi confirmado pelo servidor. Preço final: {money(auction.currentPriceCents)}.</span><span style={{ display: 'block', marginTop: 6, fontWeight: 600 }}>{auction.winnerNickname ? `Vencedor: ${auction.winnerNickname}` : auction.bidCount > 0 ? 'Vencedor confirmado · identificação pública indisponível' : 'Nenhum lance vencedor registrado'}</span></div>}
        <h2>{product?.name ?? 'Produto indisponível'}</h2>
        {secondsUntilStart !== null && <div className="registered-clock" role="timer"><span>{secondsUntilStart > 0 ? "Início previsto em" : "Horário previsto atingido · aguardando atualização do servidor"}</span><strong>{clock(secondsUntilStart)}</strong></div>}
        {secondsUntilEnd !== null && <div className="registered-clock" role="timer"><span>{secondsUntilEnd > 0 ? "Tempo restante registrado" : "Tempo esgotado · aguardando encerramento no servidor"}</span><strong>{clock(secondsUntilEnd)}</strong></div>}
        <div className="registered-price-block">
          <span>Preço atual do leilão</span>
          <strong>{money(auction.currentPriceCents)}</strong>
          <small>Preço inicial: {money(auction.startPriceCents)}</small>
        </div>
        <div className="registered-metrics">
          <div><Gavel size={19}/><span><small>Lances registrados</small><strong>{auction.bidCount}</strong></span></div>
          <div><Tag size={19}/><span><small>Custo por lance</small><strong>{money(auction.bidCostCents)}</strong></span></div>
        </div>
        {typeof product?.price === 'number' && <p className="registered-reference">Valor de referência: <strong>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>}
        {auction.startsAt && <p className="registered-date">Início registrado: {new Date(auction.startsAt).toLocaleString('pt-BR')}</p>}
        {auction.endsAt && <p className="registered-date">Término registrado: {new Date(auction.endsAt).toLocaleString('pt-BR')}</p>}
        <div className="registered-wallet-preview"><Wallet size={19}/><div><strong>Minha carteira</strong><span>{authLoading ? "Verificando sessão..." : !user ? "Entre na sua conta para consultar seu saldo." : balanceError || (balance === null ? "Consultando saldo..." : `Saldo disponível: ${money(balance)}`)}</span></div></div>
        <button type="button" className="registered-bid-info-button" onClick={() => setShowBidInfo(true)}><Gavel size={18}/> Como funcionará o lance</button>
        <button type="button" disabled className="auction-bid-disabled"><LockKeyhole size={18}/> Lances indisponíveis</button>
        {showBidInfo && <div className="registered-bid-dialog-backdrop" onClick={() => setShowBidInfo(false)}><section role="dialog" aria-modal="true" aria-labelledby="bid-info-title" className="registered-bid-dialog" onClick={event => event.stopPropagation()}><h3 id="bid-info-title">Confirmação de lance — prévia</h3><p>Quando os lances forem liberados, cada lance neste leilão custará <strong>{money(auction.bidCostCents)}</strong> e aumentará o preço em <strong>R$ 0,01</strong>.</p><p>Saldo atual: <strong>{balance === null ? "Não disponível" : money(balance)}</strong></p><p>Nenhum valor será debitado nesta demonstração.</p><button type="button" onClick={() => setShowBidInfo(false)}>Entendi, fechar</button></section></div>}
        <p className="registered-safety"><ShieldCheck size={18}/> Visualização informativa. Esta página não permite realizar lances ou pagamentos.</p>
      </div>
    </div>
  </div>;
}
