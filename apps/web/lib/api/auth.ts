import api from '../axios';
import type { AuthResponse, LoginPayload, RegisterPayload, AuthUser } from '../../types/auth';

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  me: () =>
    api.get<AuthUser>('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),

  acceptInvite: (token: string, password: string) =>
    api.post<AuthResponse>('/auth/accept-invite', { token, password }).then((r) => r.data),
};
