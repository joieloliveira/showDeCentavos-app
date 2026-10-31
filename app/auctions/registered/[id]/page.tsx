import Link from 'next/link';
import { RegisteredAuctionDetail } from '@/components/auctions/RegisteredAuctionDetail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="site-container page-content"><div className="page-heading"><Link href="/auctions">← Voltar aos leilões</Link><h1>Leilão</h1><p>Confira as imagens e informações do produto.</p></div><RegisteredAuctionDetail id={id}/></div>;
}
