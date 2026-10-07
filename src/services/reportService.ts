import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

export interface ReportFilterParams {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface EmploymentReportRecord {
  id: string;
  employeeNumber: string;
  surname: string;
  firstName: string;
  middleName?: string | null;
  fullName: string;
  departmentId: string;
  department: string;
  position: string;
  employmentDate: string;
  serviceDuration: string;
  status: string;
  educationLevel: string;
}

export interface EmploymentReportData {
  metrics: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    retiredEmployees: number;
    retentionRate: number;
    growthRate: number;
    recentHires: number;
  };
  charts: {
    departmentDistribution: Array<{ name: string; count: number; pct: number }>;
    tenureDistribution: Array<{ range: string; count: number }>;
    statusDistribution: Array<{ status: string; count: number; fill: string }>;
  };
  records: EmploymentReportRecord[];
}

export interface PromotionReportRecord {
  id: string;
  employeeId: string;
  employeeNumber: string;
  surname: string;
  firstName: string;
  fullName: string;
  department: string;
  previousPosition: string;
  promotedPosition: string;
  effectiveDate: string;
  promotionYear: string;
  year: number;
  promotionStatus: string;
  rationale: string;
  approvedBy: string | null;
}

export interface PromotionReportData {
  metrics: {
    thisYearCount: number;
    nextYearCount: number;
    totalEvaluated: number;
    approvedCount: number;
    pendingCount: number;
  };
  charts: {
    yearlyPipeline: Array<{ year: string; approved: number; pending: number; total: number }>;
    departmentBreakdown: Array<{ department: string; count: number }>;
  };
  records: PromotionReportRecord[];
}

export interface AttendanceReportRecord {
  id: string;
  employeeNumber: string;
  surname: string;
  firstName: string;
  fullName: string;
  departmentId: string;
  department: string;
  position: string;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  totalLogs: number;
  punctualityRate: number;
  attendanceRate: number;
  performanceRating: string;
}

export interface AttendanceReportData {
  metrics: {
    avgPunctuality: number;
    attendanceRate: number;
    totalChecked: number;
    lates: number;
    presents: number;
    absents: number;
    leaves: number;
  };
  charts: {
    statusDistribution: Array<{ name: string; count: number; fill: string }>;
    timeseriesTrend: Array<{
      date: string;
      present: number;
      late: number;
      absent: number;
      onLeave: number;
      punctualityRate: number;
    }>;
  };
  records: AttendanceReportRecord[];
}

export interface ReportFilterOptions {
  departments: Array<{ id: string; name: string }>;
  dateBounds: {
    earliestAttendance: string | null;
    latestAttendance: string | null;
    earliestEmployment: string | null;
    latestEmployment: string | null;
  };
}

function buildQueryString(params?: ReportFilterParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.departmentId) searchParams.append('departmentId', params.departmentId);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.search) searchParams.append('search', params.search);

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const reportService = {
  async getEmploymentReport(filters?: ReportFilterParams): Promise<EmploymentReportData> {
    const qs = buildQueryString(filters);
    const res = await apiRequest<ApiSuccessResponse<EmploymentReportData>>(`/reports/employment${qs}`);
    return res.data;
  },

  async getPromotionReport(filters?: ReportFilterParams): Promise<PromotionReportData> {
    const qs = buildQueryString(filters);
    const res = await apiRequest<ApiSuccessResponse<PromotionReportData>>(`/reports/promotions${qs}`);
    return res.data;
  },

  async getAttendanceReport(filters?: ReportFilterParams): Promise<AttendanceReportData> {
    const qs = buildQueryString(filters);
    const res = await apiRequest<ApiSuccessResponse<AttendanceReportData>>(`/reports/attendance${qs}`);
    return res.data;
  },

  async getReportFilters(): Promise<ReportFilterOptions> {
    const res = await apiRequest<ApiSuccessResponse<ReportFilterOptions>>('/reports/filters');
    return res.data;
  },
};
