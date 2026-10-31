'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { money } from '@/utils/format';
type Image = { key?: string; url?: string };
type Auction = { _id: string; status: string; startPriceCents: number; currentPriceCents: number; bidCostCents: number; bidCount: number; product?: { name: string; description?: string; price?: number; images?: Image[]; coverImage?: Image } | null };
export function RegisteredAuctionDetail({ id }: { id: string }) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get<{ auction: Auction }>(`/auctions/${encodeURIComponent(id)}`)
      .then(({ data }) => { if (active) setAuction(data.auction); })
      .catch(() => { if (active) setError('Não foi possível carregar este leilão.'); });
    return () => { active = false; };
  }, [id]);
  if (error) return <p role="alert">{error}</p>;
  if (!auction) return <p role="status">Carregando leilão...</p>;
  const images = auction.product?.images ?? [];
  const cover = auction.product?.coverImage?.url ?? images[0]?.url;
  return <div className="panel admin-auction-panel">
    <h2>{auction.product?.name ?? 'Produto indisponível'}</h2>
    {cover && <img src={cover} alt={auction.product?.name ?? 'Produto'} style={{ maxWidth: 420, width: '100%', maxHeight: 360, objectFit: 'contain' }}/>}
    <p>{auction.product?.description}</p>
    {images.length > 1 && <div className="admin-product-images">{images.map(image => image.url && <div className="admin-product-image" key={image.key ?? image.url}><img src={image.url} alt={auction.product?.name ?? 'Imagem do produto'}/></div>)}</div>}
    <p><strong>Situação:</strong> {auction.status === 'scheduled' ? 'Agendado' : auction.status === 'active' ? 'Em andamento' : auction.status === 'finished' ? 'Encerrado' : 'Cancelado'}</p>
    <p><strong>Preço atual:</strong> {money(auction.currentPriceCents)}</p>
    <p><strong>Custo por lance:</strong> {money(auction.bidCostCents)}</p>
    <p><strong>Lances registrados:</strong> {auction.bidCount}</p>
    <p role="status">Consulta demonstrativa. Não é possível realizar lances nesta tela.</p>
    <button type="button" disabled className="auction-bid-disabled">Lances indisponíveis</button>
  </div>;
}
