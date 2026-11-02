
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPasswordRequest, getApiError } from '@/services/auth';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await forgotPasswordRequest(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel form-panel">
      <h1>Recuperar senha</h1>
      <p>Informe seu e-mail para receber um link de recuperação.</p>

      {message ? (
        <p className="notice" role="status">{message}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {error && <p className="field-error" role="alert">{error}</p>}

          <button className="btn-primary full-btn" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
      )}

      <p className="center-note">
        <Link href="/login">Voltar ao login</Link>
      </p>
    </div>
  );
}
