import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  type ReportFilterParams,
} from '../services/reportService';
import { useAuthStore } from '../stores/authStore';

export const reportQueryKeys = {
  employment: (userId?: string, filters?: ReportFilterParams) => [userId ?? '', 'reports', 'employment', filters] as const,
  promotion: (userId?: string, filters?: ReportFilterParams) => [userId ?? '', 'reports', 'promotion', filters] as const,
  attendance: (userId?: string, filters?: ReportFilterParams) => [userId ?? '', 'reports', 'attendance', filters] as const,
  filters: (userId?: string) => [userId ?? '', 'reports', 'filters'] as const,
};

export function useEmploymentReportQuery(filters?: ReportFilterParams) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: reportQueryKeys.employment(userId, filters),
    queryFn: () => reportService.getEmploymentReport(filters),
    enabled: !!userId,
  });
}

export function usePromotionReportQuery(filters?: ReportFilterParams) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: reportQueryKeys.promotion(userId, filters),
    queryFn: () => reportService.getPromotionReport(filters),
    enabled: !!userId,
  });
}

export function useAttendanceReportQuery(filters?: ReportFilterParams) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: reportQueryKeys.attendance(userId, filters),
    queryFn: () => reportService.getAttendanceReport(filters),
    enabled: !!userId,
  });
}

export function useReportFiltersQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: reportQueryKeys.filters(userId),
    queryFn: () => reportService.getReportFilters(),
    enabled: !!userId,
  });
}

