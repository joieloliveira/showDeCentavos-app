'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createAdminAuction } from '@/services/adminAuctions';
export function AdminAuctionCreateForm({ onCreated }: { onCreated: () => void }) {
 const { getToken } = useAuth();
 const [product,setProduct] = useState('');
 const [price,setPrice] = useState('0');
 const [message,setMessage] = useState('');
 async function save() {
  const token = getToken();
  if (!token || !/^[a-f0-9]{24}$/i.test(product) || !Number.isSafeInteger(Number(price)) || Number(price)<0) {setMessage('Dados inválidos.');return;}
  try { await createAdminAuction(token,product,Number(price),50);setMessage('Leilão cadastrado sem iniciar.');onCreated(); }
  catch {setMessage('Não foi possível cadastrar o leilão.');}
 }
 return <section className="panel admin-auction-panel"><h2>Cadastrar leilão</h2><label>ID do produto<input value={product} onChange={e=>setProduct(e.target.value)} /></label><label>Preço inicial em centavos<input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} /></label><button type="button" className="incident-action" onClick={()=>void save()}>Cadastrar sem iniciar</button><p role="status">{message}</p></section>;
}
