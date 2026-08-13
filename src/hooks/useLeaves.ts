import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveService, type CreateLeavePayload } from '../services/leaveService';

export const LEAVES_QUERY_KEY = ['leaves'] as const;

export function useLeavesQuery() {
  return useQuery({
    queryKey: LEAVES_QUERY_KEY,
    queryFn: () => leaveService.listLeaves(),
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => leaveService.createLeave(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LEAVES_QUERY_KEY });
    },
  });
}
