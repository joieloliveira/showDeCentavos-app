import type { BidAttemptState } from './bidAttemptState';

/** Session-scoped safety journal. It does not authorize a POST or store tokens. */
export type BidAttemptJournal = { version: 1; userId: string; auctionId: string; key: string; savedAt: number };
const objectId = /^[0-9a-f]{24}$/i;
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const BID_ATTEMPT_JOURNAL_KEY = 'showdecentavos:pending-bid:v1';

export function serializePendingBid(state: BidAttemptState, userId: string, auctionId: string, now: number): string | null {
  if (!objectId.test(userId) || !objectId.test(auctionId) || !Number.isSafeInteger(now) || now < 0) return null;
  if (state.status !== 'submitting' && state.status !== 'uncertain' && state.status !== 'reconciling') return null;
  if (!uuidV4.test(state.key)) return null;
  return JSON.stringify({ version: 1, userId: userId.toLowerCase(), auctionId: auctionId.toLowerCase(), key: state.key, savedAt: now });
}

/** After refresh, pending requests are always uncertain, never idle or confirmed. */
export function restorePendingBid(raw: string | null, userId: string, auctionId: string): BidAttemptState | null {
  if (!raw || !objectId.test(userId) || !objectId.test(auctionId)) return null;
  try {
    const entry: unknown = JSON.parse(raw);
    if (!entry || typeof entry !== 'object') return null;
    const value = entry as Partial<BidAttemptJournal>;
    if (value.version !== 1 || typeof value.userId !== 'string' || typeof value.auctionId !== 'string' ||
        value.userId.toLowerCase() !== userId.toLowerCase() || value.auctionId.toLowerCase() !== auctionId.toLowerCase() ||
        typeof value.key !== 'string' || !uuidV4.test(value.key) ||
        !Number.isSafeInteger(value.savedAt) || value.savedAt! < 0) return null;
    return { status: 'uncertain', key: value.key, message: 'Tentativa pendente recuperada após atualização da página. Consulte a chave original antes de qualquer novo lance.' };
  } catch { return null; }
}
