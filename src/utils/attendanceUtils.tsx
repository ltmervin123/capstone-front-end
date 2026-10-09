import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { AttendanceStatus } from '../types/types';

export const getStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case AttendanceStatus.LATE:
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case AttendanceStatus.ABSENT:
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case AttendanceStatus.ON_LEAVE:
      return 'bg-purple-50 text-purple-800 border-purple-200';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
};

export const formatAttendanceTime = (value: string | undefined): string => {
  if (!value?.trim()) return '--';

  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)/);
  if (!match) return value;

  const hours24 = Number(match[1]);
  const minutes = match[2];
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
};

export const getStatusIcon = (status: AttendanceStatus): React.ReactNode => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return <CheckCircle2 size={13} className="text-emerald-700" />;
    case AttendanceStatus.LATE:
      return <Clock size={13} className="text-amber-800" />;
    case AttendanceStatus.ABSENT:
      return <XCircle size={13} className="text-rose-700" />;
    case AttendanceStatus.ON_LEAVE:
      return <AlertCircle size={13} className="text-purple-700" />;
    default:
      return null;
  }
};
