'use client';
import { useEffect, useState } from 'react';
import { serializePendingBid, restorePendingBid } from '@/services/bidAttemptJournal';
import type { BidAttemptState } from '@/services/bidAttemptState';
import { transitionBidAttempt } from '@/services/bidAttemptState';

const DEMO_USER = '507f1f77bcf86cd799439011';
const DEMO_AUCTION = '507f1f77bcf86cd799439012';
const DEMO_KEY = '123e4567-e89b-42d3-a456-426614174000';
// Isolated namespace. Never write to the production pending-bid journal.
const DEMO_STORAGE_KEY = 'showdecentavos:demo-recovery:isolated:v1';
const primaryButton = { padding: '11px 15px', borderRadius: 9, border: '1px solid #17213a', background: '#17213a', color: '#fff', fontWeight: 700, cursor: 'pointer' } as const;
const secondaryButton = { ...primaryButton, background: 'transparent', color: '#17213a' } as const;

/** Browser-only demonstration; no API calls, financial operations or real account data. */
export default function DemoRecoveryPage() {
  const [record, setRecord] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<BidAttemptState>({ status: 'idle' });
  const [message, setMessage] = useState('Verificando demonstração local...');
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        const recovered = restorePendingBid(saved, DEMO_USER, DEMO_AUCTION);
        if (recovered) {
          setRecord(saved);
          setAttempt(recovered);
          setMessage('Tentativa fictícia recuperada após recarregar a página. Nenhum lance foi enviado.');
        } else {
          setMessage('Registro fictício inválido. Nenhuma tentativa foi recuperada.');
        }
      } else {
        setMessage('Nenhum registro fictício criado.');
      }
      setStorageAvailable(true);
    } catch {
      setMessage('O armazenamento de sessão está indisponível neste navegador.');
    }
    setReady(true);
  }, []);
  const create = () => {
    if (!storageAvailable) return;
    const state = transitionBidAttempt({ status: 'idle' }, { type: 'begin', key: DEMO_KEY });
    const serialized = serializePendingBid(state, DEMO_USER, DEMO_AUCTION, Date.now());
    if (!serialized) { setMessage('Não foi possível criar o registro fictício.'); return; }
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, serialized);
      if (sessionStorage.getItem(DEMO_STORAGE_KEY) !== serialized) throw new Error('Falha de leitura');
      setRecord(serialized);
      setAttempt(state);
      setMessage('Tentativa fictícia gravada no armazenamento isolado desta aba. Agora atualize a página (F5).');
    } catch { setMessage('Não foi possível gravar o registro fictício.'); }
  };
  const simulate = () => {
    const recovered = restorePendingBid(record, DEMO_USER, DEMO_AUCTION);
    setAttempt(recovered ?? { status: 'idle' });
    setMessage(recovered ? 'Recuperação simulada: tentativa permanece incerta, sem novo envio.' : 'Nenhum registro válido para recuperar.');
  };
  const reset = () => {
    try { sessionStorage.removeItem(DEMO_STORAGE_KEY); }
    catch { setMessage('Não foi possível limpar o registro da sessão.'); return; }
    setRecord(null);
    setAttempt({ status: 'idle' });
    setMessage('Demonstração reiniciada.');
  };
  return <main style={{ maxWidth: 680, margin: '48px auto', padding: 24, display: 'grid', gap: 16 }}>
    <h1 style={{ fontSize: 25, fontWeight: 800 }}>Laboratório de recuperação de lance</h1>
    <p>Ambiente isolado com dados fictícios. Usa apenas uma chave de demonstração no sessionStorage desta aba. Não utiliza sua conta, carteira, API ou diário de tentativas reais e não envia requisições financeiras.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <button type="button" style={{ ...primaryButton, opacity: !ready || !storageAvailable ? 0.5 : 1 }} disabled={!ready || !storageAvailable} onClick={create}>1. Criar tentativa fictícia</button>
      <button type="button" style={{ ...secondaryButton, opacity: !record ? 0.5 : 1 }} onClick={simulate} disabled={!record}>2. Simular recuperação</button>
      <button type="button" style={secondaryButton} onClick={reset} disabled={!ready}>Limpar demonstração</button>
    </div>
    <p style={{ margin: 0, fontWeight: 600 }}>Para testar uma atualização real: crie a tentativa e pressione F5. A chave deve permanecer a mesma e o estado deve passar a <code>uncertain</code>.</p>
    <section aria-live="polite" style={{ border: '1px solid #94a3b8', borderRadius: 12, padding: 18, display: 'grid', gap: 10 }}>
      <strong>Estado: {attempt.status}</strong>
      <span>{message}</span>
      {attempt.status !== 'idle' && <span style={{ overflowWrap: 'anywhere' }}>Chave fictícia: <code>{attempt.key}</code></span>}
      <span>Registro fictício na sessão: {record ? 'presente' : 'ausente'}</span>
      <small>Esta demonstração não confirma um lance. Mesmo após a recuperação, o resultado financeiro permanece desconhecido.</small>
    </section>
  </main>;
}
