import { Role } from "../types/types";
import type {
  Employee,
  User,
  AuditLog,
  PayrollRecord,
  LeaveRecord,
  FeedbackItem,
} from "../types/types";

const STORAGE_KEYS = {
  EMPLOYEES: 'normi_hr_employees',
  USERS: 'normi_hr_users',
  LOGS: 'normi_hr_logs',
  CURRENT_USER: 'normi_hr_session',
  PAYROLL: 'normi_hr_payroll',
  LEAVES: 'normi_hr_leaves',
  APPLICANTS: 'normi_hr_applicants',
  ATTENDANCE: 'normi_hr_attendance',
  FEEDBACK: 'normi_hr_feedback'
};

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  username: 'admin',
  email: 'admin@normi.edu.ph',
  password: 'AdminPassword123!',
  role: Role.ADMIN,
  isActive: true,
  isApproved: true,
  createdAt: Date.now(),
  permissions: {
    dashboard: true,
    employees: true,
    attendance: true,
    payroll: true,
    leaves: true,
    talentAcquisition: true,
    aiSearch: true,
    reports: true
  }
};

const INITIAL_HR: User = {
  id: 'hr-1',
  username: 'hr_personnel',
  email: 'hr@normi.edu.ph',
  password: 'HrPassword123!',
  role: Role.HR,
  isActive: true,
  isApproved: true,
  createdAt: Date.now(),
  permissions: {
    dashboard: true,
    employees: true,
    attendance: true,
    payroll: false,
    leaves: true,
    talentAcquisition: true,
    aiSearch: false,
    reports: false
  }
};

const INITIAL_EMPLOYEE: User = {
  id: 'emp-user-1',
  username: 'juan_delacruz',
  email: 'juan.delacruz@normi.edu.ph',
  password: 'EmpPassword123!',
  role: Role.EMPLOYEE,
  isActive: true,
  isApproved: true,
  createdAt: Date.now(),
  employeeId: 'EMP001',
  permissions: {
    dashboard: true,
    employees: false,
    attendance: true,
    payroll: true,
    leaves: true,
    talentAcquisition: false,
    aiSearch: false,
    reports: false
  }
};

const INITIAL_PENDING: User = {
  id: 'pending-1',
  username: 'maria_clara',
  email: 'maria.clara@normi.edu.ph',
  password: 'ClaraPassword123!',
  role: Role.HR,
  isActive: true,
  isApproved: false,
  createdAt: Date.now(),
  permissions: {
    dashboard: true,
    employees: true,
    attendance: false,
    payroll: false,
    leaves: false,
    talentAcquisition: true,
    aiSearch: false,
    reports: false
  }
};

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

  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = data ? JSON.parse(data) : [INITIAL_ADMIN, INITIAL_HR, INITIAL_EMPLOYEE];
    return users;
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 1000))); // Cap logs
  },

  // Session
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      storageService.addLog(user.username, 'Logged in');
    } else {
      const current = storageService.getCurrentUser();
      if (current) storageService.addLog(current.username, 'Logged out');
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Payroll
  getPayroll: (): PayrollRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PAYROLL);
    if (!data) return [];
    
    const records = JSON.parse(data);
    return records.map((p: any) => {
      const functionalRate = p.functionalRate !== undefined ? Number(p.functionalRate) : 1500;
      const daysWorked = p.daysWorked !== undefined ? Number(p.daysWorked) : 22;
      const cashAdvance = p.cashAdvance !== undefined ? Number(p.cashAdvance) : 0;
      const gasoline = p.gasoline !== undefined ? Number(p.gasoline) : 0;
      const employeeShare = p.employeeShare !== undefined ? Number(p.employeeShare) : 1200;
      const otherDeductions = p.otherDeductions !== undefined ? Number(p.otherDeductions) : 300;
      
      const basicSalary = p.basicSalary !== undefined ? Number(p.basicSalary) : (functionalRate * daysWorked);
      const allowances = p.allowances !== undefined ? Number(p.allowances) : 3000;
      const deductions = p.deductions !== undefined ? Number(p.deductions) : (cashAdvance + employeeShare + otherDeductions);
      
      // Net Pay
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
  getApplicants: (): any[] => {
    const data = localStorage.getItem(STORAGE_KEYS.APPLICANTS);
    return data ? JSON.parse(data) : [];
  },

  // Attendance
  getAttendance: (): any[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },

  saveAttendance: (record: any) => {
    const attendance = storageService.getAttendance();
    const index = attendance.findIndex(a => a.id === record.id);
    if (index >= 0) {
      attendance[index] = record;
    } else {
      attendance.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  },

  // Feedback Inbox
  getFeedback: (): FeedbackItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (!data) return [];
    return JSON.parse(data);
  },

  saveFeedback: (item: FeedbackItem) => {
    const feedbackList = storageService.getFeedback();
    const index = feedbackList.findIndex(f => f.id === item.id);
    if (index >= 0) {
      feedbackList[index] = { ...item, updatedAt: Date.now() };
    } else {
      feedbackList.unshift({ ...item, updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbackList));
    storageService.addLog(item.senderName || 'System', `Submitted feedback`, `Subject: ${item.subject}`);
  },

  deleteFeedback: (id: string) => {
    const feedbackList = storageService.getFeedback().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbackList));
    storageService.addLog('System', `Deleted feedback item`, `ID: ${id}`);
  },

  // Initialization
  initData: () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([INITIAL_ADMIN, INITIAL_HR, INITIAL_EMPLOYEE, INITIAL_PENDING]));
    } else {
      let existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      let modified = false;
      
      const adminIdx = existing.findIndex((u: any) => u.username === 'admin');
      if (adminIdx >= 0 && !existing[adminIdx].password) {
        existing[adminIdx].password = 'AdminPassword123!';
        modified = true;
      }
      const hrIdx = existing.findIndex((u: any) => u.username === 'hr_personnel');
      if (hrIdx >= 0 && !existing[hrIdx].password) {
        existing[hrIdx].password = 'HrPassword123!';
        modified = true;
      }
      
      // If employee_sample exists, migrate to juan_delacruz
      const sampleIdx = existing.findIndex((u: any) => u.username === 'employee_sample');
      if (sampleIdx >= 0) {
        existing = existing.filter((u: any) => u.username !== 'employee_sample');
        modified = true;
      }

      if (!existing.some((u: any) => u.username === 'juan_delacruz')) {
        existing.push(INITIAL_EMPLOYEE);
        modified = true;
      }

      // Ensure juan_delacruz has the employeeId, role, and permissions updated
      const jIdx = existing.findIndex((u: any) => u.username === 'juan_delacruz');
      if (jIdx >= 0 && (!existing[jIdx].employeeId || existing[jIdx].role !== Role.EMPLOYEE || !existing[jIdx].permissions?.payroll)) {
        existing[jIdx] = INITIAL_EMPLOYEE;
        modified = true;
      }

      if (!existing.some((u: any) => u.username === 'maria_clara')) {
        existing.push(INITIAL_PENDING);
        modified = true;
      }
      
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existing));
      }
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      const mockEmployees: Employee[] = [
        {
          id: 'EMP001',
          surname: 'Dela Cruz',
          firstName: 'Juan',
          middleName: 'Protacio',
          dateOfBirth: '1985-05-15',
          sex: 'Male',
          maritalStatus: 'Married',
          religion: 'Catholic',
          homeAddress: '123 Sampaguita St, Manila',
          contactNumber: '09123456789',
          email: 'juan.delacruz@normi.edu.ph',
          position: 'Senior Developer',
          department: 'MIS',
          serviceDuration: '16 Years',
          employmentDate: '2010-01-10',
          bachelorsDegree: 'BSIT',
          mastersStatus: 'Graduated',
          doctorateStatus: 'Ongoing',
          mastersDegreeName: 'MS in Information Technology',
          educationLevel: 'Post Graduate',
          status: 'Active',
          updatedAt: Date.now()
        },
        {
          id: 'EMP002',
          surname: 'Rizal',
          firstName: 'Jose',
          middleName: 'Mercado',
          dateOfBirth: '1990-12-30',
          sex: 'Male',
          maritalStatus: 'Single',
          religion: 'Catholic',
          homeAddress: '456 Narra St, Quezon City',
          contactNumber: '09987654321',
          email: 'jose.rizal@normi.edu.ph',
          position: 'HR Specialist',
          department: 'Quality Assurance Office',
          serviceDuration: '11 Years',
          employmentDate: '2015-06-20',
          bachelorsDegree: 'BSBA HRDM',
          mastersStatus: 'Graduating',
          doctorateStatus: 'Discontinue',
          mastersDegreeName: 'MBA',
          educationLevel: 'Post Graduate',
          status: 'Active',
          updatedAt: Date.now()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(mockEmployees));
    }

    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL)) {
      const mockPayroll: PayrollRecord[] = [
        { 
          id: 'PAY-001', 
          employeeId: 'EMP001', 
          employeeName: 'Juan Dela Cruz', 
          month: 'May', 
          year: 2026, 
          functionalRate: 2000,
          daysWorked: 22,
          basicSalary: 44000, 
          allowances: 3000, 
          gasoline: 1500,
          cashAdvance: 1000,
          employeeShare: 1200,
          otherDeductions: 300,
          deductions: 2500, 
          cola: 46000 
        },
        { 
          id: 'PAY-002', 
          employeeId: 'EMP002', 
          employeeName: 'Jose Rizal', 
          month: 'May', 
          year: 2026, 
          functionalRate: 1700,
          daysWorked: 22,
          basicSalary: 37400, 
          allowances: 3000, 
          gasoline: 1000,
          cashAdvance: 0,
          employeeShare: 1200,
          otherDeductions: 200,
          deductions: 1400, 
          cola: 40000 
        },
      ];
      localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(mockPayroll));
    }

    if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
      const mockLeaves = [
        { id: 'LV-001', employeeId: 'EMP001', employeeName: 'Juan Dela Cruz', type: 'Vacation', startDate: '2026-05-10', endDate: '2026-05-15', status: 'Approved', reason: 'Family vacation' },
        { id: 'LV-002', employeeId: 'EMP002', employeeName: 'Jose Rizal', type: 'Sick', startDate: '2026-05-06', endDate: '2026-05-07', status: 'Pending', reason: 'Fever' },
      ];
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(mockLeaves));
    }

    if (!localStorage.getItem(STORAGE_KEYS.APPLICANTS)) {
      const mockApplicants = [
        { id: 'APP-001', name: 'Maria Clara', email: 'maria@example.com', phone: '0917-123-4567', position: 'HR Manager', status: 'Applied', appliedDate: '2026-05-01' },
        { id: 'APP-002', name: 'Andres Bonifacio', email: 'andres@example.com', phone: '0918-765-4321', position: 'IT Support', status: 'Interviewing', appliedDate: '2026-05-03' },
      ];
      localStorage.setItem(STORAGE_KEYS.APPLICANTS, JSON.stringify(mockApplicants));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      const mockAttendance = [
        { id: 'ATT-001', employeeId: 'EMP001', employeeName: 'Juan Dela Cruz', date: '2026-05-10', timeIn: '08:00', timeOut: '17:00', status: 'Present', remarks: 'On time' },
        { id: 'ATT-002', employeeId: 'EMP002', employeeName: 'Jose Rizal', date: '2026-05-10', timeIn: '08:15', timeOut: '17:00', status: 'Late', remarks: 'Late by 15 mins' },
      ];
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(mockAttendance));
    }

    if (!localStorage.getItem(STORAGE_KEYS.FEEDBACK)) {
      const mockFeedback: FeedbackItem[] = [
        {
          id: 'FB-101',
          senderUserId: 'emp-user-1',
          senderName: 'Juan Dela Cruz',
          senderEmail: 'juan.delacruz@normi.edu.ph',
          senderEmployeeId: 'EMP001',
          category: 'Leave Inquiry',
          subject: 'Inquiry regarding Vacation Leave Credits Balance',
          message: 'Good day HR team! I submitted a vacation leave request for next month. Could you please verify my remaining annual leave credits balance?',
          isAnonymous: false,
          status: 'New',
          createdAt: Date.now() - 3600000 * 12
        },
        {
          id: 'FB-102',
          senderName: 'Anonymous Employee',
          senderEmail: 'anonymous@normi.edu.ph',
          category: 'Workplace Suggestion',
          subject: 'Air Conditioning Maintenance in Faculty Lounge 2',
          message: 'Kindly request maintenance check for AC unit in Faculty Lounge 2. Thank you!',
          isAnonymous: true,
          status: 'Under Review',
          adminResponse: 'Maintenance request forwarded to GSO department on July 25.',
          createdAt: Date.now() - 3600000 * 48
        }
      ];
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(mockFeedback));
    }
  }
};
