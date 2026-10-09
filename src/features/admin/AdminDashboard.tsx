import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  History,
  Trash2,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Loader2,
  Activity,
  KeyRound,
  SlidersHorizontal,
  Lock,
  Mail,
  User as UserIcon,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import {
  useAdminAuditLogsQuery,
  useAdminUsersQuery,
  useApproveUser,
  useCreateStaffUser,
  useDeleteUser,
  useUpdateUserPassword,
  useUpdateUserPermissions,
  useUpdateUserStatus,
} from '../../hooks/useAdminUsers';
import { useCurrentUser } from '../../hooks/useAuth';
import { ApiRequestError } from '../../utils/apiClient';
import { Role, type User, type UserPermissions } from '../../types/types';
import { Logo } from '../../assets/common/Logo';
import { motion } from 'motion/react';

/**
 * Standard baseline permissions assigned to newly created HR staff accounts.
 */
const DEFAULT_HR_PERMISSIONS: UserPermissions = {
  dashboard: true,
  employees: true,
  attendance: true,
  payroll: false,
  leaves: true,
  talentAcquisition: true,
  aiSearch: false,
  reports: false,
};

/**
 * Metadata configuration for each permission module in the NMC HR system.
 */
interface PermissionModuleConfig {
  key: keyof UserPermissions;
  label: string;
  description: string;
}

const PERMISSION_MODULES: ReadonlyArray<PermissionModuleConfig> = [
  {
    key: 'dashboard',
    label: 'Dashboard Hub',
    description: 'Overview and system metrics',
  },
  {
    key: 'employees',
    label: 'Employee Directory',
    description: 'Staff profiles and employee records',
  },
  {
    key: 'attendance',
    label: 'Daily Time & Attendance',
    description: 'Time tracking, biometric logs, and DTR',
  },
  {
    key: 'payroll',
    label: 'Payroll & Compensation',
    description: 'Payroll runs, compensation, and slips',
  },
  {
    key: 'leaves',
    label: 'Leave Management',
    description: 'Leave requests, credits, and tracking',
  },
  {
    key: 'talentAcquisition',
    label: 'Talent Acquisition',
    description: 'Job openings and applicant pipeline',
  },
  {
    key: 'aiSearch',
    label: 'AI Chat',
    description: 'AI conversational assistant',
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    description: 'Institutional reports and data exports',
  },
];

type AdminTab = 'registry' | 'approvals' | 'logs';

export const AdminDashboard: React.FC = () => {
  // Authentication & Current Session
  const currentUser = useCurrentUser();

  // Queries & Server State
  const usersQuery = useAdminUsersQuery();
  const auditLogsQuery = useAdminAuditLogsQuery();

  // Mutations
  const createStaffUser = useCreateStaffUser();
  const approveUser = useApproveUser();
  const updateUserStatus = useUpdateUserStatus();
  const updateUserPermissions = useUpdateUserPermissions();
  const updateUserPassword = useUpdateUserPassword();
  const deleteUser = useDeleteUser();

  // Stable Data References
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const logs = useMemo(() => auditLogsQuery.data ?? [], [auditLogsQuery.data]);
  const listLoading = usersQuery.isPending;
  const actionBusy =
    createStaffUser.isPending ||
    approveUser.isPending ||
    updateUserStatus.isPending ||
    updateUserPermissions.isPending ||
    updateUserPassword.isPending ||
    deleteUser.isPending;

  const listError =
    usersQuery.error instanceof ApiRequestError
      ? usersQuery.error.message
      : usersQuery.error instanceof Error
        ? usersQuery.error.message
        : usersQuery.error
          ? 'Failed to load user accounts from the server.'
          : null;

  // Local UI State
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('registry');

  // Registry Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | Role>('All');

  // Audit Trail Log Search
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // New User Onboarding Modal State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false,
    permissions: { ...DEFAULT_HR_PERMISSIONS },
  });

  // Inline Permission Editing State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] =
    useState<UserPermissions | null>(null);

  // Password Reset Modal State
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  // Filter approved vs pending accounts
  const approvedUsers = useMemo(() => {
    return users.filter((u) => u.isApproved);
  }, [users]);

  const pendingUsers = useMemo(() => {
    return users.filter((u) => !u.isApproved);
  }, [users]);

  // Filter approved users list based on search and role filters
  const filteredApprovedUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return approvedUsers.filter((u) => {
      const matchSearch =
        !query ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      const matchRole = filterRole === 'All' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [approvedUsers, searchQuery, filterRole]);

  // Filter logs based on search query
  const filteredLogs = useMemo(() => {
    const query = logSearchQuery.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((l) => {
      return (
        l.username.toLowerCase().includes(query) ||
        l.action.toLowerCase().includes(query) ||
        (l.details ?? '').toLowerCase().includes(query)
      );
    });
  }, [logs, logSearchQuery]);

  // Error Message Formatter
  const mutationErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof ApiRequestError
      ? error.message
      : error instanceof Error
        ? error.message
        : fallback;

  // Toggle Account Active / Suspended Status
  const handleToggleStatus = async (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;
    setActionError(null);
    try {
      await updateUserStatus.mutateAsync({
        id: userId,
        isActive: !target.isActive,
      });
    } catch (error) {
      setActionError(
        mutationErrorMessage(error, 'Failed to update account status.')
      );
    }
  };

  // Approve Pending Registration
  const handleApprove = async (userId: string) => {
    setActionError(null);
    try {
      await approveUser.mutateAsync(userId);
    } catch (error) {
      setActionError(
        mutationErrorMessage(error, 'Failed to approve account registration.')
      );
    }
  };

  // Decline & Reject Pending Registration
  const handleDecline = async (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;
    const confirmed = window.confirm(
      `Decline and remove the registration request for "${target.username}"?`
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteUser.mutateAsync(userId);
    } catch (error) {
      setActionError(
        mutationErrorMessage(error, 'Failed to decline registration request.')
      );
    }
  };

  // Permanently Delete Staff User Account
  const handleDeleteUser = async (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      setActionError(
        'Security restriction: You cannot delete your own administrator account.'
      );
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete "${target.username}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteUser.mutateAsync(userId);
    } catch (error) {
      setActionError(mutationErrorMessage(error, 'Failed to delete account.'));
    }
  };

  // Create New Staff Account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (newUser.password.length < 6) {
      setActionError('Password must contain at least 6 characters.');
      return;
    }

    try {
      await createStaffUser.mutateAsync({
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.isAdmin ? 'ADMIN' : 'HR',
        permissions: newUser.isAdmin ? undefined : newUser.permissions,
      });
      setNewUser({
        username: '',
        email: '',
        password: '',
        isAdmin: false,
        permissions: { ...DEFAULT_HR_PERMISSIONS },
      });
      setIsAddingUser(false);
    } catch (error) {
      setActionError(
        mutationErrorMessage(error, 'Failed to create new user account.')
      );
    }
  };

  // Handle Permission Toggle for Inline Editor or Creation Form
  const handleInlinePermissionChange = (
    field: keyof UserPermissions,
    val: boolean
  ) => {
    if (editingUserId && editingPermissions) {
      setEditingPermissions({
        ...editingPermissions,
        [field]: val,
      });
    } else {
      setNewUser({
        ...newUser,
        permissions: {
          ...newUser.permissions,
          [field]: val,
        },
      });
    }
  };

  // Save Inline Permission Changes
  const handleSaveInlinePermissions = async (userId: string) => {
    if (!editingPermissions) return;
    setActionError(null);
    try {
      await updateUserPermissions.mutateAsync({
        id: userId,
        permissions: editingPermissions,
      });
      setEditingUserId(null);
      setEditingPermissions(null);
    } catch (error) {
      setActionError(
        mutationErrorMessage(error, 'Failed to update module permissions.')
      );
    }
  };

  // Close Password Modal & Reset Form
  const closePasswordModal = () => {
    setPasswordTarget(null);
    setResetPassword('');
    setConfirmResetPassword('');
  };

  // Reset User Password Handler
  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    setActionError(null);

    if (resetPassword.length < 6) {
      setActionError('New password must contain at least 6 characters.');
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      setActionError('Password confirmation does not match new password.');
      return;
    }

    try {
      await updateUserPassword.mutateAsync({
        id: passwordTarget.id,
        password: resetPassword,
      });
      closePasswordModal();
    } catch (error) {
      setActionError(
        mutationErrorMessage(error, 'Failed to update account password.')
      );
    }
  };

  // KPI Overview Cards modeled directly after Dashboard.tsx
  const statCards = [
    {
      label: 'Staff Registry',
      subtitle: 'Approved system accounts',
      value: approvedUsers.length,
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-800',
      tabKey: 'registry' as const,
    },
    {
      label: 'Registration Requests',
      subtitle:
        pendingUsers.length > 0 ? 'Action required' : 'All accounts processed',
      value: pendingUsers.length,
      icon: ShieldCheck,
      iconBg: 'bg-amber-50 text-amber-900',
      tabKey: 'approvals' as const,
    },
    {
      label: 'Audit Trail Records',
      subtitle: 'System activity events',
      value: logs.length,
      icon: History,
      iconBg: 'bg-blue-50 text-blue-800',
      tabKey: 'logs' as const,
    },
  ];

  // Tab switch options
  const adminTabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'registry', label: 'Staff Registry', count: approvedUsers.length },
    {
      id: 'approvals',
      label: 'Registration Requests',
      count: pendingUsers.length,
    },
    { id: 'logs', label: 'Audit Trail', count: logs.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ========================================================================= */}
      {/* SECTION 1: HEADER & SYSTEM STATUS                                         */}
      {/* ========================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              System Administration
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Access Governance & Security Controls
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <ShieldCheck size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  Administrator Portal
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {activeTab === 'registry' && (
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setIsAddingUser(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              aria-haspopup="dialog"
            >
              <Plus size={15} />
              <span>Add Staff User</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 2: SYSTEM ERROR & ALERT NOTIFICATIONS                             */}
      {/* ========================================================================= */}
      {(listError || actionError) && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-red-200 shadow-xs text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-red-50 text-red-700 rounded-lg shrink-0 mt-0.5">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="font-bold text-red-900">
                {listError ?? actionError}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Please check network connectivity or verify user privileges.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                void usersQuery.refetch();
                void auditLogsQuery.refetch();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Retry
            </button>
            {actionError && (
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: KEY METRICS & SYSTEM SNAPSHOT (MATCHING DASHBOARD.TSX CARDS)    */}
      {/* ========================================================================= */}
      <section
        aria-label="Key personnel metrics"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statCards.map((stat, i) => {
          return (
            <motion.div
              key={i}
              role="button"
              tabIndex={0}
              className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group "
            >
              <div
                className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
              >
                <stat.icon size={22} />
              </div>
              <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
                {stat.value}
              </h2>
              <p className="text-sm font-bold text-stone-800 mt-2">
                {stat.label}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
            </motion.div>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: SECTION HEADER & TAB CONTROLS (MATCHING DASHBOARD.TSX TABS)     */}
      {/* ========================================================================= */}
      <section aria-label="Administration controls" className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-amber-500" />
              Administrative Governance
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Manage authorized staff user accounts, configure module-level
              permissions, review registrations, and audit system activities.
            </p>
          </div>

          {/* Pill Tab Switcher matching Dashboard.tsx */}
          <div
            role="tablist"
            aria-label="Filter administration views"
            className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-green-900 text-amber-300 shadow-xs'
                      : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-amber-400 text-green-950'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* SECTION 5: TAB VIEW - STAFF USER REGISTRY                                */}
        {/* ======================================================================= */}
        {activeTab === 'registry' && (
          <div className="space-y-6">
            {/* 5A: Registry Search & Role Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search staff by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label="Clear search query"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 min-w-[200px]">
                <Filter className="text-emerald-800 shrink-0 ml-1" size={15} />
                <label htmlFor="filterRoleSelect" className="sr-only">
                  Filter by role
                </label>
                <select
                  id="filterRoleSelect"
                  value={filterRole}
                  onChange={(e) =>
                    setFilterRole(e.target.value as 'All' | Role)
                  }
                  className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none cursor-pointer transition-all"
                >
                  <option value="All">All Roles</option>
                  <option value={Role.ADMIN}>Administrators</option>
                  <option value={Role.HR}>HR Staff</option>
                  <option value={Role.EMPLOYEE}>Employees</option>
                </select>
              </div>
            </div>

            {/* 5B: Desktop User Table View */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200/80">
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        User Details
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Module Permissions
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Account Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider text-right"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {listLoading && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-green-900">
                            <Loader2
                              size={26}
                              className="animate-spin text-green-800"
                            />
                            <p className="text-xs font-medium text-stone-600">
                              Loading accounts...
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!listLoading &&
                      filteredApprovedUsers.map((u) => {
                        const isEditing = editingUserId === u.id;
                        const grantedCount = u.permissions
                          ? Object.values(u.permissions).filter(Boolean).length
                          : 0;

                        return (
                          <React.Fragment key={u.id}>
                            <tr className="hover:bg-stone-50/60 transition-colors group">
                              {/* User Avatar & Name */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                      u.role === Role.ADMIN
                                        ? 'bg-green-100 text-green-900 border border-green-200'
                                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                                    }`}
                                  >
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm text-green-950 truncate">
                                      {u.username}
                                    </p>
                                    <p className="text-[11px] text-stone-500 truncate">
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Module Permissions */}
                              <td className="px-6 py-4">
                                {u.role === Role.ADMIN ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200/60 text-green-900 text-xs font-semibold">
                                    <ShieldCheck
                                      size={13}
                                      className="text-emerald-700"
                                    />
                                    <span>Full Master Access</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1.5 max-w-md">
                                    <div className="flex flex-wrap gap-1">
                                      {grantedCount === 0 ? (
                                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                          No Modules Assigned
                                        </span>
                                      ) : (
                                        PERMISSION_MODULES.filter((mod) =>
                                          Boolean(u.permissions?.[mod.key])
                                        ).map((mod) => (
                                          <span
                                            key={mod.key}
                                            className="text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60"
                                          >
                                            {mod.label}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isEditing) {
                                          setEditingUserId(null);
                                          setEditingPermissions(null);
                                        } else {
                                          setEditingUserId(u.id);
                                          setEditingPermissions(
                                            u.permissions || {
                                              ...DEFAULT_HR_PERMISSIONS,
                                            }
                                          );
                                        }
                                      }}
                                      className="text-xs text-emerald-800 hover:text-green-950 font-semibold inline-flex items-center gap-1 self-start transition-colors cursor-pointer mt-0.5"
                                    >
                                      <SlidersHorizontal size={12} />
                                      <span>
                                        {isEditing
                                          ? 'Close Permissions'
                                          : 'Configure Permissions'}
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                    u.isActive
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                      : 'bg-rose-50 text-rose-800 border-rose-200/60'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  />
                                  {u.isActive ? 'Active' : 'Suspended'}
                                </span>
                              </td>

                              {/* Action Commands */}
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                  {(u.role === Role.HR ||
                                    u.role === Role.EMPLOYEE) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionError(null);
                                        setPasswordTarget(u);
                                        setResetPassword('');
                                        setConfirmResetPassword('');
                                      }}
                                      disabled={actionBusy}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors disabled:opacity-50"
                                      title={`Reset password for ${u.username}`}
                                    >
                                      <KeyRound size={12} />
                                      <span>Password</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleToggleStatus(u.id)
                                    }
                                    disabled={
                                      actionBusy || u.id === currentUser?.id
                                    }
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 ${
                                      u.isActive
                                        ? 'text-rose-700 hover:bg-rose-50 border border-rose-200/60'
                                        : 'text-emerald-800 hover:bg-emerald-50 border border-emerald-200/60'
                                    }`}
                                  >
                                    {u.isActive ? 'Suspend' : 'Activate'}
                                  </button>

                                  {u.id !== currentUser?.id && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleDeleteUser(u.id)
                                      }
                                      disabled={actionBusy}
                                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                      title={`Delete account for ${u.username}`}
                                      aria-label={`Delete account for ${u.username}`}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Inline Permission Editor Drawer */}
                            {isEditing && (
                              <tr className="bg-stone-50/70">
                                <td
                                  colSpan={4}
                                  className="px-6 py-4 border-t border-b border-stone-200/80"
                                >
                                  <div className="space-y-3 max-w-4xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <h5 className="text-xs font-bold text-green-950">
                                          Update Permissions: @{u.username}
                                        </h5>
                                        <p className="text-[11px] text-stone-500 font-medium">
                                          Select the workspaces and
                                          administrative tools this staff member
                                          is authorized to access
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingUserId(null);
                                            setEditingPermissions(null);
                                          }}
                                          className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleSaveInlinePermissions(
                                              u.id
                                            )
                                          }
                                          disabled={actionBusy}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-900 hover:bg-green-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                                        >
                                          {updateUserPermissions.isPending ? (
                                            <Loader2
                                              size={12}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            <Check size={12} />
                                          )}
                                          <span>Save Permissions</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-stone-200/60">
                                      {PERMISSION_MODULES.map((item) => (
                                        <label
                                          key={item.key}
                                          className="flex items-center gap-2 p-2 rounded-lg border border-stone-100 hover:border-emerald-300 cursor-pointer text-xs font-medium select-none text-green-950 bg-stone-50/50 transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              editingPermissions?.[item.key]
                                            )}
                                            onChange={(e) =>
                                              handleInlinePermissionChange(
                                                item.key,
                                                e.target.checked
                                              )
                                            }
                                            className="w-4 h-4 rounded text-green-900 border-stone-300 focus:ring-green-900 accent-green-900 cursor-pointer"
                                          />
                                          <span className="truncate">
                                            {item.label}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                    {!listLoading && filteredApprovedUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-stone-400">
                            <Search size={32} className="text-stone-300" />
                            <p className="font-bold text-sm text-stone-700">
                              No users match your search criteria
                            </p>
                            <p className="text-xs text-stone-500">
                              Try adjusting your search terms or role filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5C: Mobile User Card List View */}
              <div className="md:hidden divide-y divide-stone-100">
                {listLoading && (
                  <div className="p-8 text-center text-green-900 flex flex-col items-center gap-2">
                    <Loader2
                      size={26}
                      className="animate-spin text-green-800"
                    />
                    <p className="text-xs font-medium text-stone-600">
                      Loading accounts...
                    </p>
                  </div>
                )}

                {!listLoading &&
                  filteredApprovedUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const grantedCount = u.permissions
                      ? Object.values(u.permissions).filter(Boolean).length
                      : 0;

                    return (
                      <div key={u.id} className="p-4 space-y-3 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.role === Role.ADMIN
                                  ? 'bg-green-100 text-green-900 border border-green-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-green-950 truncate">
                                {u.username}
                              </p>
                              <p className="text-[11px] text-stone-500 truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                : 'bg-rose-50 text-rose-800 border-rose-200/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>

                        <div>
                          {u.role === Role.ADMIN ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-50 border border-green-200/60 text-green-900 text-[11px] font-semibold">
                              <ShieldCheck
                                size={12}
                                className="text-emerald-700"
                              />
                              <span>Full Master Access</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap gap-1">
                                {grantedCount === 0 ? (
                                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    No Modules Assigned
                                  </span>
                                ) : (
                                  PERMISSION_MODULES.filter((mod) =>
                                    Boolean(u.permissions?.[mod.key])
                                  ).map((mod) => (
                                    <span
                                      key={mod.key}
                                      className="text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60"
                                    >
                                      {mod.label}
                                    </span>
                                  ))
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingUserId(null);
                                    setEditingPermissions(null);
                                  } else {
                                    setEditingUserId(u.id);
                                    setEditingPermissions(
                                      u.permissions || {
                                        ...DEFAULT_HR_PERMISSIONS,
                                      }
                                    );
                                  }
                                }}
                                className="text-xs text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer pt-0.5"
                              >
                                <SlidersHorizontal size={11} />
                                <span>
                                  {isEditing
                                    ? 'Close Permissions'
                                    : 'Configure Permissions'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Editor for Mobile */}
                        {isEditing && (
                          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-green-950">
                                Update Permissions
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleSaveInlinePermissions(u.id)
                                }
                                disabled={actionBusy}
                                className="px-3 py-1 bg-green-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {PERMISSION_MODULES.map((item) => (
                                <label
                                  key={item.key}
                                  className="flex items-center gap-2 text-xs font-medium text-green-950"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(
                                      editingPermissions?.[item.key]
                                    )}
                                    onChange={(e) =>
                                      handleInlinePermissionChange(
                                        item.key,
                                        e.target.checked
                                      )
                                    }
                                    className="w-4 h-4 rounded text-green-900 accent-green-900"
                                  />
                                  <span>{item.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                          {(u.role === Role.HR || u.role === Role.EMPLOYEE) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setPasswordTarget(u);
                                setResetPassword('');
                                setConfirmResetPassword('');
                              }}
                              disabled={actionBusy}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                            >
                              <KeyRound size={12} />
                              <span>Password</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(u.id)}
                            disabled={actionBusy || u.id === currentUser?.id}
                            className={`flex-1 inline-flex items-center justify-center py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                              u.isActive
                                ? 'text-rose-700 hover:bg-rose-50 border border-rose-200/60'
                                : 'text-emerald-800 hover:bg-emerald-50 border border-emerald-200/60'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </button>

                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteUser(u.id)}
                              disabled={actionBusy}
                              className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                              aria-label={`Delete ${u.username}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {!listLoading && filteredApprovedUsers.length === 0 && (
                  <div className="p-8 text-center text-stone-400 space-y-1">
                    <Search size={28} className="mx-auto text-stone-300" />
                    <p className="font-bold text-sm text-stone-700">
                      No users match your criteria
                    </p>
                    <p className="text-xs text-stone-500">
                      Try adjusting your filters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 6: TAB VIEW - REGISTRATION APPROVALS                            */}
        {/* ======================================================================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              {/* 6A: Desktop Approvals Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200/80">
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Applicant
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Requested Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Request Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider text-right"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pendingUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-stone-50/60 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-green-950 leading-tight">
                                {u.username}
                              </p>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200/60">
                            {u.role === Role.ADMIN
                              ? 'Administrator'
                              : u.role === Role.EMPLOYEE
                                ? 'Employee'
                                : 'HR Staff'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200/60">
                            <Clock size={12} className="text-amber-600" />
                            <span>Pending Review</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void handleApprove(u.id)}
                              disabled={actionBusy}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {approveUser.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDecline(u.id)}
                              disabled={actionBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-700 hover:bg-rose-50 font-semibold rounded-xl text-xs border border-rose-200/60 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* 6C: Empty Approvals State */}
                    {pendingUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 shadow-2xs">
                              <CheckCircle2 size={24} />
                            </div>
                            <p className="font-bold text-sm text-green-950">
                              All Clear — No Pending Approvals
                            </p>
                            <p className="text-xs text-stone-500 font-medium">
                              All account registration requests have been
                              reviewed and processed.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 6B: Mobile Approvals Card List View */}
              <div className="md:hidden divide-y divide-stone-100">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-green-950 truncate">
                            {u.username}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 shrink-0">
                        {u.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleApprove(u.id)}
                        disabled={actionBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        {approveUser.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDecline(u.id)}
                        disabled={actionBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-2 text-rose-700 hover:bg-rose-50 font-semibold rounded-xl text-xs border border-rose-200/60 transition-colors disabled:opacity-50"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}

                {pendingUsers.length === 0 && (
                  <div className="p-8 text-center space-y-1.5">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 mx-auto">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="font-bold text-xs text-green-950">
                      No Pending Approvals
                    </p>
                    <p className="text-[11px] text-stone-500">
                      All registration requests have been resolved.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 7: TAB VIEW - SYSTEM AUDIT TRAIL                                */}
        {/* ======================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* 7A: Audit Log Search Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search audit trail by operator, action, or details..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
                />
                {logSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label="Clear log search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              {/* 7B: Desktop Audit Logs Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200/80">
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Date & Time
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Staff Member
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Activity & Details
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider text-right"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-stone-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-mono text-xs font-semibold text-green-950">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-stone-500 font-medium">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs shrink-0">
                              {log.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-xs text-green-950">
                              {log.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-xs text-green-950">
                              {log.action}
                            </p>
                            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed max-w-xl">
                              {log.details ||
                                'Standard system activity logged.'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-800 rounded-full border border-green-200/60">
                            <Activity size={11} className="text-emerald-700" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                              Logged
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* 7D: Empty Audit Logs State */}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-stone-400">
                            <History size={32} className="text-stone-300" />
                            <p className="font-bold text-sm text-stone-700">
                              No audit records found
                            </p>
                            <p className="text-xs text-stone-500">
                              No events matched your search query.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 7C: Mobile Audit Logs Timeline View */}
              <div className="md:hidden divide-y divide-stone-100">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {log.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-xs text-green-950">
                          {log.username}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500">
                        {new Date(log.timestamp).toLocaleDateString()}{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200/60 mb-1">
                        {log.action}
                      </span>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {log.details || 'Standard system activity logged.'}
                      </p>
                    </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="p-8 text-center text-stone-400 space-y-1">
                    <History size={28} className="mx-auto text-stone-300" />
                    <p className="font-bold text-sm text-stone-700">
                      No audit records found
                    </p>
                    <p className="text-xs text-stone-500">
                      No matching activities recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: PASSWORD RESET MODAL DIALOG                                    */}
      {/* ========================================================================= */}
      {passwordTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="passwordModalTitle"
          onClick={closePasswordModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-stone-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-900 rounded-xl">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2
                    id="passwordModalTitle"
                    className="text-base font-bold text-green-950"
                  >
                    Reset Account Password
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">
                    {passwordTarget.username} · {passwordTarget.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close password reset dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => void handleResetUserPassword(e)}
              className="p-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="newPasswordField"
                  className="block text-xs font-bold text-stone-700 mb-1.5"
                >
                  New Password (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                    size={15}
                  />
                  <input
                    id="newPasswordField"
                    type="password"
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPasswordField"
                  className="block text-xs font-bold text-stone-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                    size={15}
                  />
                  <input
                    id="confirmPasswordField"
                    type="password"
                    required
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {actionError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-green-900 hover:bg-green-800 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {updateUserPassword.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: ADD STAFF USER MODAL DIALOG                                    */}
      {/* ========================================================================= */}
      {isAddingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="addStaffModalTitle"
          onClick={() => {
            setActionError(null);
            setIsAddingUser(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3
                    id="addStaffModalTitle"
                    className="font-bold text-green-950 text-base"
                  >
                    Create Staff Account
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Provision new staff credentials and configure module access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setIsAddingUser(false);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close user modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form
              onSubmit={(e) => void handleCreateUser(e)}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 overflow-y-auto space-y-5">
                {actionError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                        size={15}
                      />
                      <input
                        type="text"
                        required
                        value={newUser.username}
                        onChange={(e) =>
                          setNewUser({ ...newUser, username: e.target.value })
                        }
                        className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                        placeholder="e.g. maria_santos"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">
                      Institutional Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                        size={15}
                      />
                      <input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                        placeholder="maria@normi.edu.ph"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">
                      Initial Password (Min 6 Chars)
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                        size={15}
                      />
                      <input
                        type="password"
                        required
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">
                      Role Type
                    </label>
                    <label
                      htmlFor="modalIsAdminCheck"
                      className="flex items-center gap-3 bg-stone-50 px-3.5 py-2.5 border border-stone-200/80 rounded-xl min-h-[42px] cursor-pointer hover:bg-stone-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        id="modalIsAdminCheck"
                        checked={newUser.isAdmin}
                        onChange={(e) =>
                          setNewUser({ ...newUser, isAdmin: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-stone-300 text-green-900 focus:ring-green-900 cursor-pointer accent-green-900"
                      />
                      <span className="text-xs font-bold text-green-950 uppercase select-none">
                        Administrator Privileges
                      </span>
                    </label>
                  </div>
                </div>

                {/* Permissions Segment */}
                <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-200/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-green-950 tracking-tight flex items-center gap-1.5">
                        <SlidersHorizontal
                          size={14}
                          className="text-amber-500"
                        />
                        Module Access & Permissions
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Select the workspaces and administrative tools this
                        staff member is authorized to manage
                      </p>
                    </div>
                    {newUser.isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-900 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider self-start sm:self-auto">
                        <Shield size={11} />
                        Full Administrator Access
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PERMISSION_MODULES.map((item) => {
                      const isAllowed = newUser.isAdmin
                        ? true
                        : Boolean(newUser.permissions[item.key]);
                      return (
                        <label
                          key={item.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isAllowed
                              ? 'bg-white border-emerald-300 text-green-950 shadow-2xs'
                              : 'bg-white/60 border-stone-200/60 hover:border-stone-300 text-stone-500'
                          } ${newUser.isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            disabled={newUser.isAdmin}
                            onChange={(e) =>
                              handleInlinePermissionChange(
                                item.key,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 mt-0.5 rounded text-green-900 border-stone-300 focus:ring-green-900 accent-green-900 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block text-xs font-bold tracking-tight">
                              {item.label}
                            </span>
                            <span className="block text-[10px] text-stone-500 truncate">
                              {item.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex flex-col-reverse sm:flex-row gap-2.5 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setIsAddingUser(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer text-center"
                >
                  {createStaffUser.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
