'use client';
import { useState } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';

type Preview = {
  auctionId: string; amountCents: number; currency: string;
  paymentStatus: string; paymentDeadline: string; paymentWindowStatus: string;
  checkoutEnabled: boolean; checkoutReason: string;
};
export function WinPaymentPreview({ auctionId, getToken }: { auctionId: string; getToken: () => string | null }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const token = getToken();
    if (!token) { setError('Faça login novamente para consultar o pagamento.'); return; }
    setLoading(true); setError(''); setPreview(null);
    try {
      const { data } = await api.get<Preview>(`/auctions/my/wins/${encodeURIComponent(auctionId)}/payment-preview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.auctionId !== auctionId || data.currency !== 'BRL' ||
          !Number.isSafeInteger(data.amountCents) || data.amountCents < 0) {
        throw new Error('Resposta de pagamento inválida.');
      }
      setPreview(data);
    } catch (err) {
      setError(getApiError(err));
    } finally { setLoading(false); }
  };
  return <section aria-label="Consulta de pagamento do arremate">
    <button type="button" disabled={loading} onClick={() => void load()}>
      {loading ? 'Consultando...' : 'Consultar pagamento do arremate'}
    </button>
    {error && <p role="alert">{error}</p>}
    {preview && <div role="status">
      <p><strong>Valor:</strong> {(preview.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      <p><strong>Prazo:</strong> {new Date(preview.paymentDeadline).toLocaleString('pt-BR')}</p>
      <p><strong>Situação:</strong> {preview.paymentWindowStatus === 'paid' ? 'Pago' : preview.paymentWindowStatus === 'expired' ? 'Prazo ultrapassado' : preview.paymentWindowStatus === 'awaiting_payment' ? 'Aguardando pagamento' : preview.paymentWindowStatus}</p>
      <p><strong>Checkout:</strong> indisponível nesta etapa. Nenhuma cobrança será iniciada.</p>
    </div>}
  </section>;
}
