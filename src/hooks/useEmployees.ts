import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  type CreateEmployeeAttachment,
  type CreateEmployeePayload,
  type EmployeeDocumentLabel,
} from '../services/employeeService';
import { useAuthStore } from '../stores/authStore';
import { invalidateEmployeeRelated } from '../lib/queryInvalidations';

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

