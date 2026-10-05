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
      return 'bg-green-50 text-green-850';
    case LeaveType.MATERNITY:
    case LeaveType.VAWC:
      return 'bg-rose-50 text-rose-850';
    case LeaveType.PATERNITY:
    case LeaveType.SOLO_PARENT:
      return 'bg-blue-50 text-blue-850';
    case LeaveType.STUDY:
    case LeaveType.SPECIAL:
      return 'bg-purple-50 text-purple-850';
    default:
      return 'bg-amber-50 text-amber-850';
  }
}
