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

export type WalletDeposit = {
  id: string;
  amountCents: number;
  status: 'pending' | 'approved' | 'failed' | 'cancelled';
  provider: 'mercadopago' | 'manual_test';
  createdAt: string;
  processedAt: string | null;
  pix: { qrCode?: string | null; qrCodeBase64?: string | null; ticketUrl?: string | null } | null;
};
export async function fetchWalletDeposit(token: string, depositId: string) {
  const { data } = await api.get<{ deposit: WalletDeposit }>(`/wallet/deposits/${encodeURIComponent(depositId)}`, bearer(token));
  if (!data?.deposit || typeof data.deposit.id !== 'string' || !Number.isSafeInteger(data.deposit.amountCents) ||
    !['pending', 'approved', 'failed', 'cancelled'].includes(data.deposit.status)) throw new Error('Resposta de depósito inválida.');
  return data.deposit;
}
