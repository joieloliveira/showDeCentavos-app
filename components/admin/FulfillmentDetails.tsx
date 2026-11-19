import type { Fulfillment } from '@/services/adminFulfillments';

const money = (value: number) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string) => value ? new Date(value).toLocaleString('pt-BR') : 'Não informado';
export const paymentLabels: Record<string, string> = {
  not_started: 'Não iniciado', pending: 'Pendente', paid: 'Pago',
  failed: 'Falhou', refunded: 'Reembolsado', cancelled: 'Cancelado'
};
export const deliveryLabels: Record<string, string> = {
  not_started: 'Não iniciada', preparing: 'Em preparação', shipped: 'Enviada',
  delivered: 'Entregue', cancelled: 'Cancelada'
};
export function FulfillmentDetails({ item }: { item: Fulfillment }) {
  const address = item.shippingAddress;
  return <section className="panel" aria-label="Detalhes do arremate">
    <h3>Detalhes do arremate</h3>
    <p><strong>Leilão:</strong> {item.auctionId}</p>
    <p><strong>Vencedor:</strong> {item.winnerId}</p>
    <p><strong>Produto:</strong> {item.productId}</p>
    <p><strong>Valor:</strong> {money(item.winningPriceCents)} · <strong>Arrematado em:</strong> {date(item.wonAt)}</p>
    <p><strong>Prazo de pagamento:</strong> {date(item.paymentDeadline)}</p>
    <p><strong>Pagamento:</strong> {paymentLabels[item.paymentStatus] || item.paymentStatus} · <strong>Entrega:</strong> {deliveryLabels[item.deliveryStatus] || item.deliveryStatus}</p>
    <h4>Endereço de entrega (restrito a administradores)</h4>
    {address ? <div>
      <p><strong>Destinatário:</strong> {address.recipientName || 'Não informado'}</p>
      <p>{[address.street, address.number, address.complement].filter(Boolean).join(', ') || 'Rua não informada'}</p>
      <p>{[address.neighborhood, address.city, address.state].filter(Boolean).join(' · ')}</p>
      <p><strong>CEP:</strong> {address.zipCode || 'Não informado'} · <strong>Telefone:</strong> {address.phone || 'Não informado'}</p>
      <p><strong>Endereço cadastrado em:</strong> {item.addressSubmittedAt ? date(item.addressSubmittedAt) : 'Não confirmado'}</p>
    </div> : <p>Endereço ainda não cadastrado.</p>}
    <p>Dados pessoais são exibidos apenas no detalhamento administrativo, nunca no histórico de auditoria.</p>
  </section>;
}
