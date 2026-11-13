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
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'A API demorou para responder. Verifique sua conexão e tente novamente.';
    }
    if (!error.response) return 'Não foi possível conectar à API. Verifique sua conexão e se o backend está em execução.';
    if (error.response.status === 401) return 'Sua sessão expirou ou não é válida. Faça login novamente.';
    if (error.response.status >= 500) return 'O servidor está temporariamente indisponível. Tente novamente em instantes.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    return typeof message === 'string' && message.trim() ? message : 'Não foi possível concluir a solicitação.';
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}

export async function forgotPasswordRequest(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
}
export async function resetPasswordRequest(token: string, password: string) {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
  return data;
}

export async function googleLoginRequest(credential: string) {
  const { data } = await api.post<LoginResponse>('/auth/google', { credential });
  if (!data.token || !data.user?.id) throw new Error('Resposta de autenticação Google inválida.');
  return data;
}
