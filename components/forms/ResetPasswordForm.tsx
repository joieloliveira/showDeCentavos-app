'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { resetPasswordRequest, getApiError } from '@/services/auth';

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não conferem.'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
      setPassword('');
      setConfirm('');
    } catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  };
  return <div className="panel form-panel">
    <span className="eyebrow">Segurança da conta</span>
    <h1>Redefinir senha</h1>
    {done ? <p className="notice" role="status">Senha alterada com sucesso. Agora você pode entrar na sua conta.</p> :
      !token ? <p className="field-error" role="alert">Link inválido. Solicite uma nova recuperação de senha.</p> :
      <form onSubmit={submit}>
        <p>Escolha uma nova senha para sua conta.</p>
        <label className="field"><span>Nova senha</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label className="field"><span>Confirme a nova senha</span><input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="btn-primary full-btn" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Redefinir senha'}</button>
      </form>}
    <p className="center-note"><Link href={done ? '/login' : '/forgot-password'}>{done ? 'Ir para login' : 'Solicitar novo link'}</Link></p>
  </div>;
}
