'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createAdminAuction, listAuctionProducts, type AuctionProduct } from '@/services/adminAuctions';
export function AdminAuctionCreateForm({ onCreated }: { onCreated: () => void }) {
 const { getToken, user } = useAuth();
 const [products,setProducts] = useState<AuctionProduct[]>([]);
 const [cost,setCost] = useState(50);
 const [busy,setBusy] = useState(false);
 useEffect(() => { if (user?.role !== 'admin') return; const token=getToken(); if (!token) return; let active=true; listAuctionProducts(token).then(items=>{if(active)setProducts(items);}).catch(()=>{if(active)setMessage('Falha ao carregar produtos.');}); return ()=>{active=false;}; },[user?.role,getToken]);
 const [product,setProduct] = useState('');
 const [price,setPrice] = useState('0');
 const [message,setMessage] = useState('');
 async function save() {
  const token = getToken();
  if (!token || !/^[a-f0-9]{24}$/i.test(product) || !Number.isSafeInteger(Number(price)) || Number(price)<0) {setMessage('Dados inválidos.');return;}
  setBusy(true);
  try { await createAdminAuction(token,product,Number(price),cost);setMessage('Leilão cadastrado sem iniciar.');setProduct('');onCreated(); }
  catch {setMessage('Não foi possível cadastrar o leilão.');} finally {setBusy(false);}
 }
 return <section className="panel admin-auction-panel"><h2>Cadastrar leilão</h2><label>Produto<select value={product} onChange={e=>setProduct(e.target.value)}><option value="">Selecione um produto</option>{products.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></label><label>Preço inicial em centavos<input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} /></label><label>Custo do lance<select value={cost} onChange={e=>setCost(Number(e.target.value))}><option value={50}>R$ 0,50</option><option value={100}>R$ 1,00</option></select></label><button type="button" className="incident-action" disabled={busy || !product} onClick={()=>void save()}>Cadastrar sem iniciar</button><p role="status">{message}</p></section>;
}
