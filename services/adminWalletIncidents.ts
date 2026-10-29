import { api } from '@/services/api';

export type Incident = {
  _id: string;
  deposit: string;
  user: string;
  provider: 'mercadopago';
  providerOrderId: string;
  providerStatus: 'refunded' | 'charged_back';
  resolution: 'review_required' | 'resolved';
  lastObservedAt: string;
  createdAt: string;
};
export type IncidentList = {
  incidents: Incident[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
export type IncidentDetail = {
  incident: Incident;
  deposit: null | {
    id: string; amountCents: number; status: string; provider: string;
    providerOrderId: string; providerPaymentId: string | null;
    processedAt: string | null; createdAt: string;
  };
  user: null | { id: string; name: string; email: string; isActive: boolean };
};
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
export async function listAdminWalletIncidents(token: string, page: number, providerStatus: string, resolution: string) {
  const { data } = await api.get<IncidentList>('/admin/wallet/incidents', {
    headers: headers(token), params: { page, limit: 20, ...(providerStatus && { providerStatus }), ...(resolution && { resolution }) },
  });
  if (!Array.isArray(data?.incidents) || !data.pagination) throw new Error('Resposta de incidentes inválida.');
  return data;
}
export async function getAdminWalletIncident(token: string, id: string) {
  const { data } = await api.get<IncidentDetail>(`/admin/wallet/incidents/${encodeURIComponent(id)}`, {
    headers: headers(token),
  });
  if (!data?.incident?._id) throw new Error('Detalhes do incidente inválidos.');
  return data;
}
