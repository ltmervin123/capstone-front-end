/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE'
}

export interface UserPermissions {
  dashboard: boolean;
  employees: boolean;
  attendance: boolean;
  payroll: boolean;
  leaves: boolean;
  talentAcquisition: boolean;
  aiSearch: boolean;
  reports: boolean;
  feedback?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
  createdAt: number;
  permissions?: UserPermissions;
  employeeId?: string;
}

export interface Employee {
  id: string; // Employee ID
  surname: string;
  firstName: string;
  middleName: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female' | 'Other';
  maritalStatus: string;
  religion: string;
  homeAddress: string;
  contactNumber: string;
  email: string;
  position: string;
  department: string;
  serviceDuration: string;
  employmentDate: string;
  bachelorsDegree: string;
  mastersStatus: string;
  doctorateStatus: string;
  mastersDegreeName: string;
  educationLevel: string;
  profilePicture?: string;
  checklist?: {
    personalInfo: { [key: string]: boolean };
    educational: { [key: string]: boolean };
    employment: { [key: string]: boolean };
    government: { [key: string]: boolean };
    training: { [key: string]: boolean };
    administrative: { [key: string]: boolean };
  };
  status: 'Active' | 'Inactive' | 'Retired';
  attachments?: {
    personalInfo?: { [key: string]: string };
    educational?: { [key: string]: string };
    employment?: { [key: string]: string };
    government?: { [key: string]: string };
    training?: { [key: string]: string };
    administrative?: { [key: string]: string };
  };
  functionalRate?: number;
  gasoline?: number;
  cashAdvance?: number;
  employeeShare?: number;
  updatedAt: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  cola: number; // Represents original Net Pay
  functionalRate: number; // e.g. Daily Functional Rate
  daysWorked: number; // e.g. Number of days worked in the period
  cashAdvance: number; // Cash Advance balance subtracted 
  gasoline: number; // Gasoline allowance added
  employeeShare: number; // Government & premium share deduction
  otherDeductions: number; // Other arbitrary deductions
}

export enum LeaveType {
  LEAVE_CREDITS = 'Leave Credits',
  MATERNITY = 'Maternity Leave',
  VAWC = 'Leave for Victims of VAW-C',
  PATERNITY = 'Paternity Leave',
  SOLO_PARENT = 'Solo Parents Leave',
  STUDY = 'Study Leave',
  SPECIAL = 'Special Leave',
  AUTHORIZED_ABSENCE = 'Authorized Absence',
  AUTHORIZED_UNDERTIME = 'Authorized Undertime',
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePosition?: string;
  employeeDepartment?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  timeFrom?: string;
  timeTo?: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
}

export enum ApplicantStatus {
  APPLIED = 'Applied',
  INTERVIEWING = 'Interviewing',
  OFFERED = 'Offered',
  HIRED = 'Accepted/Hired',
  REJECTED = 'Rejected'
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  LATE = 'Late',
  ABSENT = 'Absent',
  ON_LEAVE = 'On Leave'
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  timeIn: string;
  timeOut: string;
  status: AttendanceStatus;
  remarks: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department?: string;
  status: ApplicantStatus;
  appliedDate: string;
  resumeUrl?: string;
  notes?: string;
}

export interface FeedbackItem {
  id: string;
  senderUserId?: string;
  senderName: string;
  senderEmail: string;
  senderEmployeeId?: string;
  senderProfilePicture?: string;
  category: string;
  subject: string;
  message: string;
  isAnonymous: boolean;
  status: 'New' | 'Under Review' | 'Resolved';
  adminResponse?: string;
  employeeNotified?: boolean;
  hasUnreadNotification?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export const DEPARTMENTS = [
  'Office of the President',
  'School Administrator / Graduate School',
  'Accounting /Finance Department',
  'Quality Assurance Office',
  'Director for Academic Affairs',
  'CEAS',
  'CIT',
  'CBA',
  'CHM',
  'CCJE',
  'DSA',
  'Basic Education',
  'Registrar',
  'Research, Planning, & Extension',
  'NORMI Bookstore',
  'GSO',
  'Library',
  'Clinic',
  'Guidance',
  'Scholarship',
  'TVED',
  'MIS',
  'Admission and Testing',
  'DPO'
];
