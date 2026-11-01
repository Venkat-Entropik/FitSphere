import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authService } from '../services/auth.service';
import { startSession } from '../services/session';
import type { LoginInput, RegisterInput } from '../types/auth.schemas';

/** Sign in; on success the session becomes active and the route gate moves the user into the app. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (session) => startSession(session, queryClient),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<RegisterInput, 'confirmPassword'>) => authService.register(input),
    onSuccess: (session) => startSession(session, queryClient),
  });
}
