import React, { useState } from 'react';
import {
  CalendarDays,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCreateLeave } from '../hooks/useLeaves';
import { LeaveType } from '../types/types';
import { createLeaveFormSchema } from '../schemas/leave.schema';
import { ApiRequestError } from '../utils/apiClient';

interface LeaveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingCredits: number;
  employeeName: string;
  employeeDepartment: string;
  employeeNumber: string;
}

export const LeaveApplicationModal: React.FC<LeaveApplicationModalProps> = ({
  isOpen,
  onClose,
  remainingCredits,
  employeeName,
  employeeDepartment,
  employeeNumber,
}) => {
  const createLeave = useCreateLeave();

  const [leaveType, setLeaveType] = useState<LeaveType>(
    LeaveType.LEAVE_CREDITS
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [customDays, setCustomDays] = useState<number | null>(null);

  const resetForm = () => {
    setLeaveType(LeaveType.LEAVE_CREDITS);
    setStartDate('');
    setEndDate('');
    setReason('');
    setTimeFrom('');
    setTimeTo('');
    setCustomDays(null);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Number.isNaN(diffDays) ? 0 : diffDays;
  };

  const requestedDays = customDays || calculateDays();

  const handleFileLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeNumber) {
      setFormError('Your account is not linked to an employee record.');
      return;
    }

    const parsed = createLeaveFormSchema.safeParse({
      employeeNumber,
      type: leaveType,
      startDate,
      endDate,
      numberOfDays: requestedDays,
      timeFrom,
      timeTo,
      reason,
    });

    if (!parsed.success) {
      setFormError(
        parsed.error.issues.map((issue) => issue.message).join(', ')
      );
      return;
    }

    if (
      parsed.data.type === LeaveType.LEAVE_CREDITS &&
      parsed.data.numberOfDays > remainingCredits
    ) {
      setFormError(
        `Leave Limit Exceeded: You are requesting ${parsed.data.numberOfDays} day(s), but only have ${remainingCredits} leave credit(s) remaining for this calendar year.`
      );
      return;
    }

    try {
      await createLeave.mutateAsync(parsed.data);
      handleClose();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to submit leave request.';
      setFormError(message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-modal-title"
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col my-8 relative"
          >
            {/* Header matching Dashboard Modal pattern */}
            <div className="p-6 border-b border-stone-200/80 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3
                    id="leave-modal-title"
                    className="font-bold text-lg text-green-950 tracking-tight"
                  >
                    File Leave Application
                  </h3>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    Northern Mindanao Colleges, Inc. • FM-NORMI-HRDO-020
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={(e) => void handleFileLeave(e)}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="p-6 overflow-y-auto space-y-5 max-h-[70vh]">
                {formError && (
                  <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs shadow-xs">
                    <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Submission error:</span>{' '}
                      {formError}
                    </div>
                  </div>
                )}

                {/* Leave Credits Balance Banner */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">
                        Annual Leave Credits
                      </p>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Standard annual entitlement
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-950 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs tabular-nums inline-block">
                      {remainingCredits}.0 Days Left
                    </span>
                  </div>
                </div>

                {/* Applicant Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                  <div>
                    <span className="text-stone-500 font-medium block text-[11px]">
                      Employee Name
                    </span>
                    <span className="font-bold text-green-950 text-xs sm:text-sm mt-0.5 block">
                      {employeeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block text-[11px]">
                      Department / Position
                    </span>
                    <span className="font-semibold text-stone-800 text-xs sm:text-sm mt-0.5 block">
                      {employeeDepartment || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Leave Type Selector Chips */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    Leave Classification
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {Object.values(LeaveType).map((type) => {
                      const isSelected = leaveType === type;
                      return (
                        <div
                          key={type}
                          onClick={() => setLeaveType(type)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setLeaveType(type);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-green-50/60 border-green-800 text-green-950 ring-1 ring-green-800 shadow-2xs font-bold'
                              : 'bg-white border-stone-200/80 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-green-900 bg-green-900 text-amber-300'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                            )}
                          </span>
                          <span className="truncate">{type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="leave-start-date"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Start Date
                    </label>
                    <input
                      id="leave-start-date"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="leave-end-date"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      End Date
                    </label>
                    <input
                      id="leave-end-date"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="leave-days"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Number of Days
                    </label>
                    <input
                      id="leave-days"
                      type="number"
                      min={1}
                      required
                      value={requestedDays || ''}
                      onChange={(e) =>
                        setCustomDays(parseInt(e.target.value) || null)
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all tabular-nums"
                      placeholder="Days"
                    />
                  </div>
                </div>

                {/* Optional Time Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="leave-time-from"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Time From (Optional)
                    </label>
                    <input
                      id="leave-time-from"
                      type="text"
                      placeholder="e.g. 08:00 AM"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="leave-time-to"
                      className="block text-xs font-bold text-stone-700 mb-1.5"
                    >
                      Time To (Optional)
                    </label>
                    <input
                      id="leave-time-to"
                      type="text"
                      placeholder="e.g. 05:00 PM"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label
                    htmlFor="leave-reason"
                    className="block text-xs font-bold text-stone-700 mb-1.5"
                  >
                    Reason for Absence
                  </label>
                  <textarea
                    id="leave-reason"
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="State specific reason or purpose for absence..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-stone-200/80 bg-stone-50/50 flex flex-col-reverse sm:flex-row gap-2.5 justify-end shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={createLeave.isPending}
                  className="px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLeave.isPending}
                  className="px-5 py-2.5 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {createLeave.isPending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
