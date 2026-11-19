import { DeliveryAuditDemo } from '@/components/admin/DeliveryAuditDemo';

export const metadata = { title: 'Demonstração | Auditoria de entregas' };

export default function Page() {
  return <div className="site-container page-content">
    <div className="page-heading">
      <span className="eyebrow">Administração · Demonstração isolada</span>
      <h1>Auditoria de entregas — demonstração</h1>
      <p>Exemplo visual com dados fictícios. Não utiliza a API ou o banco de dados.</p>
    </div>
    <DeliveryAuditDemo />
  </div>;
}
