import type { QueryClient } from '@tanstack/react-query';

/**
 * Domain query key definitions scoped to the authenticated user ID.
 * Defined centrally to avoid circular imports between hooks.
 */
export const domainKeys = {
  employees: (userId?: string) => [userId ?? '', 'employees'] as const,
  leaves: (userId?: string) => [userId ?? '', 'leaves'] as const,
  attendance: (userId?: string) => [userId ?? '', 'attendance'] as const,
  applicants: (userId?: string) => [userId ?? '', 'applicants'] as const,
  dashboard: (userId?: string) => [userId ?? '', 'dashboard'] as const,
  reports: (userId?: string) => [userId ?? '', 'reports'] as const,
  payroll: (userId?: string) => [userId ?? '', 'payroll'] as const,
  adminUsers: (userId?: string) => [userId ?? '', 'admin', 'users'] as const,
  adminAuditLogs: (userId?: string) => [userId ?? '', 'admin', 'audit-logs'] as const,
};

/**
 * Invalidates employee queries and all downstream dependent queries:
 * - Dashboard metrics (Total, Active, Retired staff, Department & Education breakdowns)
 * - Reports (Employment report, Promotion report, report filters)
 * - Admin audit logs
 */
export function invalidateEmployeeRelated(queryClient: QueryClient, userId?: string): void {
  void queryClient.invalidateQueries({ queryKey: domainKeys.employees(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.dashboard(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.reports(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminAuditLogs(userId) });
}

/**
 * Invalidates leave queries and downstream dependent queries:
 * - Leaves list
 * - Dashboard metrics (Active leaves today, leave status and type breakdowns)
 * - Reports (Attendance report with on-leave statuses)
 * - Admin audit logs
 */
export function invalidateLeaveRelated(queryClient: QueryClient, userId?: string): void {
  void queryClient.invalidateQueries({ queryKey: domainKeys.leaves(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.dashboard(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.reports(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminAuditLogs(userId) });
}

/**
 * Invalidates attendance queries and downstream dependent queries:
 * - Attendance records
 * - Dashboard metrics (Present, Late, Absent on attendance date)
 * - Reports (Attendance report)
 * - Payroll records (batch calculation relies on latest attendance logs)
 * - Admin audit logs
 */
export function invalidateAttendanceRelated(queryClient: QueryClient, userId?: string): void {
  void queryClient.invalidateQueries({ queryKey: domainKeys.attendance(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.dashboard(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.reports(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.payroll(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminAuditLogs(userId) });
}

/**
 * Invalidates applicant queries and downstream dependent queries:
 * - Applicants list
 * - Dashboard metrics (Recruitment pipeline stages: applied, screening, interview, hired, rejected)
 * - Admin audit logs
 */
export function invalidateApplicantRelated(queryClient: QueryClient, userId?: string): void {
  void queryClient.invalidateQueries({ queryKey: domainKeys.applicants(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.dashboard(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminAuditLogs(userId) });
}

/**
 * Invalidates payroll queries and downstream dependent queries:
 * - Payroll runs and records
 * - Admin audit logs
 */
export function invalidatePayrollRelated(queryClient: QueryClient, userId?: string): void {
  void queryClient.invalidateQueries({ queryKey: domainKeys.payroll(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminAuditLogs(userId) });
}

/**
 * Invalidates admin management queries:
 * - Admin user accounts list
 * - Admin audit logs
 */
export function invalidateAdminRelated(queryClient: QueryClient, userId?: string): void {
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminUsers(userId) });
  void queryClient.invalidateQueries({ queryKey: domainKeys.adminAuditLogs(userId) });
}
