/** Pure, non-network state machine for one intended bid. No financial action here. */
export type BidAttemptState =
  | { status: 'idle' }
  | { status: 'submitting'; key: string }
  | { status: 'uncertain'; key: string; message: string }
  | { status: 'reconciling'; key: string }
  | { status: 'confirmed'; key: string; bidId: string }
  | { status: 'rejected'; key: string; message: string };

export type BidAttemptEvent =
  | { type: 'begin'; key: string }
  | { type: 'confirmed'; key: string; bidId: string }
  | { type: 'uncertain'; key: string; message: string }
  | { type: 'rejected'; key: string; message: string }
  | { type: 'reconcile'; key: string }
  | { type: 'not_found'; key: string }
  | { type: 'reset' };

/** Only a settled confirmed/rejected attempt may be cleared. A missing record
 * does not prove that an in-flight transaction can be safely retried. */
export function transitionBidAttempt(state: BidAttemptState, event: BidAttemptEvent): BidAttemptState {
  if (event.type === 'reset') {
    return state.status === 'idle' || state.status === 'confirmed' || state.status === 'rejected'
      ? { status: 'idle' } : state;
  }
  if (event.type === 'begin') {
    if (state.status !== 'idle' || !event.key) return state;
    return { status: 'submitting', key: event.key };
  }
  if (state.status === 'idle' || state.key !== event.key) return state;
  if (event.type === 'confirmed' && (state.status === 'submitting' || state.status === 'reconciling')) {
    return event.bidId ? { status: 'confirmed', key: state.key, bidId: event.bidId } : state;
  }
  if (event.type === 'uncertain' && (state.status === 'submitting' || state.status === 'reconciling')) {
    return { status: 'uncertain', key: state.key, message: event.message };
  }
  if (event.type === 'rejected' && state.status === 'submitting') {
    return { status: 'rejected', key: state.key, message: event.message };
  }
  if (event.type === 'reconcile' && state.status === 'uncertain') {
    return { status: 'reconciling', key: state.key };
  }
  if (event.type === 'not_found' && state.status === 'reconciling') {
    return { status: 'uncertain', key: state.key, message: 'Registro ainda não localizado. Não reenvie o lance automaticamente.' };
  }
  return state;
}
