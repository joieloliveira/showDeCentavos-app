import { AdminFulfillmentsPanel } from '@/components/admin/AdminFulfillmentsPanel';
export const metadata = { title: 'Administração | Arremates e entregas' };
export default function Page() { return <div className="site-container page-content"><div className="page-heading"><span className="eyebrow">Administração · Entregas</span><h1>Arremates e entregas</h1><p>Acompanhe os pagamentos e o andamento dos produtos arrematados.</p></div><AdminFulfillmentsPanel /></div>; }
