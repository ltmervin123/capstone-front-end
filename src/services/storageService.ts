import type {
  Employee,
  AuditLog,
  PayrollRecord,
  LeaveRecord,
  AttendanceRecord,
  Applicant,
} from "../types/types";

const STORAGE_KEYS = {
  EMPLOYEES: 'normi_hr_employees',
  LOGS: 'normi_hr_logs',
  PAYROLL: 'normi_hr_payroll',
  LEAVES: 'normi_hr_leaves',
  APPLICANTS: 'normi_hr_applicants',
  ATTENDANCE: 'normi_hr_attendance',
  FEEDBACK: 'normi_hr_feedback',
};

const LEGACY_AUTH_KEYS = ['normi_hr_users', 'normi_hr_session'];
const MOCK_DATA_MIGRATION_KEY = 'normi_hr_mock_cleared_v2';

/** Removes seeded mock accounts, sessions, and legacy demo data once per browser. */
export function clearLegacyMockDataOnce(): void {
  if (localStorage.getItem(MOCK_DATA_MIGRATION_KEY)) {
    return;
  }

  [...Object.values(STORAGE_KEYS), ...LEGACY_AUTH_KEYS].forEach((key) => {
    localStorage.removeItem(key);
  });

  localStorage.setItem(MOCK_DATA_MIGRATION_KEY, 'true');
}

export const storageService = {
  // Employees
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  },

  saveEmployee: (employee: Employee) => {
    const employees = storageService.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    if (index >= 0) {
      employees[index] = { ...employee, updatedAt: Date.now() };
    } else {
      employees.push({ ...employee, updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    storageService.addLog('System', `Saved employee record: ${employee.firstName} ${employee.surname} (${employee.id})`);
  },

  deleteEmployee: (id: string) => {
    const employees = storageService.getEmployees().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    storageService.addLog('System', `Deleted employee record: ${id}`);
  },

  // Logs
  getLogs: (): AuditLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: (username: string, action: string, details: string = '') => {
    const logs = storageService.getLogs();
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'system',
      username,
      action,
      details,
      timestamp: Date.now()
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 1000)));
  },

  // Payroll
  getPayroll: (): PayrollRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PAYROLL);
    if (!data) return [];

    const records = JSON.parse(data);
    return records.map((p: PayrollRecord) => {
      const functionalRate = p.functionalRate !== undefined ? Number(p.functionalRate) : 1500;
      const daysWorked = p.daysWorked !== undefined ? Number(p.daysWorked) : 22;
      const cashAdvance = p.cashAdvance !== undefined ? Number(p.cashAdvance) : 0;
      const gasoline = p.gasoline !== undefined ? Number(p.gasoline) : 0;
      const employeeShare = p.employeeShare !== undefined ? Number(p.employeeShare) : 1200;
      const otherDeductions = p.otherDeductions !== undefined ? Number(p.otherDeductions) : 300;

      const basicSalary = p.basicSalary !== undefined ? Number(p.basicSalary) : (functionalRate * daysWorked);
      const allowances = p.allowances !== undefined ? Number(p.allowances) : 3000;
      const deductions = p.deductions !== undefined ? Number(p.deductions) : (cashAdvance + employeeShare + otherDeductions);
      const cola = p.cola !== undefined ? Number(p.cola) : (basicSalary + allowances + gasoline - deductions);

      return {
        ...p,
        functionalRate,
        daysWorked,
        cashAdvance,
        gasoline,
        employeeShare,
        otherDeductions,
        basicSalary,
        allowances,
        deductions,
        cola
      };
    });
  },

  savePayroll: (record: PayrollRecord) => {
    const list = storageService.getPayroll();
    const index = list.findIndex(r => r.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(list));
    storageService.addLog('System', `Saved payroll record: ID ${record.id} for ${record.employeeName}`);
  },

  deletePayroll: (id: string) => {
    const list = storageService.getPayroll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(list));
    storageService.addLog('System', `Deleted payroll record: ID ${id}`);
  },

  // Leaves
  getLeaves: (): LeaveRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVES);
    return data ? JSON.parse(data) : [];
  },

  saveLeave: (record: LeaveRecord) => {
    const leaves = storageService.getLeaves();
    const index = leaves.findIndex(l => l.id === record.id);
    if (index >= 0) {
      leaves[index] = record;
    } else {
      leaves.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
    storageService.addLog('System', `Saved leave record: ID ${record.id} for ${record.employeeName} (${record.status})`);
  },

  deleteLeave: (id: string) => {
    const leaves = storageService.getLeaves().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
    storageService.addLog('System', `Deleted leave record: ID ${id}`);
  },

  // Talent Acquisition
  getApplicants: (): Applicant[] => {
    const data = localStorage.getItem(STORAGE_KEYS.APPLICANTS);
    return data ? JSON.parse(data) : [];
  },

  // Attendance
  getAttendance: (): AttendanceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },

  saveAttendance: (record: AttendanceRecord) => {
    const attendance = storageService.getAttendance();
    const index = attendance.findIndex((a) => a.id === record.id);
    if (index >= 0) {
      attendance[index] = record;
    } else {
      attendance.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  },
};
