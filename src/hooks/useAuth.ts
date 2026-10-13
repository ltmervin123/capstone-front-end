import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { LoginFormValues } from '../features/auth/login.schema';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/types';

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function useInitializeAuth() {
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: () => authService.restoreSession(),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (sessionQuery.isPending) {
      return;
    }

    setUser(sessionQuery.data ?? null);
    setInitialized(true);
  }, [sessionQuery.isPending, sessionQuery.data, setUser, setInitialized]);

  return sessionQuery;
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginFormValues) => authService.login(credentials),
    onSuccess: (user: User) => {
      queryClient.clear();
      setUser(user);
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, user);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}


export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(payload),
  });
}
