'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Clipboard, Clock3, QrCode, ShieldAlert } from 'lucide-react';
import { amountToCents, pixDepositSchema, type PixDepositFormValues } from '@/schemas/wallet';
import { money } from '@/utils/format';
const suggestions = ['10,00', '20,00', '50,00', '100,00'];
export function PixDepositPreview() {
  const [previewCents, setPreviewCents] = useState<number | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PixDepositFormValues>({
    resolver: zodResolver(pixDepositSchema), defaultValues: { amount: '10,00' },
  });
  const amount = watch('amount');
  return <section className="panel" style={{ marginTop: 24 }}>
    <span className="eyebrow">Prévia de funcionalidade</span>
    <h2 style={{ fontSize: 24, margin: '10px 0' }}>Recarregar com PIX</h2>
    <p style={{ color: '#7d8392', lineHeight: 1.7 }}>Prepare o valor da recarga. Nenhum pagamento será criado nesta etapa.</p>
    <div className="notice"><ShieldAlert size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }}/> Modo de demonstração: sem QR Code válido, sem transferência e sem alteração de saldo.</div>
    <form onSubmit={handleSubmit(({ amount: validAmount }) => setPreviewCents(amountToCents(validAmount)))} noValidate>
      <label className="field" style={{ maxWidth: 400 }}><span>Valor da recarga (R$)</span>
        <input type="text" inputMode="decimal" placeholder="Ex.: 20,00" aria-invalid={!!errors.amount} {...register('amount')} />
        {errors.amount && <div className="field-error" role="alert">{errors.amount.message}</div>}
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {suggestions.map((value) => <button key={value} type="button" className={amount === value ? 'filter-chip selected' : 'filter-chip'} onClick={() => { setValue('amount', value, { shouldValidate: true }); setPreviewCents(null); }}>{money(amountToCents(value))}</button>)}
      </div>
      <button type="submit" className="btn-primary">Visualizar recarga <Clipboard size={17}/></button>
    </form>
    {previewCents !== null && <div style={{ marginTop: 24, padding: 24, border: '1px dashed #d7dce6', borderRadius: 12, background: '#fafbfe' }}>
      <h3 style={{ marginTop: 0 }}><Check size={18} style={{ display: 'inline', marginRight: 8, color: '#24734e' }}/> Valor validado: {money(previewCents)}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6d7585' }}><QrCode size={35}/><div><strong>QR Code indisponível no modo demonstração</strong><p style={{ margin: '6px 0' }}>Após a habilitação, o código virá diretamente do Mercado Pago.</p></div></div>
      <p style={{ color: '#6d7585', display: 'flex', alignItems: 'center', gap: 8 }}><Clock3 size={16}/> Status: aguardando habilitação da integração</p>
      <button className="btn-secondary" type="button" disabled>Gerar cobrança PIX (indisponível)</button>
    </div>}
  </section>;
}
