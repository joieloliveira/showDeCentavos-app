'use client';
import type { BidAttemptState } from '@/services/bidAttemptState';

type Lookup = { status: 'checking' | 'found' | 'not_found' | 'unavailable' | 'mismatch'; key: string } | null;
type Props = { attempt: BidAttemptState; lookup?: Lookup };

const labels: Record<BidAttemptState['status'], string> = {
  idle: 'Nenhuma tentativa em andamento',
  submitting: 'Aguardando confirmação do servidor',
  uncertain: 'Resultado ainda não confirmado',
  reconciling: 'Consultando tentativa anterior',
  confirmed: 'Lance confirmado pelo servidor',
  rejected: 'Tentativa rejeitada',
};

/** Read-only presentation. Never submits a bid or changes attempt state. */
export function BidAttemptStatus({ attempt, lookup = null }: Props) {
  return (
    <section className="registered-attempt-status" aria-label="Acompanhamento de tentativa de lance" aria-live="polite" aria-atomic="true">
      <strong>Acompanhamento de tentativa</strong>
      <p role="status" style={{ margin: 0 }}>{labels[attempt.status]}</p>
      {attempt.status !== 'idle' && <p style={{ margin: 0, overflowWrap: 'anywhere' }}>Chave original: <code>{attempt.key}</code></p>}
      {(attempt.status === 'uncertain' || attempt.status === 'rejected') && <p style={{ margin: 0 }}>{attempt.message}</p>}
      {attempt.status === 'uncertain' && <p style={{ margin: 0 }}>Não envie outra tentativa. Consulte a chave original para verificar o resultado.</p>}
      {attempt.status === 'confirmed' && <p style={{ margin: 0, overflowWrap: 'anywhere' }}>Registro confirmado: <code>{attempt.bidId}</code></p>}
      {lookup && <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 8, display: 'grid', gap: 6 }}>
        <strong>Última consulta avulsa (somente leitura)</strong>
        <p style={{ margin: 0, overflowWrap: 'anywhere' }}>Chave consultada: <code>{lookup.key}</code></p>
        <p role="status" style={{ margin: 0 }}>{lookup.status === 'checking' ? 'Consultando registro...' : lookup.status === 'found' ? 'Registro encontrado para este leilão. Não reenvie a tentativa.' : lookup.status === 'not_found' ? 'Registro não encontrado até o momento. Isso não autoriza um novo envio.' : lookup.status === 'mismatch' ? 'Registro de outro leilão. Nenhuma confirmação para este leilão.' : 'Consulta indisponível. Preserve a chave e tente consultar mais tarde.'}</p>
        <small>Uma chave digitada manualmente não representa uma tentativa iniciada nesta página.</small>
      </div>}
      <small>Monitor informativo. Nenhum lance financeiro pode ser enviado por este painel.</small>
    </section>
  );
}
