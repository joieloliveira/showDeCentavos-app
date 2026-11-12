'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock3, Gavel, ImageIcon, LockKeyhole, ShieldCheck, Tag, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { money } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWalletBalance } from '@/services/wallet';
import { reconcileBid, type BidRecord } from '@/services/bids';
import { evaluateBidPreflight } from '@/services/bidPreflight';
import { transitionBidAttempt } from '@/services/bidAttemptState';
import { resolvePendingBid } from '@/services/bidAttemptReconciliation';
import type { BidAttemptState } from '@/services/bidAttemptState';
import { BID_ATTEMPT_JOURNAL_KEY, restorePendingBid, clearConfirmedBidJournal } from '@/services/bidAttemptJournal';
import { BidAttemptStatus } from '@/components/auctions/BidAttemptStatus';

type ProductImage = { key?: string; url?: string };
type Auction = {
  _id: string; status: string; startPriceCents: number; currentPriceCents: number;
  bidCostCents: number; bidCount: number; durationSeconds?: number; bidIncrementCents?: number; winnerNickname?: string | null; startsAt?: string | null; endsAt?: string | null;
  product?: { name: string; description?: string; price?: number; images?: ProductImage[]; coverImage?: ProductImage } | null;
};
const statusLabels: Record<string, string> = {
  scheduled: 'Agendado', active: 'Em andamento', finished: 'Encerrado', cancelled: 'Cancelado',
};
export function RegisteredAuctionDetail({ id }: { id: string }) {
  const { user, isLoading: authLoading, getToken } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState('');
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [showBidInfo, setShowBidInfo] = useState(false);
  const [lookupKey, setLookupKey] = useState('');
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ status: 'found' | 'not_found' | 'unavailable'; bid?: BidRecord } | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupSummary, setLookupSummary] = useState<{ status: 'checking' | 'found' | 'not_found' | 'unavailable' | 'mismatch'; key: string } | null>(null);
  // No financial attempt is initiated by this page while bidding is disabled.
  const [attemptState, setAttemptState] = useState<BidAttemptState>({ status: 'idle' });
  const [recoveryPending, setRecoveryPending] = useState(false);
  const recoveryGeneration = useRef(0);
  const lookupGeneration = useRef(0);
  const recoveryContext = useRef({ userId: user?.id ?? '', auctionId: id });
  recoveryContext.current = { userId: user?.id ?? '', auctionId: id };
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulatedBids, setSimulatedBids] = useState(0);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const bidInfoTriggerRef = useRef<HTMLButtonElement>(null);
  const bidInfoCloseRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [liveDataStatus, setLiveDataStatus] = useState<'ok' | 'unavailable'>('ok');
  const [now, setNow] = useState(() => Date.now());
  const serverOffsetMs = useRef(0);
  const lastClockSyncMs = useRef(0);
  const [clockSyncedAt, setClockSyncedAt] = useState<number | null>(null);
  const lastLiveCheckMs = useRef(0);
  const liveStatusRef = useRef<string | null>(null);
  const latestRequestRef = useRef(0);
  const latestAppliedRef = useRef(0);
  const latestLiveRef = useRef<Pick<Auction, 'status' | 'currentPriceCents' | 'bidCount' | 'startsAt' | 'endsAt' | 'bidCostCents' | 'winnerNickname'> | null>(null);
  // Read-only recovery: never creates a new financial request. Authentication is verified first.
  useEffect(() => {
    ++recoveryGeneration.current;
    ++lookupGeneration.current;
    setLookupPending(false);
    setLookupResult(null);
    setLookupSummary(null);
    setLookupError('');
    setRecoveryPending(false);
    setAttemptState({ status: 'idle' });
    if (authLoading || !user?.id || !getToken()) return;
    try {
      const restored = restorePendingBid(sessionStorage.getItem(BID_ATTEMPT_JOURNAL_KEY), user.id, id);
      if (restored) setAttemptState(restored);
    } catch { /* Storage can be unavailable in restricted browser contexts. */ }
    return () => { ++recoveryGeneration.current; ++lookupGeneration.current; };
  }, [authLoading, user?.id, id, getToken]);
  useEffect(() => {
    if (!user) { setBalance(null); setBalanceError(''); return; }
    const token = getToken();
    if (!token) return;
    let active = true;
    fetchWalletBalance(token).then(value => { if (active) { setBalance(value); setBalanceError(''); } })
      .catch(() => { if (active) { setBalance(null); setBalanceError('Saldo indisponível no momento.'); } });
    return () => { active = false; };
  }, [user, getToken]);
  const lookupBid = async () => {
    if (lookupPending) return;
    setLookupResult(null);
    setLookupError('');
    const token = getToken();
    if (!user?.id || !token || authLoading) {
      setLookupError('Entre na sua conta para consultar suas tentativas.');
      return;
    }
    const key = lookupKey.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      setLookupError('Informe uma chave UUID v4 válida.');
      return;
    }
    const userId = user.id;
    const auctionId = id;
    const generation = ++lookupGeneration.current;
    const isCurrent = () => generation === lookupGeneration.current &&
      recoveryContext.current.userId === userId && recoveryContext.current.auctionId === auctionId && getToken() === token;
    setLookupSummary({ status: 'checking', key });
    setLookupPending(true);
    try {
      const result = await reconcileBid(token, key);
      if (!isCurrent()) return;
      if (result.status === 'found' && String(result.bid.auction).toLowerCase() !== auctionId.toLowerCase()) {
        setLookupError('Esta chave pertence a outro leilão da sua conta.');
        setLookupSummary({ status: 'mismatch', key });
      } else {
        setLookupResult(result);
        setLookupSummary({ status: result.status, key });
      }
    } catch {
      if (!isCurrent()) return;
      setLookupResult({ status: 'unavailable' });
      setLookupSummary({ status: 'unavailable', key });
    } finally {
      if (isCurrent()) setLookupPending(false);
    }
  };
  const reconcileRecoveredAttempt = async () => {
    if (recoveryPending || attemptState.status !== 'uncertain' || !user?.id || authLoading) return;
    const token = getToken();
    if (!token) return;
    const key = attemptState.key;
    const userId = user.id;
    const auctionId = id;
    const generation = ++recoveryGeneration.current;
    const reconciling = transitionBidAttempt(attemptState, { type: 'reconcile', key });
    if (reconciling.status !== 'reconciling') return;
    setAttemptState(reconciling);
    setRecoveryPending(true);
    try {
      const result = await reconcileBid(token, key);
      if (generation !== recoveryGeneration.current || recoveryContext.current.userId !== userId || recoveryContext.current.auctionId !== auctionId || getToken() !== token) return;
      const resolved = resolvePendingBid(reconciling, key, userId, auctionId, result);
      setAttemptState(resolved);
      if (resolved.status === 'confirmed') {
        // Remove only the matching confirmed journal. Never clear uncertain or foreign records.
        try { clearConfirmedBidJournal(sessionStorage, resolved, userId, auctionId); }
        catch { /* Storage errors must not affect the verified result. */ }
      }
    } catch {
      if (generation === recoveryGeneration.current && recoveryContext.current.userId === userId && recoveryContext.current.auctionId === auctionId && getToken() === token) {
        setAttemptState(resolvePendingBid(reconciling, key, userId, auctionId, { status: 'unavailable' }));
      }
    } finally {
      if (generation === recoveryGeneration.current) setRecoveryPending(false);
    }
  };
  const refreshBalance = async () => {
    const token = getToken();
    if (!user || !token || balanceRefreshing) return;
    setBalanceRefreshing(true);
    setBalanceError('');
    setBalance(null);
    try {
      setBalance(await fetchWalletBalance(token));
    } catch {
      setBalanceError('Não foi possível confirmar o saldo. Tente novamente.');
    } finally {
      setBalanceRefreshing(false);
    }
  };
  useEffect(() => {
    if (!showBidInfo) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : bidInfoTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    bidInfoCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowBidInfo(false);
      }
      if (event.key === 'Tab') {
        const dialog = bidInfoCloseRef.current?.closest('[role="dialog"]');
        const controls = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [showBidInfo]);
  useEffect(() => { const tick = setInterval(() => setNow(Date.now() + serverOffsetMs.current), 1000); return () => clearInterval(tick); }, []);
  useEffect(() => {
    // A route can reuse this component for another auction. Never merge the
    // previous auction's SSE snapshot into the new auction's product details.
    latestLiveRef.current = null;
    latestRequestRef.current = 0;
    latestAppliedRef.current = 0;
    liveStatusRef.current = null;
    lastLiveCheckMs.current = 0;
    lastClockSyncMs.current = 0;
    serverOffsetMs.current = 0;
    setClockSyncedAt(null);
    setSelectedImage(null);
    setSimulatedBids(0);
    setAuction(null);
    setError('');
    setConnectionStatus('connecting');
    setLiveDataStatus('ok');
    let active = true;
    const refresh = async () => {
      try {
        const { data } = await api.get<{ auction: Auction }>(`/auctions/${encodeURIComponent(id)}`);
        if (active) {
          // Product details may arrive after a newer authoritative live snapshot.
          // Merge that snapshot even when the detail response is the first to populate state.
          setAuction({ ...data.auction, ...(latestLiveRef.current ?? {}) });
          if (!latestLiveRef.current) liveStatusRef.current = data.auction.status;
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
        setLiveDataStatus('ok');
        latestAppliedRef.current = requestId;
        latestLiveRef.current = data.auction;
        const serverTime = Date.parse(data.serverTime);
        if (Number.isFinite(serverTime)) {
          // Midpoint compensates for request round-trip latency.
          serverOffsetMs.current = serverTime - (sentAt + receivedAt) / 2;
          lastClockSyncMs.current = receivedAt;
          setClockSyncedAt(receivedAt);
          setNow(Date.now() + serverOffsetMs.current);
        }
        if (active) {
          setAuction(previous => previous ? { ...previous, ...data.auction } : previous);
          liveStatusRef.current = data.auction.status;
        }
      } catch { if (active) setLiveDataStatus('unavailable'); /* Keep last verified state; next poll retries. */ }
    };
    const polling = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const interval = liveStatusRef.current === 'active' ? 2000 : 10000;
      if (Date.now() - lastLiveCheckMs.current >= interval) {
        lastLiveCheckMs.current = Date.now();
        void refreshLive();
      }
    }, 1000);
    const onOffline = () => { if (active) { setConnectionStatus('reconnecting'); setLiveDataStatus('unavailable'); } };
    const onOnline = () => { if (active) { setConnectionStatus('connecting'); void refreshLive(); } };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') { lastLiveCheckMs.current = Date.now(); void refreshLive(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    // SSE pushes scheduler and bid changes immediately. Polling remains a fallback.
    const base = api.defaults.baseURL ?? 'http://localhost:3001/api';
    const events = new EventSource(`${base.replace(/\/$/, '')}/auctions/${encodeURIComponent(id)}/events`);
    events.addEventListener('open', () => { if (active) { setConnectionStatus('connected'); void refreshLive(); } });
    events.addEventListener('error', () => { if (active) setConnectionStatus('reconnecting'); });
    events.addEventListener('auction-update', (event: MessageEvent) => {
      try {
        JSON.parse(event.data);
        if (!active) return;
        void refreshLive(); // Fetch authoritative state, avoiding stale/out-of-order pushes.
      } catch { /* Ignore malformed messages; periodic polling continues. */ }
    });
    return () => { active = false; clearInterval(polling); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline); events.close(); };
  }, [id]);
  if (error) return <p role="alert">{error}</p>;
  if (!auction) return <p role="status">Carregando leilão...</p>;

  const product = auction.product;
  const images = [...(product?.images ?? [])].filter((image): image is ProductImage & { url: string } => Boolean(image.url));
  const cover = product?.coverImage?.url;
  const gallery = cover && !images.some(image => image.url === cover) ? [{ url: cover, key: 'cover' }, ...images] : images;
  const mainImage = selectedImage && gallery.some(image => image.url === selectedImage) ? selectedImage : (cover || gallery[0]?.url);
  const label = statusLabels[auction.status] ?? auction.status;
  const bidIncrementCents = auction.bidIncrementCents ?? 1;
  const simulatedPriceCents = auction.currentPriceCents + simulatedBids * bidIncrementCents;
  const canSimulate = auction.status === 'active';
  const hasSufficientBalance = balance !== null && balance >= auction.bidCostCents;
  const bidPreflight = evaluateBidPreflight({
    authenticated: Boolean(user),
    authenticationPending: authLoading,
    auctionStatus: auction.status,
    serverAvailable: liveDataStatus === 'ok',
    balanceCents: balance,
    bidCostCents: auction.bidCostCents,
  });
  const secondsUntilStart = auction.status === 'scheduled' && auction.startsAt ? Math.max(0, Math.ceil((new Date(auction.startsAt).getTime() - now) / 1000)) : null;
  const secondsUntilEnd = auction.status === 'active' && auction.endsAt ? Math.max(0, Math.ceil((new Date(auction.endsAt).getTime() - now) / 1000)) : null;
  const clockStale = auction.status === 'active' && auction.endsAt && (clockSyncedAt === null || Date.now() - clockSyncedAt > 15000);
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
        <p role="status" aria-live="polite" style={{ fontSize: 12, marginTop: 8 }}>
          {liveDataStatus === "unavailable" ? "Sem comunicação com o servidor; tentando reconectar" : connectionStatus === "connected" ? "Atualizações em tempo real conectadas" : connectionStatus === "reconnecting" ? "Canal em reconexão; consultas ao servidor disponíveis" : "Conectando atualizações em tempo real..."}
        </p>
        {auction.status === 'finished' && <div role="status" aria-live="polite" className="registered-finished-result"><strong className="registered-finished-title">Leilão encerrado!</strong><span>Resultado confirmado pelo servidor. Preço de arremate: <strong>{money(auction.currentPriceCents)}</strong>.</span><span className="registered-finished-winner">{auction.winnerNickname ? `Vencedor: ${auction.winnerNickname}` : auction.bidCount > 0 ? 'Vencedor confirmado · identificação pública indisponível' : 'Nenhum lance vencedor registrado'}</span></div>}
        <h2>{product?.name ?? 'Produto indisponível'}</h2>
        
        {secondsUntilStart !== null && <div className="registered-clock" role="timer"><span>{secondsUntilStart > 0 ? "Início previsto em" : "Horário previsto atingido · aguardando atualização do servidor"}</span><strong>{clock(secondsUntilStart)}</strong></div>}
        {auction.status === 'active' && auction.bidCount === 0 && !auction.endsAt && <div className="registered-clock" role="status"><strong style={{ fontSize: 18 }}>Aguardando o primeiro lance</strong><span style={{ display: "block", marginTop: 8 }}>O cronômetro de {auction.durationSeconds ?? 15} segundos começará após o primeiro lance válido.</span></div>}
        {secondsUntilEnd !== null && <div className="registered-clock" role="timer"><span>{secondsUntilEnd > 0 ? "Tempo restante registrado" : "Tempo esgotado · aguardando encerramento no servidor"}</span><strong>{clock(secondsUntilEnd)}</strong>{clockStale && <small role="status" style={{ display: "block", marginTop: 8 }}>Sincronização do cronômetro pendente; horário sujeito a atualização.</small>}</div>}
        <div className="registered-price-block">
          <span>{auction.status === 'finished' ? 'Preço final do leilão' : 'Preço atual do leilão'}</span>
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
        <div className="registered-wallet-preview"><Wallet size={19}/><div><strong>Minha carteira</strong><span>{authLoading ? "Verificando sessão..." : !user ? "Entre na sua conta para consultar seu saldo." : balanceError || (balance === null ? "Consultando saldo..." : `Saldo disponível: ${money(balance)}`)}</span>{!authLoading && <Link href={user ? "/wallet" : `/login?next=${encodeURIComponent(`/auctions/registered/${id}`)}`} style={{ display: "inline-block", marginTop: 8, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{user ? "Ver minha carteira" : "Entrar na minha conta"}</Link>}</div></div>
        <button ref={bidInfoTriggerRef} type="button" className="registered-bid-info-button" onClick={() => setShowBidInfo(true)}><Gavel size={18}/> Como funcionará o lance</button>
        <div role="status" aria-label="Condições para participar" style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, display: 'grid', gap: 6, fontSize: 13 }}>
          <strong>Condições para participar (prévia)</strong>
          <span>{authLoading ? '• Conta: verificando sessão' : user ? '✓ Conta: conectada' : '• Conta: entre para participar'}</span>
          <span>{auction.status === 'active' ? '✓ Leilão: em andamento' : `• Leilão: ${label.toLowerCase()}`}</span>
          <span>{!user || authLoading ? '• Saldo: disponível após login' : balanceError ? '• Saldo: não foi possível verificar' : balance === null ? '• Saldo: consultando carteira' : hasSufficientBalance ? `✓ Saldo: suficiente para ${money(auction.bidCostCents)}` : `• Saldo: insuficiente para ${money(auction.bidCostCents)}`}</span>
          <span>{liveDataStatus === 'ok' ? '✓ Servidor: consulta disponível' : '• Servidor: aguardando reconexão'}</span>
          <small style={{ color: '#64748b' }}>Verificação apenas informativa. Mesmo com os requisitos atendidos, lances financeiros permanecem bloqueados.</small>
        </div>
        <button type="button" disabled className="auction-bid-disabled"><LockKeyhole size={18}/> Lances reais indisponíveis</button>
        <details className="registered-support-tools"><summary>Ferramentas de demonstração e suporte</summary><p style={{ fontSize: 12, color: '#64748b', overflowWrap: 'anywhere' }}>Identificador do leilão: <code>{auction._id}</code></p><section aria-label="Simulador de lances" style={{ padding: 16, border: '1px dashed #94a3b8', borderRadius: 12, display: 'grid', gap: 10 }}>
          <strong>Simulador local de lances</strong>
          <p style={{ margin: 0, color: '#64748b' }}>Prévia educativa, independente da carteira e do servidor. Não registra lances, não altera o leilão e não cobra valores.</p>
          <button type="button" onClick={() => { setShowSimulation(previous => !previous); setSimulatedBids(0); }}>{showSimulation ? 'Fechar simulação' : 'Abrir simulação'}</button>
          {showSimulation && <div style={{ display: 'grid', gap: 8 }} role="region" aria-label="Resultado da simulação">
            <span>Preço hipotético: <strong>{money(simulatedPriceCents)}</strong></span>
            <span>Lances simulados: <strong>{simulatedBids}</strong></span>
            <span>Custo hipotético dos lances: <strong>{money(simulatedBids * auction.bidCostCents)}</strong></span>
            <button type="button" disabled={!canSimulate} onClick={() => setSimulatedBids(previous => previous + 1)}>{canSimulate ? `Simular lance de ${money(bidIncrementCents)}` : 'Simulação disponível apenas durante leilão ativo'}</button>
            <button type="button" disabled={simulatedBids === 0} onClick={() => setSimulatedBids(0)}>Reiniciar simulação</button>
          </div>}
        </section>
        <BidAttemptStatus attempt={attemptState} lookup={lookupSummary} />
        {attemptState.status === 'uncertain' && <button type="button" disabled={recoveryPending || authLoading || !user} onClick={() => { void reconcileRecoveredAttempt(); }}>Consultar tentativa recuperada (somente GET)</button>}
        {attemptState.status === 'reconciling' && <p role="status">Verificando a chave original no servidor...</p>}
        {attemptState.status === 'confirmed' && <p role="status">Registro recuperado e confirmado. O diário correspondente pode ser removido com segurança.</p>}
        <section className="registered-bid-lookup" aria-label="Consultar tentativa de lance" style={{ padding: 16, border: '1px solid #cbd5e1', borderRadius: 12, display: 'grid', gap: 10 }}>
          <strong>Consultar tentativa de lance</strong>
          <p style={{ margin: 0 }}>Se a conexão cair após uma tentativa de lance, o resultado pode ser desconhecido. Guarde a chave original e consulte o registro antes de considerar qualquer nova ação.</p>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Esta ferramenta apenas consulta o servidor (GET). Não envia lances, não debita a carteira e não gera uma chave nova.</p>
          <label htmlFor="bid-lookup-key">Chave da tentativa (UUID v4)</label>
          <input id="bid-lookup-key" type="text" disabled={lookupPending} autoComplete="off" spellCheck={false} value={lookupKey} onChange={event => { ++lookupGeneration.current; setLookupPending(false); setLookupKey(event.target.value); setLookupResult(null); setLookupError(''); setLookupSummary(null); }} placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" />
          <div className="registered-bid-lookup-actions">
            <button type="button" disabled={!user || authLoading || lookupPending || !lookupKey.trim()} onClick={() => { void lookupBid(); }}>{lookupPending ? 'Consultando...' : 'Consultar registro'}</button>
            <button type="button" disabled={lookupPending || (!lookupKey && !lookupResult && !lookupError)} onClick={() => { ++lookupGeneration.current; setLookupPending(false); setLookupKey(''); setLookupResult(null); setLookupError(''); setLookupSummary(null); }}>Limpar consulta</button>
          </div>
          {!user && <p role="status">É necessário entrar na conta para consultar tentativas.</p>}
          {lookupError && <p role="alert">{lookupError}</p>}
          {lookupResult?.status === 'found' && lookupResult.bid && <p role="status"><strong>Registro confirmado.</strong> Não reenvie esta tentativa. ID: <strong>{lookupResult.bid._id}</strong>. Custo registrado: <strong>{money(lookupResult.bid.bidCostCents)}</strong>. Saldo após o lance: <strong>{money(lookupResult.bid.balanceAfterCents)}</strong>.</p>}
          {lookupResult?.status === 'not_found' && <p role="status">Nenhum lance encontrado para esta chave até o momento. Isso não autoriza reenviar automaticamente a tentativa.</p>}
          {lookupResult?.status === 'unavailable' && <p role="alert">Não foi possível confirmar o registro agora. Guarde a chave original e tente consultar novamente mais tarde.</p>}
        </section>
        </details>
        {showBidInfo && <div className="registered-bid-dialog-backdrop" onClick={() => setShowBidInfo(false)}><section role="dialog" aria-modal="true" aria-labelledby="bid-info-title" aria-describedby="bid-info-description" className="registered-bid-dialog" onClick={event => event.stopPropagation()}><h3 id="bid-info-title">Confirmação de lance — prévia</h3><p id="bid-info-description">Este painel é apenas informativo. Nenhum lance será enviado ao servidor.</p><dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 16px', margin: '16px 0' }}><dt>Custo de um lance</dt><dd style={{ margin: 0, fontWeight: 700 }}>{money(auction.bidCostCents)}</dd><dt>Aumento do preço do leilão</dt><dd style={{ margin: 0, fontWeight: 700 }}>{money(bidIncrementCents)}</dd><dt>Preço hipotético após o lance</dt><dd style={{ margin: 0, fontWeight: 700 }}>{money(auction.currentPriceCents + bidIncrementCents)}</dd><dt>Saldo disponível</dt><dd style={{ margin: 0, fontWeight: 700 }}>{balance === null ? 'Não disponível' : money(balance)}</dd><dt>Saldo hipotético após o lance</dt><dd style={{ margin: 0, fontWeight: 700 }}>{balance === null ? 'Não disponível' : balance < auction.bidCostCents ? 'Saldo insuficiente' : money(balance - auction.bidCostCents)}</dd></dl>{!user && <p>Entre na sua conta para consultar seu saldo antes de participar.</p>}{user && <button type="button" onClick={() => { void refreshBalance(); }} disabled={balanceRefreshing}>{balanceRefreshing ? 'Consultando carteira...' : 'Atualizar saldo da carteira'}</button>}{user && balanceError && <p role="status">{balanceError}</p>}<p role="status">{bidPreflight.message}</p><p><strong>Lances reais indisponíveis.</strong> Nenhum valor será debitado nesta demonstração.</p><button ref={bidInfoCloseRef} type="button" onClick={() => setShowBidInfo(false)}>Entendi, fechar</button></section></div>}
        <p className="registered-safety"><ShieldCheck size={18}/> Visualização informativa. Esta página não permite realizar lances ou pagamentos.</p>
      </div>
    </div>
  </div>;
}
