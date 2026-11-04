'use client';
import { useState, type ChangeEvent } from 'react';
import axios from 'axios';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
type Image = {key:string;url:string};
export function AdminProductImages({product,onChanged}:{product:{_id:string;name:string;images?:Image[];coverImage?:Image};onChanged:()=>void}) {
 const {getToken}=useAuth();
 const [files,setFiles]=useState<File[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const images=product.images??[];
 const headers=()=>({Authorization:'Bearer '+getToken()});
 const choose=(event:ChangeEvent<HTMLInputElement>)=>{const selected=Array.from(event.target.files??[]);setFiles(selected);setMessage('');};
 async function upload(){
  if(!files.length||files.length+images.length>8){setMessage('Selecione imagens sem ultrapassar o limite de 8.');return;}
  setBusy(true);setMessage('');
  try{
   const data=new FormData();files.forEach(file=>data.append('images',file));
   await api.post('/admin/products/'+product._id+'/images',data,{headers:headers()});
   setFiles([]);setMessage('Imagens enviadas.');onChanged();
  }catch(error){const detail=axios.isAxiosError(error)?error.response?.data?.message:undefined;setMessage(detail?`Falha no envio: ${detail}`:'Falha no envio. Verifique o console do backend e a aba Rede do navegador.');}
  finally{setBusy(false);}
 }
 async function changeImage(key:string,action:'cover'|'delete'){
  if(action==='delete'&&!window.confirm('Remover esta imagem?'))return;
  setBusy(true);setMessage('');
  try{
   const path='/admin/products/'+product._id+(action==='cover'?'/cover':'/images');
   if(action==='cover')await api.put(path,{key},{headers:headers()});
   else await api.delete(path,{headers:headers(),data:{key}});
   onChanged();
  }catch{setMessage('Não foi possível alterar a imagem.');}
  finally{setBusy(false);}
 }
 return <section className="panel admin-auction-panel"><h2>Imagens — {product.name}</h2>
 <p>JPG, PNG ou WEBP, até 5 MB por arquivo. Máximo de 8 imagens.</p>
 <div className="admin-product-images">{images.map(image=><div key={image.key} className="admin-product-image"><img src={image.url} alt={'Imagem de '+product.name}/><p>{image.key===product.coverImage?.key?'Imagem principal':'Imagem adicional'}</p><button type="button" disabled={busy||image.key===product.coverImage?.key} onClick={()=>void changeImage(image.key,'cover')}>Definir capa</button><button type="button" disabled={busy} onClick={()=>void changeImage(image.key,'delete')}>Excluir</button></div>)}</div>
 <div className="admin-product-upload"><label htmlFor="admin-product-file">Adicionar imagens</label><input id="admin-product-file" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={choose}/></div>
 {files.length>0&&<p>{files.length} arquivo(s) selecionado(s). Espaço restante: {Math.max(0,8-images.length)}.</p>}
 <button type="button" className="incident-action" disabled={busy||!files.length||images.length+files.length>8} onClick={()=>void upload()}>{busy?'Processando...':'Enviar imagens'}</button>
 {message&&<p role="status">{message}</p>}
 </section>;
}
