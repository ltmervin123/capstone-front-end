import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CalendarClock,
  FileText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useAuth.ts';
import { useLeavesQuery } from '../hooks/useLeaves.ts';
import { ApiRequestError } from '../utils/apiClient.ts';
import { Logo } from '../assets/common/Logo.tsx';
import {
  TOTAL_LEAVE_LIMIT,
  leaveDays,
  leaveTypeBadgeClass,
} from '../utils/leaveUtils.ts';
import { LeaveApplicationModal } from './LeaveApplicationModal.tsx';

export const EmployeeLeaveSection: React.FC = () => {
  const currentUser = useCurrentUser();
  const leavesQuery = useLeavesQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const employeeId = currentUser?.employeeId;
  const listLoading = leavesQuery.isPending;
  const listError =
    leavesQuery.error instanceof ApiRequestError
      ? leavesQuery.error.message
      : leavesQuery.error instanceof Error
        ? leavesQuery.error.message
        : leavesQuery.error
          ? 'Failed to load leave records.'
          : null;

  // Filter records belonging to the current user (or all if not tagged)
  const myLeaves = useMemo(() => {
    const rawLeaveList = leavesQuery.data || [];
    if (!employeeId) return rawLeaveList;
    const userLeaves = rawLeaveList.filter((l) => l.employeeId === employeeId);
    return userLeaves.length > 0 ? userLeaves : rawLeaveList;
  }, [employeeId, leavesQuery.data]);

  // Current year credit calculations
  const currentYear = new Date().getFullYear();
  const currentYearLeaves = myLeaves.filter(
    (leave) => leave.startDate.slice(0, 4) === String(currentYear)
  );
  const reservedLeaveDays = currentYearLeaves
    .filter((leave) => leave.status !== 'Rejected')
    .reduce((sum, leave) => sum + leaveDays(leave), 0);
  const remainingLeaveBalance = Math.max(
    0,
    TOTAL_LEAVE_LIMIT - reservedLeaveDays
  );

  const approvedLeaves = myLeaves.filter((l) => l.status === 'Approved');
  const pendingLeaves = myLeaves.filter((l) => l.status === 'Pending');
  const totalApprovedDays = approvedLeaves.reduce(
    (sum, leave) => sum + leaveDays(leave),
    0
  );
  const totalPendingDays = pendingLeaves.reduce(
    (sum, leave) => sum + leaveDays(leave),
    0
  );
  const currentYearApprovedDays = currentYearLeaves
    .filter((leave) => leave.status === 'Approved')
    .reduce((sum, leave) => sum + leaveDays(leave), 0);
  const currentYearPendingDays = currentYearLeaves
    .filter((leave) => leave.status === 'Pending')
    .reduce((sum, leave) => sum + leaveDays(leave), 0);

  const ownLeave = myLeaves.find(
    (leave) => leave.employeeId === currentUser?.employeeId
  );
  const empName = ownLeave?.employeeName || currentUser?.username || 'Employee';
  const deptParts = [
    ownLeave?.employeePosition,
    ownLeave?.employeeDepartment,
  ].filter(Boolean);
  const empDept = deptParts.length > 0 ? deptParts.join(' / ') : 'N/A';

  const filteredLeaves = myLeaves.filter((record) => {
    const matchesSearch =
      record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'All' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statCards = [
    {
      id: 'allocation',
      label: 'Annual Allocation',
      subtitle: 'Standard annual limit',
      value: `${TOTAL_LEAVE_LIMIT}.0`,
      unit: 'Days',
      icon: CalendarDays,
      iconBg: 'bg-emerald-50 text-emerald-800',
    },
    {
      id: 'approved',
      label: 'Approved Leaves',
      subtitle: `${approvedLeaves.length} approved requests`,
      value: `${totalApprovedDays}.0`,
      unit: 'Days',
      icon: CheckCircle2,
      iconBg: 'bg-blue-50 text-blue-800',
    },
    {
      id: 'pending',
      label: 'Pending Requests',
      subtitle: `${pendingLeaves.length} awaiting HR review`,
      value: `${totalPendingDays}.0`,
      unit: 'Days',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-900',
    },
    {
      id: 'remaining',
      label: 'Remaining Balance',
      subtitle: 'Available to request',
      value: `${remainingLeaveBalance}.0`,
      unit: 'Days',
      icon: CalendarClock,
      iconBg: 'bg-purple-50 text-purple-800',
    },
  ];

  const usedPercentage = Math.min(
    100,
    Math.round((currentYearApprovedDays / TOTAL_LEAVE_LIMIT) * 100)
  );
  const pendingPercentage = Math.min(
    100 - usedPercentage,
    Math.round((currentYearPendingDays / TOTAL_LEAVE_LIMIT) * 100)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Header matching Dashboard */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              Leave Management
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Personal Absence Tracking & Allowance
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <CalendarDays size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  My Account
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-900 hover:bg-green-800 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>File Leave Form</span>
          </button>
        </div>
      </header>

      {/* Guidance Notice Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="text-emerald-800 shrink-0 mt-0.5" size={18} />
        <div>
          <h2 className="text-xs font-bold text-emerald-950">
            Employee Absence Tracking
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
            Welcome to your leave management portal. You can file official leave
            requests anytime. Submitted requests remain in{' '}
            <strong className="text-stone-800">Pending</strong> status until
            evaluated and approved by your supervisor or HR administrator.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards matching Dashboard */}
      <section
        aria-label="Personal leave metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <div
            key={stat.id}
            className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group transition-all"
          >
            <div
              className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
            >
              <stat.icon size={22} />
            </div>
            <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
              {stat.value}{' '}
              <span className="text-xs font-semibold text-stone-500">
                {stat.unit}
              </span>
            </h2>
            <p className="text-sm font-bold text-stone-800 mt-2">
              {stat.label}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Annual Leave Allocation Progress Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-green-950">
              Annual Leave Allocation Usage
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Maximum allocation of {TOTAL_LEAVE_LIMIT}.0 days per calendar year
            </p>
          </div>
          <div className="text-xs font-bold text-stone-700 tabular-nums">
            <span className="text-emerald-800">
              {remainingLeaveBalance}.0 Days
            </span>{' '}
            Remaining
          </div>
        </div>

        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${usedPercentage}%` }}
            className="bg-emerald-600 h-full transition-all duration-500"
            title={`Used: ${currentYearApprovedDays} days (${usedPercentage}%)`}
          />
          <div
            style={{ width: `${pendingPercentage}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Pending: ${currentYearPendingDays} days (${pendingPercentage}%)`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              Approved ({currentYearApprovedDays}.0d)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              Pending ({currentYearPendingDays}.0d)
            </span>
          </div>
          <span className="text-stone-500 font-medium">
            {usedPercentage}% of total limit used
          </span>
        </div>
      </div>

      {/* Directory Section: My Leave Applications */}
      <section aria-label="Personal leave records" className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <FileText size={22} className="text-amber-500" />
              My Leave Requests
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Track the status of all leave applications submitted under your
              profile.
            </p>
          </div>

          {/* Controls: Search + Tab Filter Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                aria-label="Search my leave requests"
                placeholder="Search reason or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-stone-200/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-stone-800 placeholder:text-stone-400 shadow-xs focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter leave requests"
              className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0"
            >
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(
                (status) => {
                  const isActive = filterStatus === status;
                  return (
                    <button
                      key={status}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                        isActive
                          ? 'bg-green-900 text-amber-300 shadow-xs'
                          : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                      }`}
                    >
                      {status}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Records Table Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          {listError && (
            <div className="flex items-start gap-3 p-4 m-4 mb-0 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs">
              <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Could not load records:</span>{' '}
                {listError}
              </div>
              <button
                type="button"
                onClick={() => void leavesQuery.refetch()}
                className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200/80">
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal">
                    Leave Type
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal">
                    Duration
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal">
                    Reason
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal text-right">
                    Review Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {listLoading && (
                  <tr>
                    <td colSpan={4} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-green-900">
                        <Loader2
                          size={26}
                          className="animate-spin text-emerald-800"
                        />
                        <p className="text-xs font-medium text-stone-600">
                          Loading leave records...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {!listLoading && filteredLeaves.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-12 text-xs font-medium text-stone-500"
                    >
                      No leave requests found. Click &ldquo;File Leave
                      Form&rdquo; above to submit an application.
                    </td>
                  </tr>
                ) : (
                  !listLoading &&
                  filteredLeaves.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${leaveTypeBadgeClass(
                            l.type
                          )}`}
                        >
                          {l.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
                          <Clock
                            size={13}
                            className="text-emerald-800 shrink-0"
                          />
                          <span>
                            {l.startDate} to {l.endDate}
                          </span>
                          <span className="text-xs text-stone-500 font-semibold tabular-nums">
                            ({l.numberOfDays}d)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className="text-xs text-stone-600 line-clamp-2">
                          &ldquo;{l.reason}&rdquo;
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {l.status === 'Pending' ? (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                            Pending Review
                          </span>
                        ) : (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              l.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                : 'bg-rose-50 text-rose-800 border-rose-200/80'
                            }`}
                          >
                            {l.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* File Leave Modal */}
      <LeaveApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        remainingDays={remainingLeaveBalance}
        employeeName={empName}
        employeeDepartment={empDept}
        employeeNumber={currentUser?.employeeId ?? ''}
      />
    </div>
  );
};
