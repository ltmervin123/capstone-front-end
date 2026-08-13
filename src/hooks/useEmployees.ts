import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  type CreateEmployeeAttachment,
  type CreateEmployeePayload,
  type EmployeeDocumentLabel,
} from '../services/employeeService';

export const EMPLOYEES_QUERY_KEY = ['employees'] as const;

export function useEmployeesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: () => employeeService.listEmployees(),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      payload: CreateEmployeePayload;
      profilePicture?: File | null;
      attachments?: CreateEmployeeAttachment[];
    }) => employeeService.createEmployee(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

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
      void queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeNumber: string) => employeeService.deleteEmployee(employeeNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
  });
}
