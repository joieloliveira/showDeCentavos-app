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

export type FinancialIncidentAudit = {
  _id: string;
  actor: string | null;
  source?: 'admin' | 'system';
  fromStatus: FinancialIncidentStatus;
  toStatus: FinancialIncidentStatus;
  note: string;
  createdAt: string;
};

export async function updateAdminFinancialIncident(
  token: string, incidentId: string, status: 'investigating' | 'resolved', note: string
) {
  const { data } = await api.patch<{ incident: FinancialIncident }>(
    `/admin/financial/incidents/${encodeURIComponent(incidentId)}`,
    { status, note }, { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.incident;
}

export async function listAdminFinancialIncidentAudit(token: string, incidentId: string) {
  const { data } = await api.get<{ items: FinancialIncidentAudit[] }>(
    `/admin/financial/incidents/${encodeURIComponent(incidentId)}/audit`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!data || !Array.isArray(data.items)) throw new Error('Resposta inválida ao consultar auditoria.');
  return data.items;
}
