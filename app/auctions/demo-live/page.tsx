'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const WAIT_SECONDS = 10;
const ACTIVE_SECONDS = 25;

export default function AuctionVisualHomologationPage() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

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
          <button type="button" onClick={() => { setStartedAt(Date.now()); setPaused(false); }}> {startedAt === null ? 'Iniciar demonstração' : 'Reiniciar demonstração'} </button>
        </div>
        <small>10 segundos agendado → 25 segundos ativo → encerrado. O relógio utiliza o tempo decorrido real, inclusive após trocar de aba.</small>
        <small>Este teste verifica somente a apresentação visual e as transições locais. A sincronização com o servidor e o SSE continuam sendo testados separadamente.</small>
      </section>
    </div>
  );
}
