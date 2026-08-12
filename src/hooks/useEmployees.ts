import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  employeeService,
  type CreateEmployeeAttachment,
  type CreateEmployeePayload,
} from '../services/employeeService';

export const EMPLOYEES_QUERY_KEY = ['employees'] as const;

export function useEmployeesQuery() {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: () => employeeService.listEmployees(),
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
