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

export const NonEmployeeLeaveSection: React.FC = () => {
  const currentUser = useCurrentUser();
  const leavesQuery = useLeavesQuery();
  const deleteLeave = useDeleteLeave();
  const rejectLeave = useRejectLeave();
  const approveLeave = useApproveLeave();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
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
  const badgeText = currentUser?.role === Role.ADMIN ? 'ADMIN OPS' : 'HR OPS';

  const handleDelete = async (leave: LeaveRecord) => {
    const confirmed = window.confirm(
      `Delete the ${leave.type} request for ${leave.employeeName} (${leave.startDate} to ${leave.endDate})? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteLeave.mutateAsync(leave.id);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete leave record.';
      window.alert(message);
    }
  };

  const handleReject = async (leave: LeaveRecord) => {
    const confirmed = window.confirm(
      `Reject the ${leave.type} request for ${leave.employeeName} (${leave.startDate} to ${leave.endDate})?`
    );
    if (!confirmed) return;

    try {
      await rejectLeave.mutateAsync(leave.id);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to reject leave request.';
      window.alert(message);
    }
  };

  const handleApprove = async (leave: LeaveRecord) => {
    const confirmed = window.confirm(
      `Approve the ${leave.type} request for ${leave.employeeName} (${leave.startDate} to ${leave.endDate})?`
    );
    if (!confirmed) return;

    try {
      await approveLeave.mutateAsync(leave.id);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to approve leave request.';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HR Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
              Leave Management
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                Personnel Absence Tracking & Approvals
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
                <CalendarDays size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  {badgeText}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingLeaves.length > 0 && (
            <span className="px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black uppercase rounded-full shadow-xs flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {pendingLeaves.length} Pending Review
            </span>
          )}
        </div>
      </header>

      {/* Leave Requests Overview Cards */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse" />
              <h2 className="text-base font-black text-green-950 uppercase tracking-tight">
                Leave Requests Overview
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Review and manage absence applications submitted by all personnel
            </p>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setFilterStatus('All')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'All'
                ? 'bg-green-100/70 border-green-300 ring-2 ring-green-900'
                : 'bg-green-50/60 border-green-100/80 hover:bg-green-100/40'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-green-800">
              Total Applications
            </p>
            <p className="text-xl font-black text-green-950 mt-1">
              {leaveList.length}
            </p>
            <p className="text-[9px] text-gray-500 font-bold mt-1">
              All submitted requests
            </p>
          </div>

          <div
            onClick={() => setFilterStatus('Pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'Pending'
                ? 'bg-amber-100/70 border-amber-300 ring-2 ring-amber-600'
                : 'bg-amber-50/60 border-amber-100/80 hover:bg-amber-100/40'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Pending Approvals
            </p>
            <p className="text-xl font-black text-amber-950 mt-1">
              {pendingLeaves.length}
            </p>
            <p className="text-[9px] text-amber-700 font-bold mt-1">
              Requires HR action
            </p>
          </div>

          <div
            onClick={() => setFilterStatus('Approved')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'Approved'
                ? 'bg-blue-100/70 border-blue-300 ring-2 ring-blue-600'
                : 'bg-blue-50/60 border-blue-100/80 hover:bg-blue-100/40'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-800">
              Approved Requests
            </p>
            <p className="text-xl font-black text-blue-950 mt-1">
              {approvedLeaves.length}
            </p>
            <p className="text-[9px] text-blue-700 font-bold mt-1">
              Approved leaves
            </p>
          </div>

          <div
            onClick={() => setFilterStatus('Rejected')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'Rejected'
                ? 'bg-rose-100/70 border-rose-300 ring-2 ring-rose-600'
                : 'bg-rose-50/60 border-rose-100/80 hover:bg-rose-100/40'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-800">
              Rejected Requests
            </p>
            <p className="text-xl font-black text-rose-950 mt-1">
              {rejectedLeaves.length}
            </p>
            <p className="text-[9px] text-rose-700 font-bold mt-1">
              Declined submissions
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by employee name, employee ID, or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-900 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="bg-white border border-gray-100 rounded-2xl p-1 shadow-sm flex items-center gap-1 w-full md:w-auto overflow-x-auto">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-green-900 text-yellow-400 shadow-sm'
                      : 'text-gray-500 hover:text-green-950 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Non-Employee Leave Management Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {listError && (
          <div className="flex items-start gap-3 p-4 m-4 mb-0 bg-red-50 rounded-2xl border border-red-100 text-red-800 text-xs">
            <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Could not load leave records:</span>{' '}
              {listError}
            </div>
            <button
              type="button"
              onClick={() => void leavesQuery.refetch()}
              className="text-[10px] font-black uppercase tracking-wider text-red-700 hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-green-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                  Type
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                  Employee
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                  Duration
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                  Reason
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-right">
                  Status / Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-green-900">
                      <Loader2 size={28} className="animate-spin" />
                      <p className="font-black uppercase text-xs tracking-[0.3em]">
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
                    className="text-center py-8 text-sm font-medium text-gray-500 italic"
                  >
                    No leave requests found matching the current criteria.
                  </td>
                </tr>
              ) : (
                !listLoading &&
                filteredLeaves.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-green-50/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${leaveTypeBadgeClass(l.type)}`}
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-green-950">
                        {l.employeeName}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        {l.employeeId}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        <Clock size={12} className="text-green-800" />
                        <span>
                          {l.startDate} to {l.endDate}
                        </span>
                        <span className="text-[10px] text-gray-400 font-black">
                          ({l.numberOfDays}d)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <span className="text-xs italic text-gray-500">
                        "{l.reason}"
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {l.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleApprove(l)}
                              disabled={
                                approveLeave.isPending ||
                                rejectLeave.isPending ||
                                deleteLeave.isPending
                              }
                              className="p-1.5 bg-green-50 text-green-800 hover:bg-green-600 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Approve request"
                            >
                              {approveLeave.isPending &&
                              approveLeave.variables === l.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} className="stroke-[3]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReject(l)}
                              disabled={
                                approveLeave.isPending ||
                                rejectLeave.isPending ||
                                deleteLeave.isPending
                              }
                              className="p-1.5 bg-rose-50 text-red-700 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reject request"
                            >
                              {rejectLeave.isPending &&
                              rejectLeave.variables === l.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <X size={14} className="stroke-[3]" />
                              )}
                            </button>
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-yellow-50 text-yellow-800 border border-yellow-150">
                              Pending
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleDelete(l)}
                              disabled={deleteLeave.isPending}
                              className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-150 hover:text-red-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete record"
                            >
                              {deleteLeave.isPending &&
                              deleteLeave.variables === l.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                l.status === 'Approved'
                                  ? 'bg-green-50 text-green-800 border-green-150'
                                  : 'bg-rose-50 text-red-700 border-rose-150'
                              }`}
                            >
                              {l.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleDelete(l)}
                              disabled={deleteLeave.isPending}
                              className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-150 hover:text-red-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete record"
                            >
                              {deleteLeave.isPending &&
                              deleteLeave.variables === l.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
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
    </div>
  );
};
