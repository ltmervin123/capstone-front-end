import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type CreateAttendancePayload } from '../services/attendanceService';

export const ATTENDANCE_QUERY_KEY = ['attendance'] as const;

export function useAttendanceQuery() {
  return useQuery({
    queryKey: ATTENDANCE_QUERY_KEY,
    queryFn: () => attendanceService.listAttendance(),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAttendancePayload) => attendanceService.createAttendance(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
    },
  });
}
