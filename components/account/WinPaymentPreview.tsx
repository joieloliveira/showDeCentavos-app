'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';

type Preview = {
  auctionId: string; amountCents: number; currency: string;
  paymentStatus: string; paymentDeadline: string | null; paymentWindowStatus: string;
  checkoutEnabled: boolean; checkoutReason: string;
};
const labels: Record<string, string> = {
  not_started: 'Não iniciado', pending: 'Aguardando confirmação',
  paid: 'Pagamento confirmado', failed: 'Falha no pagamento',
  refunded: 'Reembolsado', cancelled: 'Cancelado',
};
const windowLabels: Record<string, string> = {
  paid: 'Pago', expired: 'Prazo ultrapassado',
  awaiting_payment: 'Dentro do prazo', not_started: 'Não iniciado',
};
const formatMoney = (cents: number) => (cents / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
});
export function WinPaymentPreview({ auctionId, getToken }: {
  auctionId: string; getToken: () => string | null;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setPreview(null); setError(''); }, [auctionId]);
  const load = async () => {
    const token = getToken();
    if (!token) { setError('Faça login novamente para consultar o pagamento.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.get<Preview>(
        `/auctions/my/wins/${encodeURIComponent(auctionId)}/payment-preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.auctionId !== auctionId || data.currency !== 'BRL' ||
          !Number.isSafeInteger(data.amountCents) || data.amountCents < 0 ||
          typeof data.checkoutEnabled !== 'boolean' ||
          typeof data.paymentStatus !== 'string') {
        throw new Error('Resposta de pagamento inválida.');
      }
      // This interface is deliberately read-only, even if the API ever enables checkout.
      if (getToken() !== token) throw new Error('Sua sessão mudou. Consulte novamente.');
      setPreview(data);
    } catch (err) {
      setError(getApiError(err));
      setPreview(null);
    } finally { setLoading(false); }
  };
  const deadline = preview?.paymentDeadline && Number.isFinite(Date.parse(preview.paymentDeadline))
    ? new Date(preview.paymentDeadline).toLocaleString('pt-BR') : null;
  return <section aria-label="Acompanhamento financeiro do arremate" style={{
    display: 'grid', gap: 10, padding: 14, border: '1px solid #cbd5e1', borderRadius: 10,
  }}>
    <h3 style={{ margin: 0, fontSize: 16 }}>Pagamento do arremate</h3>
    <p style={{ margin: 0 }}>Consulte o valor e o estado registrado na plataforma. Esta tela não gera cobranças.</p>
    <button type="button" disabled={loading} onClick={() => void load()} aria-busy={loading}>
      {loading ? 'Consultando...' : preview ? 'Atualizar situação do pagamento' : 'Consultar pagamento'}
    </button>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    {preview && <div role="status" style={{ display: 'grid', gap: 6 }}>
      <p style={{ margin: 0 }}><strong>Valor:</strong> {formatMoney(preview.amountCents)}</p>
      <p style={{ margin: 0 }}><strong>Pagamento:</strong> {labels[preview.paymentStatus] ?? 'Em análise'}</p>
      <p style={{ margin: 0 }}><strong>Prazo:</strong> {deadline ?? 'Indisponível'}</p>
      <p style={{ margin: 0 }}><strong>Janela:</strong> {windowLabels[preview.paymentWindowStatus] ?? 'Em análise'}</p>
      {preview.paymentStatus === 'paid'
        ? <p style={{ margin: 0, color: '#166534' }}>Pagamento confirmado no sistema.</p>
        : preview.paymentStatus === 'pending'
          ? <p style={{ margin: 0 }}>A confirmação pode depender do processamento ou da reconciliação financeira.</p>
          : preview.paymentWindowStatus === 'expired'
            ? <p style={{ margin: 0 }}>O prazo informado terminou. Procure o suporte antes de tentar pagar.</p>
            : null}
      <p style={{ margin: 0 }}><strong>Checkout:</strong> indisponível nesta tela. Nenhum PIX será emitido.</p>
    </div>}
  </section>;
}
