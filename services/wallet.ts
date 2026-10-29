import { api } from '@/services/api';
export type WalletTransaction = {
  _id: string;
  type: 'deposit' | 'bid' | 'refund' | 'adjustment';
  amountCents: number;
  balanceAfterCents: number;
  description: string | null;
  createdAt: string;
};
export type WalletTransactionsResponse = {
  transactions: WalletTransaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
export async function fetchWalletBalance(token: string) {
  const { data } = await api.get<{ balanceCents: number }>('/wallet/balance', bearer(token));
  if (!Number.isSafeInteger(data.balanceCents) || data.balanceCents < 0) throw new Error('Saldo inválido retornado pela API.');
  return data.balanceCents;
}
export async function fetchWalletTransactions(token: string, page = 1, limit = 10) {
  const { data } = await api.get<WalletTransactionsResponse>('/wallet/transactions', {
    ...bearer(token),
    params: { page, limit },
  });
  if (!Array.isArray(data.transactions) || !data.pagination) throw new Error('Histórico inválido retornado pela API.');
  return data;
}
