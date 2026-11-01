import { apiClient } from '@/services/api/api-client';
import { API_ENDPOINTS } from '@/services/api/api-endpoints';

import type { AuthSession, AuthUser } from '../types/auth.types';
import type { LoginInput, RegisterInput } from '../types/auth.schemas';

export interface AuthRepository {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: Omit<RegisterInput, 'confirmPassword'>): Promise<AuthSession>;
  /** Revokes the refresh token server-side. Never throws: signing out must always work locally. */
  logout(refreshToken: string | null): Promise<void>;
  me(): Promise<AuthUser>;
  /** Emails a reset code. Always succeeds for a well-formed address, whether or not an account exists. */
  forgotPassword(email: string): Promise<void>;
  resetPassword(input: { email: string; code: string; password: string }): Promise<void>;
  /** Permanently deletes the signed-in account and all its data. */
  deleteAccount(password: string): Promise<void>;
}

export const authService: AuthRepository = {
  login: async ({ email, password }) =>
    (await apiClient.post<AuthSession>(API_ENDPOINTS.auth.login, { email, password })).data,

  register: async ({ name, email, password }) =>
    (await apiClient.post<AuthSession>(API_ENDPOINTS.auth.register, { name, email, password }))
      .data,

  logout: async (refreshToken) => {
    if (!refreshToken) return;
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout, { refreshToken });
    } catch {
      // Offline or already expired: the local session is cleared regardless.
    }
  },

  forgotPassword: async (email) => {
    await apiClient.post(API_ENDPOINTS.auth.forgotPassword, { email });
  },

  resetPassword: async ({ email, code, password }) => {
    await apiClient.post(API_ENDPOINTS.auth.resetPassword, { email, code, password });
  },

  deleteAccount: async (password) => {
    await apiClient.post(API_ENDPOINTS.auth.deleteAccount, { password });
  },

  me: async () => (await apiClient.get<{ user: AuthUser }>(API_ENDPOINTS.auth.me)).data.user,
};
