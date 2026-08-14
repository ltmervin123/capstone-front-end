import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

export interface DashboardNamedCount {
  name: string;
  count: number;
  pct: number;
  relativePct: number;
}

export interface DashboardEducationCount {
  level: string;
  count: number;
  pct: number;
}

export interface DashboardLeaveTypeCount {
  type: string;
  count: number;
  pct: number;
}

export interface DashboardSummary {
  generatedAt: string;
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    retiredEmployees: number;
    activeLeaves: number;
  };
  attendance: {
    dateText: string;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    total: number;
    presentPct: number;
    latePct: number;
    absentPct: number;
    onLeavePct: number;
  };
  departments: DashboardNamedCount[];
  leaves: {
    approved: number;
    pending: number;
    rejected: number;
    total: number;
    approvedPct: number;
    pendingPct: number;
    rejectedPct: number;
    types: DashboardLeaveTypeCount[];
  };
  education: DashboardEducationCount[];
  recruitment: {
    applied: number;
    interviewing: number;
    offered: number;
    rejected: number;
    total: number;
    appliedPct: number;
    interviewingPct: number;
    offeredPct: number;
    rejectedPct: number;
  };
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiRequest<ApiSuccessResponse<DashboardSummary>>('/dashboard');
    return response.data;
  },
};
