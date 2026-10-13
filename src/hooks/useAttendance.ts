import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type CreateAttendancePayload } from '../services/attendanceService';
import { useAuthStore } from '../stores/authStore';
import { invalidateAttendanceRelated } from '../lib/queryInvalidations';

export const attendanceQueryKey = (userId?: string) => [userId ?? '', 'attendance'] as const;

export function useAttendanceQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: attendanceQueryKey(userId),
    queryFn: () => attendanceService.listAttendance(),
    enabled: !!userId,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (payload: CreateAttendancePayload) => attendanceService.createAttendance(payload),
    onSuccess: () => {
      invalidateAttendanceRelated(queryClient, userId);
    },
  });
}

