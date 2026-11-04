'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/auth';

type GoogleCredential = { credential?: string };
type GoogleIdentity = {
  initialize: (options: { client_id: string; callback: (response: GoogleCredential) => void }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void;
};
declare global { interface Window { google?: { accounts?: { id?: GoogleIdentity } } } }
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
export function GoogleLoginButton() {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!clientId || !container.current) return;
    let cancelled = false;
    const initialize = () => {
      if (cancelled || !container.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) { setError('O Google não retornou uma credencial.'); return; }
          try {
            setError('');
            await loginWithGoogle(credential);
            const next = params.get('next');
            router.replace(next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/wallet');
          } catch (err) { setError(getApiError(err)); }
        },
      });
      container.current.replaceChildren();
      window.google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', width: 300 });
    };
    if (window.google?.accounts?.id) initialize();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initialize;
      script.onerror = () => { if (!cancelled) setError('Não foi possível carregar o login do Google.'); };
      document.head.appendChild(script);
      return () => { cancelled = true; script.remove(); };
    }
    return () => { cancelled = true; };
  }, [loginWithGoogle, params, router]);
  if (!clientId) return null;
  return <div><div ref={container} style={{ display: 'flex', justifyContent: 'center' }} />{error && <p className="field-error" role="alert">{error}</p>}</div>;
}
