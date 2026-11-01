'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerRequest, getApiError } from '@/services/auth';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
export function RegisterForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const submit = async ({ name, email, password }: RegisterFormValues) => {
    setApiError('');
    try {
      await registerRequest({ name, email, password });
      router.replace('/login?registered=1');
    } catch (error) { setApiError(getApiError(error)); }
  };
  return <div className="panel form-panel"><span className="eyebrow">Comece por aqui</span><h1>Crie sua conta</h1><p>Cadastre-se para acompanhar sua carteira e os leilões.</p>
    <form onSubmit={handleSubmit(submit)} noValidate>
      <label className="field"><span>Nome</span><input type="text" autoComplete="name" {...register('name')} />{errors.name && <div className="field-error">{errors.name.message}</div>}</label>
      <label className="field"><span>E-mail</span><input type="email" autoComplete="email" {...register('email')} />{errors.email && <div className="field-error">{errors.email.message}</div>}</label>
      <label className="field"><span>Senha</span><input type="password" autoComplete="new-password" {...register('password')} />{errors.password && <div className="field-error">{errors.password.message}</div>}</label>
      <label className="field"><span>Confirme a senha</span><input type="password" autoComplete="new-password" {...register('confirmPassword')} />{errors.confirmPassword && <div className="field-error">{errors.confirmPassword.message}</div>}</label>
      {apiError && <p className="field-error" role="alert">{apiError}</p>}
      <button className="btn-primary full-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando conta...' : 'Criar conta'}</button>
    </form><p className="center-note">Já tem conta? <Link href="/login">Entrar</Link></p></div>;
}
