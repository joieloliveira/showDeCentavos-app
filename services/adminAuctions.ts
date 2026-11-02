import { api } from './api';
export type AdminAuction = {
  _id: string; status: string; startPriceCents: number; currentPriceCents: number;
  bidCostCents: number; bidCount: number; durationSeconds: number;
  startsAt?: string | null; endsAt?: string | null; waitingStartedAt?: string | null; waitingMinutes?: number; createdAt?: string; updatedAt?: string; bidIncrementCents?: number;
  product?: { _id: string; name: string; slug?: string; price?: number; coverImage?: string; status?: string } | null;
};
export type AdminAuctionList = { auctions: AdminAuction[]; statusCounts?: { scheduled: number; active: number; finished: number; cancelled: number }; pagination: { page: number; limit: number; total: number; totalPages: number } };
export async function listAdminAuctions(token: string, page: number, status: string): Promise<AdminAuctionList> {
  const { data } = await api.get<AdminAuctionList>('/admin/auctions', {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, limit: 20, ...(status ? { status } : {}) },
  });
  return data;
}

export type AuctionProduct = { _id: string; name: string; price: number; stock: number; reservedStock: number };
export async function listAuctionProducts(token: string): Promise<AuctionProduct[]> {
  const response = await api.get('/admin/auctions/products', { headers: { Authorization: 'Bearer ' + token } });
  return response.data.products;
}
export async function createAdminAuction(token: string, product: string, startPriceCents: number, bidCostCents: number): Promise<void> {
  await api.post('/auctions', { product, startPriceCents, bidCostCents }, { headers: { Authorization: 'Bearer ' + token } });
}

export async function startAdminAuctionWaiting(token: string, id: string, waitingMinutes: number): Promise<void> {
  await api.post(`/auctions/${encodeURIComponent(id)}/start-waiting`, { waitingMinutes }, { headers: { Authorization: `Bearer ${token}` } });
}

export type AdminAuctionEvent = { _id: string; eventType: string; occurredAt: string; source: string };
export async function listAdminAuctionEvents(token: string, id: string): Promise<AdminAuctionEvent[]> {
  const response = await api.get('/admin/auctions/' + encodeURIComponent(id) + '/events', { headers: { Authorization: 'Bearer ' + token } });
  return response.data.events;
}

export type AdminAuctionBid = {
  bidId: string; userId: string; bidCostCents: number;
  priceBeforeCents: number; priceAfterCents: number; balanceAfterCents: number;
  expiresAt: string; createdAt: string; ledgerStatus: 'matched' | 'missing' | 'mismatch';
  transactionId: string | null;
};
export type AdminAuctionBidHistory = {
  bids: AdminAuctionBid[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
export async function listAdminAuctionBids(token: string, id: string, page = 1): Promise<AdminAuctionBidHistory> {
  const response = await api.get<AdminAuctionBidHistory>('/admin/auctions/' + encodeURIComponent(id) + '/bids', {
    headers: { Authorization: 'Bearer ' + token }, params: { page, limit: 20 },
  });
  return response.data;
}

export type AdminAuctionBidSummary = { total: number; matched: number; missing: number; mismatch: number };
export async function getAdminAuctionBidSummary(token: string, id: string): Promise<AdminAuctionBidSummary> {
  const response = await api.get<{ summary: AdminAuctionBidSummary }>('/admin/auctions/' + encodeURIComponent(id) + '/bids/summary', {
    headers: { Authorization: 'Bearer ' + token },
  });
  return response.data.summary;
}
