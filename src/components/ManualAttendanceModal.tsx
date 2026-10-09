import React, { useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useEmployeesQuery } from '../hooks/useEmployees';
import { useCreateAttendance } from '../hooks/useAttendance';
import { createAttendanceFormSchema } from '../schemas/attendance.schema';
import { ApiRequestError } from '../utils/apiClient';
import { AttendanceStatus } from '../types/types';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_ENTRY = {
  employeeId: '',
  date: new Date().toISOString().split('T')[0],
  timeIn: '08:00',
  timeOut: '17:00',
  status: AttendanceStatus.PRESENT,
  remarks: '',
};

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const employeesQuery = useEmployeesQuery({ enabled: isOpen });
  const createAttendance = useCreateAttendance();

  const employees = employeesQuery.data ?? [];
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState(EMPTY_ENTRY);

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitError(null);
    setNewRecord({
      ...EMPTY_ENTRY,
      date: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = createAttendanceFormSchema.safeParse({
      employeeNumber: newRecord.employeeId,
      date: newRecord.date,
      timeIn: newRecord.timeIn,
      timeOut: newRecord.timeOut,
      status: newRecord.status,
      remarks: newRecord.remarks,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues.map((issue) => issue.message).join(', '));
      return;
    }

    try {
      await createAttendance.mutateAsync(parsed.data);
      handleClose();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to save attendance.';
      setSubmitError(message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-attendance-title"
      className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl border border-stone-200/80 relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <h2
            id="manual-attendance-title"
            className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight"
          >
            Manual Attendance Entry
          </h2>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Override or add verified attendance logs for personnel.
          </p>
        </div>

        <form onSubmit={(e) => void handleAddRecord(e)} className="space-y-4">
          {submitError && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs shadow-xs">
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold">Could not save attendance:</span> {submitError}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="manual-employee"
              className="block text-xs font-bold text-stone-700 mb-1.5"
            >
              Employee
            </label>
            <select
              id="manual-employee"
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all cursor-pointer"
              value={newRecord.employeeId}
              onChange={(e) => setNewRecord({ ...newRecord, employeeId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.surname} ({emp.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="manual-date"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Date
              </label>
              <input
                id="manual-date"
                type="date"
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
              />
            </div>
            <div>
              <label
                htmlFor="manual-status"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Status
              </label>
              <select
                id="manual-status"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all cursor-pointer"
                value={newRecord.status}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, status: e.target.value as AttendanceStatus })
                }
              >
                {Object.values(AttendanceStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="manual-time-in"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Time In
              </label>
              <input
                id="manual-time-in"
                type="time"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                value={newRecord.timeIn}
                onChange={(e) => setNewRecord({ ...newRecord, timeIn: e.target.value })}
              />
            </div>
            <div>
              <label
                htmlFor="manual-time-out"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Time Out
              </label>
              <input
                id="manual-time-out"
                type="time"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                value={newRecord.timeOut}
                onChange={(e) => setNewRecord({ ...newRecord, timeOut: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="manual-remarks"
              className="block text-xs font-bold text-stone-700 mb-1.5"
            >
              Remarks
            </label>
            <textarea
              id="manual-remarks"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all h-20 placeholder:text-stone-400"
              value={newRecord.remarks}
              onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })}
              placeholder="Optional notes or authorization details..."
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={createAttendance.isPending}
              className="flex-1 px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAttendance.isPending}
              className="flex-1 px-4 py-2.5 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {createAttendance.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{createAttendance.isPending ? 'Saving...' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
