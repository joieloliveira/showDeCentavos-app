import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';
export const metadata = { title: 'Entrar' };
export default function LoginPage() { return <div className="site-container page-content"><Suspense fallback={<div className="panel form-panel">Carregando formulário...</div>}><LoginForm/></Suspense></div>; }
