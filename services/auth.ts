import { AxiosError } from 'axios';
import { api } from '@/services/api';
export type AuthUser = { id: string; name: string; email: string; role: string; publicNickname?: string | null };
export type LoginResponse = { token: string; user: AuthUser };
export type RegisterResponse = { message: string; user: AuthUser };
export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  if (!data.token || !data.user?.id) throw new Error('Resposta de autenticação inválida.');
  return data;
}
export async function registerRequest(input: { name: string; email: string; password: string }) {
  const { data } = await api.post<RegisterResponse>('/auth/register', input);
  return data;
}
export async function meRequest(token: string) {
  const { data } = await api.get<{ user: AuthUser }>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.user;
}
export function getApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    return typeof message === 'string' ? message : 'Não foi possível concluir a solicitação.';
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}
