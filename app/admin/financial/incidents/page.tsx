import { FinancialIncidentPanel } from '@/components/admin/FinancialIncidentPanel';

export const metadata = { title: 'Administração | Reconciliação de cobranças' };

export default function AdminFinancialIncidentsPage() {
  return <div className="site-container page-content">
    <div className="page-heading">
      <span className="eyebrow">Administração · Financeiro</span>
      <h1>Reconciliação de cobranças</h1>
      <p>Acompanhe aprovações tardias e outras divergências de cobrança, sem executar operações financeiras.</p>
    </div>
    <FinancialIncidentPanel />
  </div>;
}
