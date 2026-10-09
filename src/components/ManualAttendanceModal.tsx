import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 bg-green-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl relative border-4 border-yellow-400">
        <h3 className="text-2xl font-black text-green-900 mb-2 uppercase tracking-tighter">
          Manual Attendance Entry
        </h3>
        <p className="text-gray-500 text-sm font-medium mb-8">
          Override or add missing attendance logs
        </p>

        <form onSubmit={(e) => void handleAddRecord(e)} className="space-y-6">
          {submitError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-800 text-xs">
              <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold">Could not save attendance:</span> {submitError}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">
              Employee
            </label>
            <select
              required
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">
                Date
              </label>
              <input
                type="date"
                required
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">
                Status
              </label>
              <select
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block text-green-600">
                Time In
              </label>
              <input
                type="time"
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                value={newRecord.timeIn}
                onChange={(e) => setNewRecord({ ...newRecord, timeIn: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block text-red-600">
                Time Out
              </label>
              <input
                type="time"
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                value={newRecord.timeOut}
                onChange={(e) => setNewRecord({ ...newRecord, timeOut: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">
              Remarks
            </label>
            <textarea
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950 h-24"
              value={newRecord.remarks}
              onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createAttendance.isPending}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAttendance.isPending}
              className="flex-1 px-6 py-4 bg-green-900 text-yellow-400 font-black rounded-2xl hover:bg-green-800 transition-all active:scale-95 uppercase text-xs tracking-widest disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createAttendance.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              {createAttendance.isPending ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
