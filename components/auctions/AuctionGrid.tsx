'use client';
import { AuctionCard } from './AuctionCard';
import { useDataSite } from '@/contexts/DataSiteContext';
const filters=['Todos','Ao vivo','Em breve','Games','Tecnologia','Áudio','Acessórios','Informática','Casa'];
export function AuctionGrid(){const {filter,setFilter,visibleAuctions}=useDataSite();return <><div className="filters">{filters.map((f)=><button key={f} type="button" onClick={()=>setFilter(f)} className={`filter-chip ${filter===f?'selected':''}`}>{f}</button>)}</div><div className="auction-grid">{visibleAuctions.map((a)=><AuctionCard key={a.id} auction={a}/>)}</div>{!visibleAuctions.length&&<p className="empty-state">Nenhum leilão nesta categoria.</p>}</>}
