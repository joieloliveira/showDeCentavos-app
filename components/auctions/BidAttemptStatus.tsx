'use client';
import type { BidAttemptState } from '@/services/bidAttemptState';

type Props = { attempt: BidAttemptState };

const labels: Record<BidAttemptState['status'], string> = {
  idle: 'Nenhuma tentativa em andamento',
  submitting: 'Aguardando confirmação do servidor',
  uncertain: 'Resultado ainda não confirmado',
  reconciling: 'Consultando tentativa anterior',
  confirmed: 'Lance confirmado pelo servidor',
  rejected: 'Tentativa rejeitada',
};

/** Read-only presentation. Never submits a bid or changes attempt state. */
export function BidAttemptStatus({ attempt }: Props) {
  return (
    <section className="registered-attempt-status" aria-label="Acompanhamento de tentativa de lance" aria-live="polite" aria-atomic="true">
      <strong>Acompanhamento de tentativa</strong>
      <p role="status" style={{ margin: 0 }}>{labels[attempt.status]}</p>
      {attempt.status !== 'idle' && <p style={{ margin: 0, overflowWrap: 'anywhere' }}>Chave original: <code>{attempt.key}</code></p>}
      {(attempt.status === 'uncertain' || attempt.status === 'rejected') && <p style={{ margin: 0 }}>{attempt.message}</p>}
      {attempt.status === 'uncertain' && <p style={{ margin: 0 }}>Não envie outra tentativa. Consulte a chave original para verificar o resultado.</p>}
      {attempt.status === 'confirmed' && <p style={{ margin: 0, overflowWrap: 'anywhere' }}>Registro confirmado: <code>{attempt.bidId}</code></p>}
      <small>Monitor informativo. Nenhum lance financeiro pode ser enviado por este painel.</small>
    </section>
  );
}
