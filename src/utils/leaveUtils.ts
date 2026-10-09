import { LeaveType, type LeaveRecord } from '../types/types';

export const TOTAL_LEAVE_LIMIT = 15;

export function leaveDays(leave: LeaveRecord): number {
  if (leave.numberOfDays > 0) return leave.numberOfDays;
  if (!leave.startDate || !leave.endDate) return 1;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const diff =
    Math.ceil(
      Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  return Number.isNaN(diff) ? 1 : diff;
}

export function leaveTypeBadgeClass(type: LeaveType): string {
  switch (type) {
    case LeaveType.LEAVE_CREDITS:
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200/60';
    case LeaveType.MATERNITY:
    case LeaveType.VAWC:
      return 'bg-rose-50 text-rose-800 border border-rose-200/60';
    case LeaveType.PATERNITY:
    case LeaveType.SOLO_PARENT:
      return 'bg-blue-50 text-blue-800 border border-blue-200/60';
    case LeaveType.STUDY:
    case LeaveType.SPECIAL:
      return 'bg-purple-50 text-purple-800 border border-purple-200/60';
    default:
      return 'bg-amber-50 text-amber-800 border border-amber-200/60';
  }
}
