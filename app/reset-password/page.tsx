import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
export const metadata = { title: 'Redefinir senha' };
export default function ResetPasswordPage() {
  return <div className="site-container page-content"><Suspense fallback={<div className="panel form-panel">Carregando...</div>}><ResetPasswordForm /></Suspense></div>;
}
