'use client';
import { CreditCard, History, ShieldCheck } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { money } from '@/utils/format';
export function WalletCards(){const {balanceCents}=useWallet();return <div className="steps"><div className="panel"><CreditCard color="#ff6a32"/><h3>Saldo disponível</h3><div className="detail-price">{balanceCents===null?'—':money(balanceCents)}</div><p className="retail">Sem dados de conta conectada.</p></div><div className="panel"><History color="#ff6a32"/><h3>Movimentações</h3><p>O histórico será mostrado após a integração autenticada com a API.</p></div><div className="panel"><ShieldCheck color="#ff6a32"/><h3>Recarga PIX</h3><p>Recurso temporariamente desativado até a conclusão dos testes e verificações jurídicas.</p><button type="button" className="btn-secondary" disabled style={{opacity:.6}}>Recarregar (em breve)</button></div></div>}
