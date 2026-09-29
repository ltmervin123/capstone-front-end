import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, type CreateStaffUserInput } from '../services/adminService';
import type { UserPermissions } from '../types/types';

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;
export const ADMIN_AUDIT_LOGS_QUERY_KEY = ['admin', 'audit-logs'] as const;

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => adminService.listUsers(),
  });
}

export function useAdminAuditLogsQuery() {
  return useQuery({
    queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY,
    queryFn: () => adminService.listAuditLogs(),
  });
}

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY });
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
