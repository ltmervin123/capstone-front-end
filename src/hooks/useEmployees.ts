import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  type CreateEmployeeAttachment,
  type CreateEmployeePayload,
  type EmployeeDocumentLabel,
} from '../services/employeeService';
import type { CreatePromotionPayload } from '../types/types';
import { useAuthStore } from '../stores/authStore';
import {
  domainKeys,
  invalidateEmployeeRelated,
  invalidatePromotionRelated,
} from '../lib/queryInvalidations';

export const employeesQueryKey = (userId?: string) => [userId ?? '', 'employees'] as const;

export function useEmployeesQuery(options?: { enabled?: boolean }) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: employeesQueryKey(userId),
    queryFn: () => employeeService.listEmployees(),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: {
      payload: CreateEmployeePayload;
      profilePicture?: File | null;
      attachments?: CreateEmployeeAttachment[];
    }) => employeeService.createEmployee(params),
    onSuccess: () => {
      invalidateEmployeeRelated(queryClient, userId);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: {
      employeeNumber: string;
      payload: CreateEmployeePayload;
      profilePicture?: File | null;
      attachments?: CreateEmployeeAttachment[];
      removeProfilePicture?: boolean;
      removedDocuments?: EmployeeDocumentLabel[];
    }) => employeeService.updateEmployee(params),
    onSuccess: () => {
      invalidateEmployeeRelated(queryClient, userId);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (employeeNumber: string) => employeeService.deleteEmployee(employeeNumber),
    onSuccess: () => {
      invalidateEmployeeRelated(queryClient, userId);
    },
  });
}

export function useEmployeePromotionsQuery(
  employeeNumber?: string,
  options?: { enabled?: boolean }
) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: domainKeys.promotions(employeeNumber ?? '', userId),
    queryFn: () => employeeService.listPromotions(employeeNumber!),
    enabled: !!userId && !!employeeNumber && (options?.enabled ?? true),
  });
}

export function usePromoteEmployeeMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: {
      employeeNumber: string;
      payload: CreatePromotionPayload;
      document?: File | null;
    }) => employeeService.promoteEmployee(params),
    onSuccess: (_data, variables) => {
      invalidatePromotionRelated(queryClient, userId, variables.employeeNumber);
    },
  });
}

export function useApprovePromotionMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: { employeeNumber: string; promotionId: string }) =>
      employeeService.approvePromotion(params),
    onSuccess: (_data, variables) => {
      invalidatePromotionRelated(queryClient, userId, variables.employeeNumber);
    },
  });
}

export function useDeletePromotionMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: { employeeNumber: string; promotionId: string }) =>
      employeeService.deletePendingPromotion(params),
    onSuccess: (_data, variables) => {
      invalidatePromotionRelated(queryClient, userId, variables.employeeNumber);
    },
  });
}

