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
