import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Banknote,
  CalendarDays,
  UserPlus,
  MessageSquare,
  Bot,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { Role, type User, type UserPermissions } from '../types/types';

export interface RouteSubItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface RouteItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  permissionKey?: keyof UserPermissions;
  subItems?: RouteSubItem[];
  showInSidebar?: (user: User) => boolean;
}

export const ROUTE_MANIFEST: RouteItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.HR],
    permissionKey: 'dashboard',
    showInSidebar: (user: User) => user.role !== Role.EMPLOYEE,
  },
  {
    id: 'administration',
    path: '/administration',
    label: 'Administration',
    icon: ShieldCheck,
    roles: [Role.ADMIN],
    showInSidebar: (user: User) => user.role === Role.ADMIN,
  },
  {
    id: 'employees',
    path: '/employees',
    label: 'Employee Manager',
    icon: Users,
    roles: [Role.ADMIN, Role.HR],
    permissionKey: 'employees',
  },
  {
    id: 'attendance',
    path: '/attendance',
    label: 'Attendance',
    icon: Clock,
    permissionKey: 'attendance',
  },
  {
    id: 'payroll',
    path: '/payroll',
    label: 'Payroll',
    icon: Banknote,
    permissionKey: 'payroll',
  },
  {
    id: 'leaves',
    path: '/leaves',
    label: 'Leave Records',
    icon: CalendarDays,
    permissionKey: 'leaves',
  },
  {
    id: 'talent-acquisition',
    path: '/talent-acquisition',
    label: 'Talent Acquisition',
    icon: UserPlus,
    roles: [Role.ADMIN, Role.HR],
    permissionKey: 'talentAcquisition',
  },
  {
    id: 'feedback',
    path: '/feedback',
    label: 'Feedback Inbox',
    icon: MessageSquare,
    roles: [Role.ADMIN, Role.HR],
    permissionKey: 'feedback',
    showInSidebar: (user: User) =>
      !user.employeeId && user.role !== Role.EMPLOYEE,
  },
  {
    id: 'ai-chat',
    path: '/ai-chat',
    label: 'AI Chat',
    icon: Bot,
    roles: [Role.ADMIN, Role.HR],
    permissionKey: 'aiSearch',
  },
  {
    id: 'reports',
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: [Role.ADMIN, Role.HR],
    permissionKey: 'reports',
  },
];
