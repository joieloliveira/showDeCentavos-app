import { api } from '@/services/api';

export type Fulfillment = {
  auctionId: string;
  winnerId: string;
  productId: string;
  winningPriceCents: number;
  wonAt: string;
  paymentDeadline: string;
  paymentWindowStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  addressSubmittedAt: string | null;
  shippingAddress: null | {
    recipientName?: string;
    phone?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
};
export type FulfillmentList = { page: number; limit: number; total: number; items: Fulfillment[] };
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function listAdminFulfillments(token: string, page: number, paymentStatus: string, deliveryStatus: string) {
  const { data } = await api.get<FulfillmentList>('/auctions/admin/fulfillments', {
    headers: headers(token),
    params: { page, ...(paymentStatus && { paymentStatus }), ...(deliveryStatus && { deliveryStatus }) }
  });
  if (!Array.isArray(data?.items) || typeof data.total !== 'number') throw new Error('Resposta de entregas inválida.');
  return data;
}
export async function advanceAdminDelivery(token: string, auctionId: string, deliveryStatus: string) {
  const { data } = await api.patch<{ auctionId: string; paymentStatus: string; deliveryStatus: string }>(
    `/auctions/admin/fulfillments/${encodeURIComponent(auctionId)}/delivery`,
    { deliveryStatus }, { headers: headers(token) }
  );
  return data;
}

export type DeliveryAuditEvent = {
  actorId: string;
  fromStatus: string;
  toStatus: string;
  occurredAt: string;
};
export async function getAdminDeliveryAudit(token: string, auctionId: string) {
  const { data } = await api.get<{ auctionId: string; items: DeliveryAuditEvent[] }>(
    `/auctions/admin/fulfillments/${encodeURIComponent(auctionId)}/delivery-audit`,
    { headers: headers(token) }
  );
  if (data?.auctionId !== auctionId || !Array.isArray(data.items)) {
    throw new Error('Resposta de auditoria inválida.');
  }
  return data.items;
}
