'use client';
import { useState } from 'react';
import { serializePendingBid, restorePendingBid } from '@/services/bidAttemptJournal';
import type { BidAttemptState } from '@/services/bidAttemptState';
import { transitionBidAttempt } from '@/services/bidAttemptState';

const DEMO_USER = '507f1f77bcf86cd799439011';
const DEMO_AUCTION = '507f1f77bcf86cd799439012';
const DEMO_KEY = '123e4567-e89b-42d3-a456-426614174000';
/** An isolated browser demonstration: never touches sessionStorage or the API. */
export default function DemoRecoveryPage() {
  const [record, setRecord] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<BidAttemptState>({ status: 'idle' });
  const [message, setMessage] = useState('Nenhum registro fictício criado.');
  const create = () => {
    const state = transitionBidAttempt({ status: 'idle' }, { type: 'begin', key: DEMO_KEY });
    const serialized = serializePendingBid(state, DEMO_USER, DEMO_AUCTION, Date.now());
    setRecord(serialized);
    setAttempt(state);
    setMessage(serialized ? 'Registro fictício criado somente na memória desta página.' : 'Falha ao criar registro fictício.');
  };
  const restore = () => {
    const recovered = restorePendingBid(record, DEMO_USER, DEMO_AUCTION);
    setAttempt(recovered ?? { status: 'idle' });
    setMessage(recovered ? 'Recuperação simulada: tentativa permanece incerta, sem novo envio.' : 'Nenhum registro válido para recuperar.');
  };
  const reset = () => { setRecord(null); setAttempt({ status: 'idle' }); setMessage('Demonstração reiniciada.'); };
  return <main style={{ maxWidth: 680, margin: '48px auto', padding: 24, display: 'grid', gap: 16 }}>
    <h1>Laboratório de recuperação de lance</h1>
    <p>Ambiente isolado para verificar a gravação e a restauração de uma tentativa fictícia. Não utiliza sua conta, carteira, API, sessionStorage nem envia requisições financeiras.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <button type="button" onClick={create}>1. Criar tentativa fictícia</button>
      <button type="button" onClick={restore} disabled={!record}>2. Simular atualização da página</button>
      <button type="button" onClick={reset}>Limpar demonstração</button>
    </div>
    <section aria-live="polite" style={{ border: '1px solid #94a3b8', borderRadius: 12, padding: 18, display: 'grid', gap: 10 }}>
      <strong>Estado: {attempt.status}</strong>
      <span>{message}</span>
      {attempt.status !== 'idle' && <span style={{ overflowWrap: 'anywhere' }}>Chave fictícia: <code>{attempt.key}</code></span>}
      <span>Registro em memória: {record ? 'presente' : 'ausente'}</span>
      <small>A simulação representa a lógica de recuperação, não uma atualização real do navegador. Uma atualização real desta página reinicia a demonstração.</small>
    </section>
  </main>;
}
