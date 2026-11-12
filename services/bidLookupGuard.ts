/** Pure guard for late read-only GET responses. No network or storage side effects. */
export type LookupIdentity = { generation: number; userId: string; auctionId: string; token: string };
export function isCurrentLookup(request: LookupIdentity, current: LookupIdentity): boolean {
  return Number.isSafeInteger(request.generation) && request.generation >= 0 &&
    request.generation === current.generation &&
    request.userId.length > 0 && request.userId === current.userId &&
    request.auctionId.length > 0 && request.auctionId === current.auctionId &&
    request.token.length > 0 && request.token === current.token;
}
