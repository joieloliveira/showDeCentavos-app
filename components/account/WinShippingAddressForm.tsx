'use client';

import { useState } from 'react';

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

export function WinShippingAddressForm() {
  const [address, setAddress] = useState<Address>(initial);
  return <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
    <h3 style={{ margin: '0 0 8px' }}>Endereço de entrega</h3>
    <p style={{ color: '#64748b', marginBottom: 12 }}>Formulário em preparação. Não informe dados pessoais reais nesta etapa: o envio está desabilitado.</p>
    <form onSubmit={event => event.preventDefault()} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {fields.map(field => <label key={field.key} style={{ display: 'grid', gap: 4 }}>
          <span>{field.label}{field.required ? ' *' : ''}</span>
          <input
            type="text"
            value={address[field.key]}
            onChange={event => setAddress(previous => ({ ...previous, [field.key]: event.target.value }))}
            maxLength={field.maxLength}
            required={field.required}
            autoComplete="off"
            placeholder={field.key === 'zipCode' ? '00000-000' : field.key === 'state' ? 'PA' : undefined}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
          />
        </label>)}
      </div>
      <button type="submit" disabled style={{ padding: '10px 16px', borderRadius: 8, cursor: 'not-allowed', opacity: 0.55, justifySelf: 'start' }}>
        Salvar endereço (em breve)
      </button>
    </form>
  </section>;
}
