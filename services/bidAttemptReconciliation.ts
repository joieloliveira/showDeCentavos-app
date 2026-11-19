import type { BidAttemptState } from './bidAttemptState';
import { transitionBidAttempt } from './bidAttemptState';
import type { BidRecord } from './bids';

export type ReconciliationResult =
  | { status: 'found'; bid: BidRecord }
  | { status: 'not_found' }
  | { status: 'unavailable' };
const objectId = /^[0-9a-f]{24}$/i;

/** Apply only the result for the original pending key, user and auction.
 * This module has no storage access and cannot submit or retry a bid. */
export function resolvePendingBid(
  state: BidAttemptState,
  key: string,
  userId: string,
  auctionId: string,
  result: ReconciliationResult,
): BidAttemptState {
  if (state.status !== 'reconciling' || state.key !== key) return state;
  if (!objectId.test(userId) || !objectId.test(auctionId)) {
    return transitionBidAttempt(state, { type: 'uncertain', key, message: 'Identidade da consulta inválida. Preserve a chave original.' });
  }
  if (result.status === 'not_found') return transitionBidAttempt(state, { type: 'not_found', key });
  if (result.status === 'unavailable') {
    return transitionBidAttempt(state, { type: 'uncertain', key, message: 'Não foi possível verificar o registro. Preserve a chave original.' });
  }
  // Treat API data as untrusted even when callers provide a typed result.
  // A malformed response must never crash reconciliation or confirm a bid.
  const bid = result.bid;
  if (!bid || typeof bid !== 'object' ||
      typeof bid.idempotencyKey !== 'string' || typeof bid.user !== 'string' ||
      typeof bid.auction !== 'string' || typeof bid._id !== 'string' ||
      bid.idempotencyKey !== key || !objectId.test(bid.user) || !objectId.test(bid.auction) ||
      bid.user.toLowerCase() !== userId.toLowerCase() ||
      bid.auction.toLowerCase() !== auctionId.toLowerCase() || !objectId.test(bid._id)) {
    return transitionBidAttempt(state, { type: 'uncertain', key, message: 'Registro divergente da conta ou do leilão. Não reenvie a tentativa.' });
  }
  return transitionBidAttempt(state, { type: 'confirmed', key, bidId: bid._id });
}
