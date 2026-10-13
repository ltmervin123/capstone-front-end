import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, type CreateStaffUserInput } from '../services/adminService';
import type { UserPermissions } from '../types/types';
import { useAuthStore } from '../stores/authStore';
import { invalidateAdminRelated } from '../lib/queryInvalidations';

export const adminUsersQueryKey = (userId?: string) => [userId ?? '', 'admin', 'users'] as const;
export const adminAuditLogsQueryKey = (userId?: string) => [userId ?? '', 'admin', 'audit-logs'] as const;

export function useAdminUsersQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: adminUsersQueryKey(userId),
    queryFn: () => adminService.listUsers(),
    enabled: !!userId,
  });
}

export function useAdminAuditLogsQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: adminAuditLogsQueryKey(userId),
    queryFn: () => adminService.listAuditLogs(),
    enabled: !!userId,
  });
}

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return () => {
    invalidateAdminRelated(queryClient, userId);
  };
}

export function useCreateStaffUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (payload: CreateStaffUserInput) => adminService.createStaffUser(payload),
    onSuccess: invalidate,
  });
}

export function useApproveUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => adminService.approveUser(id),
    onSuccess: invalidate,
  });
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (params: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(params.id, params.isActive),
    onSuccess: invalidate,
  });
}

export function useUpdateUserPermissions() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (params: { id: string; permissions: UserPermissions }) =>
      adminService.updateUserPermissions(params.id, params.permissions),
    onSuccess: invalidate,
  });
}

export function useUpdateUserPassword() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (params: { id: string; password: string }) =>
      adminService.updateUserPassword(params.id, params.password),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: invalidate,
  });
}
