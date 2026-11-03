import { api } from '@/services/api';

export type AuctionOperationsSummary = {
  auctions: Record<'scheduled' | 'active' | 'finished' | 'cancelled', number>;
  payments: Record<'not_started' | 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled', number>;
  deliveries: Record<'not_started' | 'preparing' | 'shipped' | 'delivered' | 'cancelled', number>;
  incidentsRequiringReview: number;
  fulfillmentAlerts: {
    overduePayments: number;
    readyForPreparation: number;
    awaitingAddress: number;
    preparingDeliveries: number;
    shippedDeliveries: number;
  };
};
export async function getAuctionOperationsSummary(token: string) {
  const { data } = await api.get<AuctionOperationsSummary>('/admin/auctions/operations-summary', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!data?.auctions || !data?.payments || !data?.deliveries || !data?.fulfillmentAlerts || typeof data.incidentsRequiringReview !== 'number') {
    throw new Error('Indicadores operacionais inválidos.');
  }
  return data;
}
