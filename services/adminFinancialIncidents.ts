import { api } from '@/services/api';

export type FinancialIncidentStatus = 'pending' | 'investigating' | 'resolved';
export type FinancialIncident = {
  _id: string;
  order: string;
  provider: string;
  providerOrderId: string;
  reason: string;
  status: FinancialIncidentStatus;
  occurrences: number;
  lastSeenAt: string;
  firstSeenAt: string;
};
export type FinancialIncidentList = {
  page: number;
  limit: number;
  total: number;
  items: FinancialIncident[];
};
export async function listAdminFinancialIncidents(token: string, page: number, status: '' | FinancialIncidentStatus) {
  const { data } = await api.get<FinancialIncidentList>('/admin/financial/incidents', {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, limit: 20, ...(status ? { status } : {}) },
  });
  if (!data || !Array.isArray(data.items) || typeof data.total !== 'number') {
    throw new Error('Resposta inválida ao consultar incidentes financeiros.');
  }
  return data;
}
