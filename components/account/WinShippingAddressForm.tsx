'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/services/auth';

type Address = {
  recipientName: string; phone: string; zipCode: string; street: string;
  number: string; complement: string; neighborhood: string; city: string; state: string;
};
const initial: Address = {
  recipientName: '', phone: '', zipCode: '', street: '', number: '',
  complement: '', neighborhood: '', city: '', state: ''
};
const fields: { key: keyof Address; label: string; required?: boolean; maxLength: number }[] = [
  { key: 'recipientName', label: 'Nome do destinatário', required: true, maxLength: 120 },
  { key: 'phone', label: 'Telefone com DDD', required: true, maxLength: 20 },
  { key: 'zipCode', label: 'CEP', required: true, maxLength: 9 },
  { key: 'street', label: 'Rua / avenida', required: true, maxLength: 160 },
  { key: 'number', label: 'Número', required: true, maxLength: 20 },
  { key: 'complement', label: 'Complemento', maxLength: 120 },
  { key: 'neighborhood', label: 'Bairro', required: true, maxLength: 100 },
  { key: 'city', label: 'Cidade', required: true, maxLength: 100 },
  { key: 'state', label: 'UF', required: true, maxLength: 2 }
];

export function WinShippingAddressForm({ auctionId, getToken, initialAddress, editable }: { auctionId: string; getToken: () => string | null; initialAddress: Address | null; editable: boolean }) {
  const [address, setAddress] = useState<Address>(() => initialAddress ? { ...initial, ...initialAddress } : initial);
  useEffect(() => { setAddress(initialAddress ? { ...initial, ...initialAddress } : initial); setMessage(''); }, [initialAddress, auctionId]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const enabled = process.env.NEXT_PUBLIC_AUCTION_ADDRESS_COLLECTION_ENABLED === 'true';
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || !editable || pending) return;
    const token = getToken();
    if (!token) { setMessage('Sua sessão expirou. Faça login novamente.'); return; }
    setPending(true); setMessage('');
    try {
      const { data } = await api.put<{ shippingAddress: Address }>(`/auctions/my/wins/${encodeURIComponent(auctionId)}/address`, address, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.shippingAddress) throw new Error('Resposta de cadastro incompleta. Atualize o histórico antes de tentar novamente.');
      setAddress({ ...initial, ...data.shippingAddress });
      setMessage('Endereço salvo com sucesso.');
    } catch (error) { setMessage(getApiError(error)); }
    finally { setPending(false); }
  }
  if (!enabled) {
    return <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
      <h3 style={{ margin: '0 0 8px' }}>Endereço de entrega</h3>
      <p style={{ color: '#64748b', margin: 0 }}>
        {initialAddress
          ? 'Endereço já registrado. A consulta e a edição de endereços estão temporariamente indisponíveis.'
          : 'O cadastro de endereço ainda não está disponível. Não é necessário informar dados pessoais nesta etapa.'}
      </p>
    </section>;
  }
  return <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
    <h3 style={{ margin: '0 0 8px' }}>Endereço de entrega</h3>
    <p style={{ color: '#64748b', marginBottom: 12 }}>{!editable ? 'Endereço disponível apenas para consulta: a entrega já foi iniciada.' : enabled ? 'Confira os dados antes de salvar.' : initialAddress ? 'Endereço já cadastrado. Edição temporariamente desabilitada.' : 'Formulário em preparação. Não informe dados pessoais reais nesta etapa: o envio está desabilitado.'}</p>
    <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {fields.map(field => <label key={field.key} style={{ display: 'grid', gap: 4 }}>
          <span>{field.label}{field.required ? ' *' : ''}</span>
          <input
            type="text"
            value={address[field.key]}
            onChange={event => { setAddress(previous => ({ ...previous, [field.key]: event.target.value })); setMessage(''); }}
            maxLength={field.maxLength}
            required={field.required}
            disabled={!editable || pending}
            autoComplete="off"
            placeholder={field.key === 'zipCode' ? '00000-000' : field.key === 'state' ? 'PA' : undefined}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
          />
        </label>)}
      </div>
      <button type="submit" disabled={!editable || pending} style={{ padding: '10px 16px', borderRadius: 8, cursor: pending || !editable ? 'not-allowed' : 'pointer', opacity: pending || !editable ? 0.55 : 1, justifySelf: 'start' }}>
        {pending ? 'Salvando...' : enabled ? 'Salvar endereço' : 'Salvar endereço (em breve)'}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  </section>;
}
