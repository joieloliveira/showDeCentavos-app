'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const submit = async ({ email, password }: LoginFormValues) => {
    setApiError('');
    try {
      await login(email, password);
      const next = params.get('next');
      router.replace(next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/wallet');
    } catch (error) { setApiError(getApiError(error)); }
  };
  return <div className="panel form-panel"><span className="eyebrow">Bem-vindo de volta</span><h1>Entre na sua conta</h1><p>Use seu e-mail e senha cadastrados no Show de Centavos.</p>
    {params.get('registered') === '1' && <p className="notice">Conta criada com sucesso! Agora faça seu login.</p>}
    <form onSubmit={handleSubmit(submit)} noValidate>
      <label className="field"><span>E-mail</span><input type="email" autoComplete="email" placeholder="voce@exemplo.com" {...register('email')} />{errors.email && <div className="field-error">{errors.email.message}</div>}</label>
      <label className="field"><span>Senha</span><input type="password" autoComplete="current-password" placeholder="Sua senha" {...register('password')} />{errors.password && <div className="field-error">{errors.password.message}</div>}</label>
      {apiError && <p className="field-error" role="alert">{apiError}</p>}
      <button className="btn-primary full-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'}</button>
    </form><p className="center-note">Ainda não tem conta? <Link href="/register">Cadastre-se</Link></p></div>;
}
