import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
export const metadata: Metadata = {title:{default:'Show de Centavos | Leilões com emoção',template:'%s | Show de Centavos'},description:'Acompanhe leilões e descubra uma nova experiência. Plataforma em desenvolvimento.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Providers><Header/><main>{children}</main><Footer/></Providers></body></html>}
