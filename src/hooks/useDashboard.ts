import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';

export const dashboardQueryKey = (userId?: string) => [userId ?? '', 'dashboard'] as const;

export function useDashboardQuery(options?: { enabled?: boolean }) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: dashboardQueryKey(userId),
    queryFn: () => dashboardService.getSummary(),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

