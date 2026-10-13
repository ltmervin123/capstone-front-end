import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveService, type CreateLeavePayload } from '../services/leaveService';
import { useAuthStore } from '../stores/authStore';

export const leavesQueryKey = (userId?: string) => [userId ?? '', 'leaves'] as const;

export function useLeavesQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: leavesQueryKey(userId),
    queryFn: () => leaveService.listLeaves(),
    enabled: !!userId,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => leaveService.createLeave(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leavesQueryKey(userId) });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (id: string) => leaveService.deleteLeave(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leavesQueryKey(userId) });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (id: string) => leaveService.rejectLeave(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leavesQueryKey(userId) });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (id: string) => leaveService.approveLeave(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leavesQueryKey(userId) });
    },
  });
}

