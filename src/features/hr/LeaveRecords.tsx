import React from 'react';
import { useCurrentUser } from '../../hooks/useAuth';
import { Role } from '../../types/types';
import { EmployeeLeaveSection } from '../../components/EmployeeLeaveSection';
import { NonEmployeeLeaveSection } from '../../components/NonEmployeeLeaveSection';

export const LeaveRecords: React.FC = () => {
  const currentUser = useCurrentUser();
  const isHrUser =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.HR;

  if (isHrUser) {
    return <NonEmployeeLeaveSection />;
  }

  return <EmployeeLeaveSection />;
};
