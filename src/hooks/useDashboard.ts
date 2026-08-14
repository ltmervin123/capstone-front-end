import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

export function useDashboardQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardService.getSummary(),
    enabled: options?.enabled ?? true,
  });
}
