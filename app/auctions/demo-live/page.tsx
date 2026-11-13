'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';


type AuctionLiveState = {
  auction: {
    status: string;
    bidCount: number;
    currentPriceCents: number;
    startsAt: string | null;
    endsAt: string | null;
  };
  serverTime: string;
};

function formatRemaining(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map(value => String(value).padStart(2, '0')).join(':');
}

function LiveMonitor() {
  const [input, setInput] = useState('');
  const [selection, setSelection] = useState<{ id: string; revision: number } | null>(null);
  const [status, setStatus] = useState('Desconectado');
  const [state, setState] = useState<AuctionLiveState | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [lastSource, setLastSource] = useState('Nenhuma atualização');
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState<number | null>(null);
  const clockOffset = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = selection?.id;
    if (!id || !/^[0-9a-f]{24}$/i.test(id)) return;
    let active = true;
    let requestNumber = 0;
    let appliedNumber = 0;

    const refresh = async (source: 'SSE' | 'Consulta periódica' | 'Conexão') => {
      const current = ++requestNumber;
      const sentAt = Date.now();
      try {
        const { data } = await api.get<AuctionLiveState>(`/auctions/${id}/live`);
        const receivedAt = Date.now();
        if (!active || current < appliedNumber) return;
        appliedNumber = current;
        const serverTime = Date.parse(data.serverTime);
        if (Number.isFinite(serverTime)) {
          clockOffset.current = serverTime - (sentAt + receivedAt) / 2;
        }
        setState(data);
        setLastSource(source);
        setError('');
      } catch {
        if (active && current >= appliedNumber) setError('Consulta ao servidor indisponível.');
      }
    };

    void refresh('Conexão');
    const base = api.defaults.baseURL ?? 'http://localhost:3001/api';
    const source = new EventSource(`${base.replace(/\/$/, '')}/auctions/${id}/events`);
    source.onopen = () => {
      if (!active) return;
      setStatus('SSE conectado');
      void refresh('Conexão');
    };
    source.onerror = () => {
      if (active) setStatus('SSE reconectando');
    };
    source.addEventListener('auction-update', () => {
      if (!active) return;
      setEventsCount(count => count + 1);
      setLastEventAt(new Date().toISOString());
      void refresh('SSE');
    });

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh('Consulta periódica');
    }, 5000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh('Conexão');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      source.close();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [selection]);

  const target = state?.auction.status === 'scheduled'
    ? state.auction.startsAt
    : state?.auction.status === 'active'
      ? state.auction.endsAt
      : null;
  const targetTime = target ? Date.parse(target) : NaN;
  const authoritativeNow = now === null || clockOffset.current === null ? null : now + clockOffset.current;
  const remaining = authoritativeNow !== null && Number.isFinite(targetTime)
    ? formatRemaining(targetTime - authoritativeNow)
    : null;

  return <section style={{ marginTop: 24, padding: 24, border: '1px solid #cbd5e1', borderRadius: 16, display: 'grid', gap: 12 }}>
    <h2>Monitor SSE e API (somente leitura)</h2>
    <p>Informe o ID de um leilão existente. Nenhum registro será criado ou alterado.</p>
    <form onSubmit={e => {
      e.preventDefault();
      const id = input.trim();
      if (!/^[0-9a-f]{24}$/i.test(id)) return;
      setState(null);
      setEventsCount(0);
      setLastSource('Nenhuma atualização');
      setLastEventAt(null);
      setError('');
      setStatus('Conectando');
      clockOffset.current = null;
      setSelection(previous => ({ id, revision: (previous?.revision ?? 0) + 1 }));
    }} style={{ display: 'flex', gap: 8 }}>
      <input aria-label="ID do leilão" placeholder="ID MongoDB (24 caracteres)" value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1, minWidth: 0, padding: 10 }} />
      <button type="submit" disabled={!/^[0-9a-f]{24}$/i.test(input.trim())}>Monitorar</button>
    </form>
    {selection && <>
      <p role="status">{status} · Eventos SSE recebidos: {eventsCount}</p>
      <p>Última atualização: {lastSource}</p>
      {lastEventAt && <p>Último evento SSE: {new Date(lastEventAt).toLocaleString('pt-BR')}</p>}
      {error && <p role="alert">{error}</p>}
      {state && <>
        <p>Estado no servidor: <strong>{state.auction.status}</strong></p>
        <p>Preço: {(state.auction.currentPriceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · Lances: {state.auction.bidCount}</p>
        {remaining !== null && <p role="timer" aria-label="Tempo restante do leilão no servidor" style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>Tempo restante: {remaining}</p>}
        {state.auction.status === 'active' && !state.auction.endsAt && <p>Leilão ativo, aguardando o primeiro lance para iniciar o cronômetro de encerramento.</p>}
        <p>Horário do servidor: {new Date(state.serverTime).toLocaleString('pt-BR')}</p>
      </>}
    </>}
    <small>O cronômetro real usa startsAt/endsAt e serverTime da API. A consulta periódica funciona como recuperação quando o SSE é interrompido.</small>
  </section>;
}

const WAIT_SECONDS = 10;
const ACTIVE_SECONDS = 25;

export default function AuctionVisualHomologationPage() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 250);
    const onVisibility = () => tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const elapsed = startedAt === null || now === null ? 0 : Math.max(0, (now - startedAt) / 1000);
  const status = startedAt === null ? 'ready' : elapsed < WAIT_SECONDS ? 'scheduled' : elapsed < WAIT_SECONDS + ACTIVE_SECONDS ? 'active' : 'finished';
  const remaining = status === 'scheduled' ? Math.ceil(WAIT_SECONDS - elapsed) : status === 'active' ? Math.ceil(WAIT_SECONDS + ACTIVE_SECONDS - elapsed) : 0;
  const label = status === 'ready' ? 'Pronto para iniciar' : status === 'scheduled' ? 'Agendado' : status === 'active' ? 'Em andamento' : 'Encerrado';
  const clock = `00:${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  return (
    <div className="site-container page-content" style={{ maxWidth: 800 }}>
      <div className="page-heading">
        <Link href="/auctions">← Voltar aos leilões</Link>
        <h1>Homologação visual do cronômetro</h1>
        <p>Simulação local e educativa. Não cria leilões no MongoDB, não utiliza carteira, não envia lances e não define vencedores reais.</p>
      </div>
      <section style={{ padding: 24, border: '1px solid #cbd5e1', borderRadius: 16, display: 'grid', gap: 16 }}>
        <strong role="status" aria-live="polite">Estado da simulação: {label}</strong>
        <div role="timer" aria-label="Tempo restante" style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{clock}</div>
        <p style={{ margin: 0 }}>{status === 'ready' ? 'Inicie a demonstração para observar as transições.' : status === 'scheduled' ? 'Aguardando início do leilão simulado.' : status === 'active' ? 'Leilão simulado em andamento. Nenhum lance financeiro está disponível.' : 'Demonstração encerrada. Nenhum vencedor ou pagamento foi registrado.'}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setStartedAt(Date.now()); }}> {startedAt === null ? 'Iniciar demonstração' : 'Reiniciar demonstração'} </button>
        </div>
        <small>10 segundos agendado → 25 segundos ativo → encerrado. O relógio utiliza o tempo decorrido real, inclusive após trocar de aba.</small>
        <small>Este teste verifica somente a apresentação visual e as transições locais. A sincronização com o servidor e o SSE continuam sendo testados separadamente.</small>
      </section>
      <LiveMonitor />
    </div>
  );
}
