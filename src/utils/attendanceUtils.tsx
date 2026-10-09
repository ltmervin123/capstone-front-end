import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { AttendanceStatus } from '../types/types';

export const getStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return 'bg-green-100 text-green-700 border-green-200';
    case AttendanceStatus.LATE:
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case AttendanceStatus.ABSENT:
      return 'bg-red-100 text-red-700 border-red-200';
    case AttendanceStatus.ON_LEAVE:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
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
      return <CheckCircle2 size={12} />;
    case AttendanceStatus.LATE:
      return <Clock size={12} />;
    case AttendanceStatus.ABSENT:
      return <XCircle size={12} />;
    case AttendanceStatus.ON_LEAVE:
      return <AlertCircle size={12} />;
    default:
      return null;
  }
};
