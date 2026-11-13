'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWalletDeposit, type WalletDeposit } from '@/services/wallet';
import { getApiError } from '@/services/auth';
import { money } from '@/utils/format';

function formatDepositDate(value: string | null | undefined) {
  if (!value) return 'Data não disponível';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Data não disponível' : parsed.toLocaleString('pt-BR');
}

const statusLabels: Record<WalletDeposit['status'], string> = {
  pending: 'Aguardando pagamento', approved: 'Pagamento aprovado',
  failed: 'Pagamento falhou', cancelled: 'Pagamento cancelado',
};
export function PixDepositTracker() {
  const { getToken } = useAuth();
  const [depositId, setDepositId] = useState('');
  const [deposit, setDeposit] = useState<WalletDeposit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const query = async () => {
    const id = depositId.trim();
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      setDeposit(null); setError('Informe um identificador de depósito válido (24 caracteres hexadecimais).'); return;
    }
    const token = getToken();
    if (!token) { setDeposit(null); setError('Sessão expirada. Entre novamente.'); return; }
    setLoading(true); setError(null); setCopyStatus(''); setDeposit(null);
    try { setDeposit(await fetchWalletDeposit(token, id)); }
    catch (err: unknown) { setError(getApiError(err)); }
    finally { setLoading(false); }
  };
  return <section className="panel" style={{ marginTop: 24 }}>
    <span className="eyebrow">Consulta segura</span>
    <h2 style={{ fontSize: 24, margin: '10px 0' }}>Acompanhar depósito PIX</h2>
    <p style={{ color: '#7d8392', lineHeight: 1.7 }}>Consulte um depósito já existente pelo identificador. Esta consulta não cria cobrança, não reconcilia pagamentos e não modifica seu saldo.</p>
    <form onSubmit={(event) => { event.preventDefault(); void query(); }}>
      <label className="field" style={{ maxWidth: 500 }}><span>Identificador do depósito</span>
        <input value={depositId} onChange={(event) => { setDepositId(event.target.value); setDeposit(null); setError(null); }} placeholder="24 caracteres do MongoDB" maxLength={24} autoComplete="off" />
      </label>
      <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Consultando...' : 'Consultar status'}</button>
    </form>
    {error && <p role="alert" style={{ color: '#b43c3c', marginTop: 16 }}>{error}</p>}
    {deposit && <div aria-live="polite" style={{ marginTop: 22, padding: 20, border: '1px solid #d7dce6', borderRadius: 12 }}>
      <h3 style={{ marginTop: 0 }}>{statusLabels[deposit.status]}</h3>
      <p>Valor: <strong>{money(deposit.amountCents)}</strong></p>
      <p>Identificador: <code style={{ overflowWrap: 'anywhere' }}>{deposit.id}</code></p>
      <p>Provedor: {deposit.provider === 'mercadopago' ? 'Mercado Pago' : 'Teste manual'}</p>
      <p>Solicitado em: {formatDepositDate(deposit.createdAt)}</p>
      {deposit.processedAt && <p>Processado em: {formatDepositDate(deposit.processedAt)}</p>}
      {deposit.status === 'pending' && deposit.provider === 'mercadopago' && deposit.pix?.qrCode && <>
        <label className="field"><span>PIX copia e cola</span><textarea value={deposit.pix.qrCode} readOnly rows={3} style={{ width: '100%', maxWidth: 600 }} /></label>
        <button type="button" className="btn-secondary" onClick={() => { void navigator.clipboard.writeText(deposit.pix!.qrCode!).then(() => setCopyStatus('Código copiado.')).catch(() => setCopyStatus('Não foi possível copiar o código.')); }}>Copiar código PIX</button>
        {copyStatus && <p role="status">{copyStatus}</p>}
      </>}
      {deposit.status === 'pending' && deposit.provider === 'mercadopago' && deposit.pix?.qrCodeBase64 && /^[-A-Za-z0-9+/=]+$/.test(deposit.pix.qrCodeBase64) && <div style={{ marginTop: 16 }}><p>QR Code fornecido pelo Mercado Pago:</p><img alt="QR Code PIX do depósito" src={`data:image/png;base64,${deposit.pix.qrCodeBase64}`} width={220} height={220} /></div>}
      <button type="button" className="btn-secondary" style={{ marginTop: 16 }} disabled={loading} onClick={() => void query()}>Atualizar status</button>
    </div>}
  </section>;
}
