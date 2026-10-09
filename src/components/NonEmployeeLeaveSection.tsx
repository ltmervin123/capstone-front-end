import React, { useState } from 'react';
import {
  CalendarDays,
  Check,
  X,
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Eye,
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useAuth.ts';
import {
  useApproveLeave,
  useDeleteLeave,
  useLeavesQuery,
  useRejectLeave,
} from '../hooks/useLeaves.ts';
import { ApiRequestError } from '../utils/apiClient.ts';
import { Logo } from '../assets/common/Logo.tsx';
import { Role, type LeaveRecord } from '../types/types.ts';
import { leaveTypeBadgeClass } from '../utils/leaveUtils.ts';

type ActionType = 'approve' | 'reject' | 'delete' | null;

export const NonEmployeeLeaveSection: React.FC = () => {
  const currentUser = useCurrentUser();
  const leavesQuery = useLeavesQuery();
  const deleteLeave = useDeleteLeave();
  const rejectLeave = useRejectLeave();
  const approveLeave = useApproveLeave();

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    type: ActionType;
    record: LeaveRecord | null;
  }>({ type: null, record: null });
  const [actionError, setActionError] = useState<string | null>(null);

  const leaveList = leavesQuery.data ?? [];
  const listLoading = leavesQuery.isPending;
  const listError =
    leavesQuery.error instanceof ApiRequestError
      ? leavesQuery.error.message
      : leavesQuery.error instanceof Error
        ? leavesQuery.error.message
        : leavesQuery.error
          ? 'Failed to load leave records.'
          : null;

  const pendingLeaves = leaveList.filter((l) => l.status === 'Pending');
  const approvedLeaves = leaveList.filter((l) => l.status === 'Approved');
  const rejectedLeaves = leaveList.filter((l) => l.status === 'Rejected');

  const filteredLeaves = leaveList.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'All' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const badgeText = currentUser?.role === Role.ADMIN ? 'Admin Office' : 'HR Office';

  const statCards = [
    {
      id: 'All',
      label: 'Total Applications',
      subtitle: 'All submitted requests',
      value: leaveList.length,
      icon: CalendarDays,
      iconBg: 'bg-emerald-50 text-emerald-800',
    },
    {
      id: 'Pending',
      label: 'Pending Approvals',
      subtitle: 'Requires action',
      value: pendingLeaves.length,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-900',
    },
    {
      id: 'Approved',
      label: 'Approved Requests',
      subtitle: 'Active & past leaves',
      value: approvedLeaves.length,
      icon: CheckCircle2,
      iconBg: 'bg-green-50 text-green-800',
    },
    {
      id: 'Rejected',
      label: 'Declined Requests',
      subtitle: 'Rejected submissions',
      value: rejectedLeaves.length,
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-800',
    },
  ];

  const handleConfirmAction = async () => {
    if (!actionConfirm.record || !actionConfirm.type) return;
    setActionError(null);

    try {
      if (actionConfirm.type === 'approve') {
        await approveLeave.mutateAsync(actionConfirm.record.id);
      } else if (actionConfirm.type === 'reject') {
        await rejectLeave.mutateAsync(actionConfirm.record.id);
      } else if (actionConfirm.type === 'delete') {
        await deleteLeave.mutateAsync(actionConfirm.record.id);
      }
      setActionConfirm({ type: null, record: null });
      if (selectedRecord?.id === actionConfirm.record.id) {
        setSelectedRecord(null);
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Operation failed. Please try again.';
      setActionError(message);
    }
  };

  const isMutating =
    approveLeave.isPending || rejectLeave.isPending || deleteLeave.isPending;

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
                Personnel Absence Tracking & Approvals
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <CalendarDays size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  {badgeText}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                pendingLeaves.length > 0
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span>
              {pendingLeaves.length === 1
                ? '1 Request Pending'
                : `${pendingLeaves.length} Requests Pending`}
            </span>
          </span>
        </div>
      </header>

      {/* KPI Overview Cards matching Dashboard */}
      <section
        aria-label="Leave summary metrics"
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
              {stat.value}
            </h2>
            <p className="text-sm font-bold text-stone-800 mt-2">
              {stat.label}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Operations & Directory Section */}
      <section aria-label="Leave applications directory" className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <FileText size={22} className="text-amber-500" />
              Leave Requests Directory
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Review, approve, and manage leave applications filed across academic
              departments and administrative personnel. Click any row to view full details.
            </p>
          </div>

          {/* Controls: Search + Tab Filter Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                aria-label="Search leave records"
                placeholder="Search employee or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-stone-200/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-stone-800 placeholder:text-stone-400 shadow-xs focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filter leave requests status"
              className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

        {/* Directory Table Card */}
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
                    Employee
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal">
                    Duration
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal">
                    Reason
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-normal text-right">
                    Status / Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {listLoading && (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-green-900">
                        <Loader2 size={26} className="animate-spin text-emerald-800" />
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
                      colSpan={5}
                      className="text-center py-12 text-xs font-medium text-stone-500"
                    >
                      No leave requests found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  !listLoading &&
                  filteredLeaves.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedRecord(l)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
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
                        <p className="font-bold text-green-950 text-sm group-hover:text-emerald-900 transition-colors">
                          {l.employeeName}
                        </p>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          {l.employeeId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
                          <Clock size={13} className="text-emerald-800 shrink-0" />
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
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(l)}
                            aria-label={`View details for ${l.employeeName}`}
                            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-hidden"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>

                          {l.status === 'Pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setActionConfirm({ type: 'approve', record: l })
                                }
                                disabled={isMutating}
                                aria-label={`Approve request for ${l.employeeName}`}
                                className="p-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:outline-hidden"
                                title="Approve request"
                              >
                                <Check size={15} className="stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActionConfirm({ type: 'reject', record: l })
                                }
                                disabled={isMutating}
                                aria-label={`Reject request for ${l.employeeName}`}
                                className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-700 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden"
                                title="Reject request"
                              >
                                <X size={15} className="stroke-[2.5]" />
                              </button>
                              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                                Pending
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setActionConfirm({ type: 'delete', record: l })
                                }
                                disabled={isMutating}
                                aria-label={`Delete record for ${l.employeeName}`}
                                className="p-2 bg-stone-100 text-stone-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-hidden"
                                title="Delete record"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                  l.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                    : 'bg-rose-50 text-rose-800 border-rose-200/80'
                                }`}
                              >
                                {l.status}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setActionConfirm({ type: 'delete', record: l })
                                }
                                disabled={isMutating}
                                aria-label={`Delete record for ${l.employeeName}`}
                                className="p-2 bg-stone-100 text-stone-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-hidden"
                                title="Delete record"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Leave Application Details Modal */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-detail-title"
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200/80 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3
                    id="leave-detail-title"
                    className="font-bold text-lg text-green-950 tracking-tight"
                  >
                    Leave Application Details
                  </h3>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    FM-NORMI-HRDO-020 • Review and Actions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close dialog"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Employee & Status Row */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs text-emerald-800">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-green-950">
                      {selectedRecord.employeeName}
                    </h4>
                    <p className="text-xs text-stone-500 font-mono">
                      ID: {selectedRecord.employeeId}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    selectedRecord.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedRecord.status === 'Pending'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {selectedRecord.status}
                </span>
              </div>

              {/* Leave Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                  <span className="text-stone-500 font-medium block text-[11px]">
                    Leave Type
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold mt-1 ${leaveTypeBadgeClass(
                      selectedRecord.type
                    )}`}
                  >
                    {selectedRecord.type}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                  <span className="text-stone-500 font-medium block text-[11px]">
                    Total Duration
                  </span>
                  <span className="font-bold text-green-950 text-sm mt-1 block tabular-nums">
                    {selectedRecord.numberOfDays} Days
                  </span>
                </div>
              </div>

              {/* Date & Time Range */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Date Range:</span>
                  <span className="font-bold text-green-950">
                    {selectedRecord.startDate} to {selectedRecord.endDate}
                  </span>
                </div>
                {(selectedRecord.timeFrom || selectedRecord.timeTo) && (
                  <div className="flex justify-between pt-1 border-t border-stone-200/60">
                    <span className="text-stone-500 font-medium">Time Schedule:</span>
                    <span className="font-semibold text-stone-800">
                      {selectedRecord.timeFrom || '—'} to{' '}
                      {selectedRecord.timeTo || '—'}
                    </span>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <span className="block text-xs font-bold text-stone-700 mb-1.5">
                  Reason for Absence
                </span>
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-800 leading-relaxed font-medium">
                  &ldquo;{selectedRecord.reason}&rdquo;
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-6 border-t border-stone-200/80 bg-stone-50/50 flex flex-col-reverse sm:flex-row gap-2.5 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedRecord.status === 'Pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActionConfirm({
                        type: 'reject',
                        record: selectedRecord,
                      });
                    }}
                    className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-700 hover:text-white border border-rose-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionConfirm({
                        type: 'approve',
                        record: selectedRecord,
                      });
                    }}
                    className="px-5 py-2.5 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} className="stroke-[2.5]" />
                    <span>Approve Request</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionConfirm({
                      type: 'delete',
                      record: selectedRecord,
                    });
                  }}
                  className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-700 hover:text-white border border-rose-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Delete Record</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog matching Dashboard modal style */}
      {actionConfirm.record && actionConfirm.type && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  actionConfirm.type === 'approve'
                    ? 'bg-emerald-50 text-emerald-800'
                    : actionConfirm.type === 'reject'
                      ? 'bg-amber-50 text-amber-900'
                      : 'bg-rose-50 text-rose-800'
                }`}
              >
                {actionConfirm.type === 'approve' ? (
                  <CheckCircle2 size={22} />
                ) : actionConfirm.type === 'reject' ? (
                  <AlertCircle size={22} />
                ) : (
                  <Trash2 size={22} />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-green-950">
                  {actionConfirm.type === 'approve' && 'Approve Leave Request'}
                  {actionConfirm.type === 'reject' && 'Reject Leave Request'}
                  {actionConfirm.type === 'delete' && 'Delete Leave Record'}
                </h3>
                <p className="text-xs text-stone-500">
                  {actionConfirm.record.employeeName} ({actionConfirm.record.type})
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {actionConfirm.type === 'approve' &&
                `Confirm approval of the ${actionConfirm.record.type} request for ${actionConfirm.record.employeeName} (${actionConfirm.record.startDate} to ${actionConfirm.record.endDate})?`}
              {actionConfirm.type === 'reject' &&
                `Are you sure you want to decline this leave request for ${actionConfirm.record.employeeName}?`}
              {actionConfirm.type === 'delete' &&
                `Permanently delete the leave record for ${actionConfirm.record.employeeName}? This action cannot be undone.`}
            </p>

            {actionError && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {actionError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionConfirm({ type: null, record: null })}
                disabled={isMutating}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAction()}
                disabled={isMutating}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                  actionConfirm.type === 'approve'
                    ? 'bg-emerald-800 hover:bg-emerald-700'
                    : actionConfirm.type === 'reject'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {isMutating && <Loader2 size={13} className="animate-spin" />}
                <span>
                  {actionConfirm.type === 'approve' && 'Confirm Approval'}
                  {actionConfirm.type === 'reject' && 'Confirm Rejection'}
                  {actionConfirm.type === 'delete' && 'Delete Record'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
