import { RegisteredAuctions } from '@/components/auctions/RegisteredAuctions';
export const metadata = { title: 'Leilões' };
export default function AuctionsPage() {
  return <div className="site-container page-content"><RegisteredAuctions /></div>;
}
