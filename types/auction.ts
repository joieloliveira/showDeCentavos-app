export type AuctionStatus = 'live' | 'upcoming' | 'finished';
export interface Auction { id: string; slug: string; title: string; category: string; status: AuctionStatus; retailPriceCents: number; bidPriceCents: number; secondsLeft: number; bidders: number; emoji: string; accent: string; featured?: boolean; }
