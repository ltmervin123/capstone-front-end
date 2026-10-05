import React, { useState } from 'react';
import { CalendarDays, Clock, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useAuth.ts';
import { useLeavesQuery } from '../hooks/useLeaves.ts';
import { ApiRequestError } from '../utils/apiClient.ts';
import { Logo } from '../assets/common/Logo.tsx';
import { LeaveType } from '../types/types.ts';
import {
  TOTAL_LEAVE_LIMIT,
  leaveDays,
  leaveTypeBadgeClass,
} from '../utils/leaveUtils.ts';
import { LeaveApplicationModal } from './LeaveApplicationModal.tsx';

export const EmployeeLeaveSection: React.FC = () => {
  const currentUser = useCurrentUser();
  const leavesQuery = useLeavesQuery();

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Computations for current year credits
  const currentYear = new Date().getFullYear();
  const formCreditLeaves = leaveList.filter((leave) => {
    if (leave.type !== LeaveType.LEAVE_CREDITS) return false;
    return leave.startDate.slice(0, 4) === String(currentYear);
  });
  const formApprovedCreditDays = formCreditLeaves
    .filter((leave) => leave.status === 'Approved')
    .reduce((sum, leave) => sum + leaveDays(leave), 0);
  const remainingLeaveCredits = Math.max(
    0,
    TOTAL_LEAVE_LIMIT - formApprovedCreditDays
  );

  const approvedLeaves = leaveList.filter(
    (leave) => leave.status === 'Approved'
  );
  const pendingLeaves = leaveList.filter((leave) => leave.status === 'Pending');
  const totalApprovedDays = approvedLeaves.reduce(
    (sum, leave) => sum + leaveDays(leave),
    0
  );
  const totalPendingDays = pendingLeaves.reduce(
    (sum, leave) => sum + leaveDays(leave),
    0
  );

  // Employee details from record or user profile
  const ownLeave = leaveList.find(
    (leave) => leave.employeeId === currentUser?.employeeId
  );
  const empName = ownLeave?.employeeName || currentUser?.username || 'Employee';
  const deptParts = [
    ownLeave?.employeePosition,
    ownLeave?.employeeDepartment,
  ].filter(Boolean);
  const empDept = deptParts.length > 0 ? deptParts.join(' / ') : 'N/A';

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
              Leave Management
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                Absence Tracking & Approvals
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
                <CalendarDays size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  MY ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 bg-green-900 hover:bg-green-800 text-yellow-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            File Leave Form
          </button>
        </div>
      </header>

      {/* Limited Employee View Notice */}
      <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-800 shrink-0 mt-0.5" size={16} />
        <div>
          <h3 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider">
            🔒 Limited Employee View
          </h3>
          <p className="text-xs text-blue-850 mt-1 leading-relaxed">
            Welcome to your Leave Manager dashboard. Here, you can file private
            leave forms. Once submitted, your request will appear with a{' '}
            <strong>Pending</strong> status until checked and approved by a
            supervisor or HR Admin.
          </p>
        </div>
      </div>

      {/* Leave Credits Summary & Limits Counter */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse" />
              <h2 className="text-base font-black text-green-950 uppercase tracking-tight">
                My Leave Credits & Allowance Limit
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Annual Standard Allowance:{' '}
              <strong className="text-green-900">
                {TOTAL_LEAVE_LIMIT}.0 Days Max Limit
              </strong>{' '}
              per calendar year
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-yellow-400 text-green-950 text-xs font-black uppercase rounded-full shadow-xs">
              {remainingLeaveCredits} Days Remaining
            </span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50/60 rounded-2xl border border-green-100/80">
            <p className="text-[10px] font-black uppercase tracking-wider text-green-800">
              Total Annual Allocation
            </p>
            <p className="text-xl font-black text-green-950 mt-1">
              {TOTAL_LEAVE_LIMIT}.0{' '}
              <span className="text-xs font-bold text-gray-500">Days</span>
            </p>
            <p className="text-[9px] text-gray-500 font-bold mt-1">
              Annual Leave Limit
            </p>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100/80">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-800">
              Approved Leaves Used
            </p>
            <p className="text-xl font-black text-blue-950 mt-1">
              {totalApprovedDays}.0{' '}
              <span className="text-xs font-bold text-gray-500">Days</span>
            </p>
            <p className="text-[9px] text-blue-700 font-bold mt-1">
              {approvedLeaves.length} Approved Requests
            </p>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100/80">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Pending Requests
            </p>
            <p className="text-xl font-black text-amber-950 mt-1">
              {totalPendingDays}.0{' '}
              <span className="text-xs font-bold text-gray-500">Days</span>
            </p>
            <p className="text-[9px] text-amber-700 font-bold mt-1">
              {pendingLeaves.length} Awaiting HR
            </p>
          </div>

          <div className="p-4 bg-emerald-100/70 rounded-2xl border border-emerald-200">
            <p className="text-[10px] font-black uppercase tracking-wider text-green-900">
              Remaining Balance
            </p>
            <p className="text-xl font-black text-green-950 mt-1">
              {remainingLeaveCredits}.0{' '}
              <span className="text-xs font-bold text-green-800">
                Days Left
              </span>
            </p>
            <p className="text-[9px] text-green-800 font-bold mt-1">
              Available to request
            </p>
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
            <span>
              Leave Credits Usage (
              {Math.round((totalApprovedDays / TOTAL_LEAVE_LIMIT) * 100)}% Used)
            </span>
            <span>
              {remainingLeaveCredits} / {TOTAL_LEAVE_LIMIT}.0 Days Available
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${Math.min(100, (totalApprovedDays / TOTAL_LEAVE_LIMIT) * 100)}%`,
              }}
              className="bg-blue-600 h-full transition-all duration-500"
            />
            <div
              style={{
                width: `${Math.min(100, (totalPendingDays / TOTAL_LEAVE_LIMIT) * 100)}%`,
              }}
              className="bg-amber-400 h-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Employee Leave Records Table */}
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
                  Duration
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                  Reason
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listLoading && (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-green-900">
                      <Loader2 size={28} className="animate-spin" />
                      <p className="font-black uppercase text-xs tracking-[0.3em]">
                        Loading leave records...
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!listLoading && leaveList.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-sm font-medium text-gray-500 italic"
                  >
                    No leave requests found. Click "File Leave Form" to file
                    your first request.
                  </td>
                </tr>
              ) : (
                !listLoading &&
                leaveList.map((l) => (
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
                      {l.status === 'Pending' ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-yellow-50 text-yellow-800 border border-yellow-150">
                          Pending HR
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            l.status === 'Approved'
                              ? 'bg-green-50 text-green-800 border-green-150'
                              : 'bg-rose-50 text-red-700 border-rose-150'
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

      {/* File Leave Modal */}
      <LeaveApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        remainingCredits={remainingLeaveCredits}
        employeeName={empName}
        employeeDepartment={empDept}
        employeeNumber={currentUser?.employeeId ?? ''}
      />
    </div>
  );
};
