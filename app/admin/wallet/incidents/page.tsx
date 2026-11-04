import { WalletIncidentPanel } from '@/components/admin/WalletIncidentPanel';

export const metadata = { title: 'Administração | Incidentes financeiros' };

export default function AdminWalletIncidentsPage() {
  return <div className="site-container page-content">
    <div className="page-heading">
      <span className="eyebrow">Administração · Carteira</span>
      <h1>Incidentes financeiros</h1>
      <p>Consulte reembolsos e contestações que exigem análise.</p>
    </div>
    <WalletIncidentPanel />
  </div>;
}
