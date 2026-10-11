import { useState, useMemo } from 'react';
import type { Employee } from '../../../../types/types';

export function useEmployeeDirectory(employees: Employee[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = `${emp.firstName} ${emp.surname} ${emp.id}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDept =
        filterDept === 'All' || emp.department === filterDept;
      const matchesStatus =
        filterStatus === 'All' || emp.status === filterStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, filterDept, filterStatus, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filterDept,
    setFilterDept,
    filterStatus,
    setFilterStatus,
    filteredEmployees,
  };
}
