import axios from 'axios';
import { api } from '@/services/api';

// Financial bids remain server-gated by AUCTION_BIDDING_ENABLED.
// This client never retries POST automatically: an uncertain outcome must
// be checked with the same idempotency key before any new attempt.
export type BidRecord = {
  _id: string;
  auction: string;
  user: string;
  idempotencyKey: string;
  bidCostCents: number;
  priceBeforeCents: number;
  priceAfterCents: number;
  balanceAfterCents: number;
  expiresAt: string;
};

export type PlaceBidResponse = {
  message: string;
  bid: BidRecord;
  duplicate?: boolean;
  auctionId?: string;
  currentPriceCents?: number;
  bidCount?: number;
  balanceAfterCents?: number;
  expiresAt?: string;
};

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const objectId = /^[0-9a-f]{24}$/i;

function assertBidKey(key: string) {
  if (!uuidV4.test(key)) throw new Error('Chave de idempotência inválida.');
}
function auth(token: string) {
  if (!token) throw new Error('É necessário entrar na sua conta.');
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Create exactly one key per intended bid, and keep it through uncertain outcomes. */
export function createBidKey() {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('Este navegador não permite criar uma chave segura para o lance.');
  }
  return crypto.randomUUID();
}

/** Read-only reconciliation. A 404 means no bid is currently recorded for this key. */
export async function findBidByKey(token: string, key: string) {
  assertBidKey(key);
  const { data } = await api.get<{ bid: BidRecord }>(
    `/auctions/bids/by-key/${encodeURIComponent(key)}`, auth(token),
  );
  return data.bid;
}

/**
 * Must only be called after an explicit user confirmation and a separate
 * client release gate. Never auto-retry with a fresh key on timeout/503.
 * The backend is the sole authority for balances, timing and auction state.
 */
export async function submitConfirmedBid(
  token: string,
  auctionId: string,
  key: string,
  options: { financialBidsEnabled: boolean } = { financialBidsEnabled: false },
) {
  // Explicit client-side release gate. The server must independently authorize bids.
  // This protects against accidental invocation while the UI is preview-only.
  if (options.financialBidsEnabled !== true) {
    throw new Error('Envio financeiro bloqueado no frontend.');
  }
  if (!objectId.test(auctionId)) throw new Error('Identificador de leilão inválido.');
  assertBidKey(key);
  const { data } = await api.post<PlaceBidResponse>(
    `/auctions/${encodeURIComponent(auctionId)}/bids`,
    { idempotencyKey: key },
    auth(token),
  );
  if (!data?.bid?._id || data.bid.idempotencyKey !== key ||
      String(data.bid.auction).toLowerCase() !== auctionId.toLowerCase()) {
    throw new Error('Resposta do lance inconsistente. Consulte a chave antes de tentar novamente.');
  }
  return data;
}

/** User-facing guidance for a single bid attempt. Never triggers another POST. */
export type BidFailure = {
  kind: 'auth' | 'disabled' | 'balance' | 'conflict' | 'uncertain' | 'invalid' | 'other';
  message: string;
  /** Preserve the original key and reconcile before considering another attempt. */
  needsReconciliation: boolean;
};

export function describeBidFailure(error: unknown): BidFailure {
  if (!axios.isAxiosError(error)) {
    return {
      kind: 'uncertain',
      message: 'Não foi possível confirmar o resultado. Consulte a tentativa antes de enviar outro lance.',
      needsReconciliation: true,
    };
  }
  const status = error.response?.status;
  const serverMessage = typeof error.response?.data?.message === 'string'
    ? error.response.data.message : '';
  if (!status) {
    return {
      kind: 'uncertain',
      message: 'Conexão interrompida. O lance pode ter sido registrado. Consulte a mesma chave antes de tentar novamente.',
      needsReconciliation: true,
    };
  }
  if (status === 401 || status === 403) {
    return { kind: 'auth', message: 'Sua sessão precisa ser verificada antes de participar.', needsReconciliation: false };
  }
  if (status === 503 && /lances.*(indisponíveis|desabilitados)/i.test(serverMessage)) {
    return { kind: 'disabled', message: serverMessage, needsReconciliation: false };
  }
  if (status === 409 && /saldo insuficiente|usuário desativado/i.test(serverMessage)) {
    return { kind: 'balance', message: 'Saldo insuficiente ou conta desativada. Confira sua carteira e o estado da conta.', needsReconciliation: false };
  }
  if (status === 400) {
    return { kind: 'invalid', message: 'Solicitação inválida. Nenhum novo lance deve ser enviado automaticamente.', needsReconciliation: false };
  }
  if (status === 409 && /chave já foi utilizada em outro leilão/i.test(serverMessage)) {
    return { kind: 'conflict', message: serverMessage, needsReconciliation: false };
  }
  if (status === 409 && /leilão|tempo para realizar lances|custo do lance inválido/i.test(serverMessage)) {
    return { kind: 'conflict', message: serverMessage, needsReconciliation: false };
  }
  // 5xx, unknown conflicts and unexpected responses must be reconciled.
  return {
    kind: 'uncertain',
    message: 'Resultado do lance não confirmado. Consulte a chave original antes de qualquer nova tentativa.',
    needsReconciliation: true,
  };
}

/** Read-only check. A missing record is not permission to blindly retry a POST. */
export async function reconcileBid(token: string, key: string):
  Promise<{ status: 'found'; bid: BidRecord } | { status: 'not_found' } | { status: 'unavailable' }> {
  try {
    const bid = await findBidByKey(token, key);
    if (!bid || bid.idempotencyKey !== key) return { status: 'unavailable' };
    return { status: 'found', bid };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return { status: 'not_found' };
    return { status: 'unavailable' };
  }
}
