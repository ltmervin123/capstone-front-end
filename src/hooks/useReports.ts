import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  type ReportFilterParams,
} from '../services/reportService';

export const REPORT_QUERY_KEYS = {
  employment: (filters?: ReportFilterParams) => ['reports', 'employment', filters] as const,
  promotion: (filters?: ReportFilterParams) => ['reports', 'promotion', filters] as const,
  attendance: (filters?: ReportFilterParams) => ['reports', 'attendance', filters] as const,
  filters: () => ['reports', 'filters'] as const,
};

export function useEmploymentReportQuery(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.employment(filters),
    queryFn: () => reportService.getEmploymentReport(filters),
  });
}

export function usePromotionReportQuery(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.promotion(filters),
    queryFn: () => reportService.getPromotionReport(filters),
  });
}

export function useAttendanceReportQuery(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.attendance(filters),
    queryFn: () => reportService.getAttendanceReport(filters),
  });
}

export function useReportFiltersQuery() {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.filters(),
    queryFn: () => reportService.getReportFilters(),
  });
}
