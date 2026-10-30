import { api } from './api';
export type AdminAuction = {
  _id: string; status: string; startPriceCents: number; currentPriceCents: number;
  bidCostCents: number; bidCount: number; durationSeconds: number;
  startsAt?: string | null; endsAt?: string | null; createdAt?: string;
  product?: { _id: string; name: string; slug?: string; price?: number; coverImage?: string; status?: string } | null;
};
export type AdminAuctionList = { auctions: AdminAuction[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
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
