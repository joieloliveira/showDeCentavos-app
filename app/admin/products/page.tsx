'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
type Product = {_id:string;name:string;slug:string;description:string;price:number;stock:number;status:string};
export default function AdminProductsPage() {
 const {user,isLoading,getToken}=useAuth();
 const [products,setProducts]=useState<Product[]>([]);
 const [name,setName]=useState('');
 const [description,setDescription]=useState('');
 const [price,setPrice]=useState('');
 const [stock,setStock]=useState('1');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [editing,setEditing]=useState<string|null>(null);
 const [editStatus,setEditStatus]=useState('draft');
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  if(user?.role!=='admin')return;
  const token=getToken();if(!token)return;
  let active=true;
  api.get('/admin/products',{headers:{Authorization:'Bearer '+token}})
   .then(r=>{if(active)setProducts(r.data.products);})
   .catch(()=>{if(active)setMessage('Não foi possível carregar os produtos.');});
  return ()=>{active=false;};
 },[user?.role,getToken,refresh]);
 async function editProduct(p:Product){setEditing(p._id);setName(p.name);setPrice(String(p.price));setStock(String(p.stock));setEditStatus(p.status);setDescription(p.description);setMessage('');}
 async function save(){
  const token=getToken();
  const numericPrice=Number(price.replace(',','.'));
  const numericStock=Number(stock);
  const slug=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!token||name.trim().length<3||!description.trim()||!slug||!price.trim()||!Number.isFinite(numericPrice)||numericPrice<0||!Number.isSafeInteger(numericStock)||numericStock<0){setMessage('Preencha os campos com valores válidos.');return;}
  setBusy(true);setMessage('');
  try{
   if(editing){await api.patch('/admin/products/'+editing,{name,description,price:numericPrice,stock:numericStock,status:editStatus},{headers:{Authorization:'Bearer '+token}});}else{await api.post('/admin/products',{name,slug,description,price:numericPrice,stock:numericStock},{headers:{Authorization:'Bearer '+token}});}
   setName('');setDescription('');setPrice('');setStock('1');setEditing(null);setMessage('Produto salvo com sucesso.');setRefresh(n=>n+1);
  }catch{setMessage('Não foi possível cadastrar. Verifique se o nome já foi utilizado.');}
  finally{setBusy(false);}
 }
 if(isLoading)return <main className="site-container page-content">Carregando...</main>;
 if(user?.role!=='admin')return <main className="site-container page-content"><h1>Acesso restrito</h1><Link href="/login">Entrar</Link></main>;
 return <main className="site-container page-content"><div className="page-heading"><span className="eyebrow">ADMINISTRAÇÃO · PRODUTOS</span><h1>Gerenciar produtos</h1><p>Cadastre produtos em rascunho antes de preparar seus leilões.</p></div>
 <section className="panel admin-auction-panel"><h2>{editing?'Editar produto':'Novo produto'}</h2><div className="admin-product-form">
 <label>Nome<input value={name} maxLength={150} onChange={e=>setName(e.target.value)}/></label>
 <label>Preço de referência (R$)<input type="text" inputMode="decimal" placeholder="199,90" value={price} onChange={e=>setPrice(e.target.value)}/></label>
 <label>Estoque<input type="number" min="0" step="1" value={stock} onChange={e=>setStock(e.target.value)}/></label>
 {editing&&<label>Situação<select value={editStatus} onChange={e=>setEditStatus(e.target.value)}><option value="draft">Rascunho</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>}<label className="admin-product-description">Descrição<textarea rows={4} maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 </div><button className="incident-action" type="button" disabled={busy} onClick={()=>void save()}>{busy?'Salvando...':editing?'Salvar alterações':'Salvar rascunho'}</button>{editing&&<button className="incident-action" type="button" onClick={()=>{setEditing(null);setName('');setDescription('');setPrice('');setStock('1');setMessage('');}}>Cancelar edição</button>}{message&&<p role="status">{message}</p>}</section>
 <section className="panel admin-auction-panel"><h2>Produtos cadastrados</h2><div className="admin-auction-table-wrap"><table className="admin-auction-table"><thead><tr><th>Produto</th><th>Identificador</th><th>Preço de referência</th><th>Estoque</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{products.map(p=><tr key={p._id}><td>{p.name}</td><td>{p.slug}</td><td>{p.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td><td>{p.stock}</td><td>{p.status}</td><td><button type="button" className="incident-action" onClick={()=>void editProduct(p)}>Editar</button></td></tr>)}</tbody></table></div>{products.length===0&&<p>Nenhum produto cadastrado.</p>}</section>
 </main>;
}
