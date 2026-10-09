import React from 'react';
import { useCurrentUser } from '../../hooks/useAuth';
import { Role } from '../../types/types';
import { EmployeeAttendanceSection } from '../../components/EmployeeAttendanceSection';
import { NonEmployeeAttendanceSection } from '../../components/NonEmployeeAttendanceSection';

export const AttendanceRecords: React.FC = () => {
  const currentUser = useCurrentUser();
  const isHrUser = currentUser?.role === Role.ADMIN || currentUser?.role === Role.HR;

  if (isHrUser) {
    return <NonEmployeeAttendanceSection />;
  }

  return <EmployeeAttendanceSection />;
};
