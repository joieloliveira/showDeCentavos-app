import { AdminHomePanel } from '@/components/admin/AdminHomePanel';
export const metadata = { title: 'Administração | Central de operações' };
export default function Page() { return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Administração</span><h1>Central de operações</h1><p>Acesse os módulos administrativos do Show de Centavos.</p></div><AdminHomePanel /></div>; }
