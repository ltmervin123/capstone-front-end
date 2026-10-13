import React, { useState } from 'react';
import {
  Award,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  TrendingUp,
  UploadCloud,
  X,
  Building,
} from 'lucide-react';
import {
  DEPARTMENTS,
  Role,
  type Employee,
  type EmployeePromotionRecord,
} from '../../../../types/types';
import { useCurrentUser } from '../../../../hooks/useAuth';
import { usePromoteEmployeeMutation } from '../../../../hooks/useEmployees';

interface PromoteEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: EmployeePromotionRecord) => void;
}

export const PromoteEmployeeModal: React.FC<PromoteEmployeeModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === Role.ADMIN;
  const promoteMutation = usePromoteEmployeeMutation();

  const [newPosition, setNewPosition] = useState('');
  const [department, setDepartment] = useState(employee?.department ?? '');
  const [effectiveDate, setEffectiveDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [newFunctionalRate, setNewFunctionalRate] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if employee changes
  React.useEffect(() => {
    if (employee) {
      setDepartment(employee.department);
      setNewPosition('');
      setNewFunctionalRate(
        employee.functionalRate ? String(employee.functionalRate) : ''
      );
      setRemarks('');
      setDocumentFile(null);
      setErrorMessage(null);
      setEffectiveDate(new Date().toISOString().split('T')[0]);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPosition.trim()) {
      setErrorMessage('Please specify the new promoted position title.');
      return;
    }

    if (!remarks.trim() || remarks.trim().length < 5) {
      setErrorMessage(
        'Please provide a detailed promotion rationale (at least 5 characters).'
      );
      return;
    }

    try {
      const result = await promoteMutation.mutateAsync({
        employeeNumber: employee.id,
        payload: {
          newPosition: newPosition.trim(),
          newDepartmentName: department,
          effectiveDate,
          newFunctionalRate: newFunctionalRate ? parseFloat(newFunctionalRate) : undefined,
          remarks: remarks.trim(),
          isApproved: isAdmin,
        },
        document: documentFile,
      });

      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to submit promotion.';
      setErrorMessage(msg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promote-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/80 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs border border-amber-200">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2
                id="promote-modal-title"
                className="text-lg font-bold text-green-950 tracking-tight"
              >
                Promote Employee
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                {isAdmin
                  ? 'Record an approved career promotion and update active credentials'
                  : 'Submit a promotion recommendation for administrator review'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 rounded-xl transition-colors cursor-pointer"
            aria-label="Close promotion dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl"
            >
              {errorMessage}
            </div>
          )}

          {/* Current Profile Summary Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Current Assignment
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Employee</span>
                <span className="font-bold text-green-950">
                  {employee.firstName} {employee.surname}
                </span>
                <span className="text-stone-500 block font-mono text-[11px]">
                  {employee.id}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Current Role</span>
                <span className="font-semibold text-green-900">
                  {employee.position}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Department</span>
                <span className="font-medium text-stone-700">
                  {employee.department}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Functional Rate</span>
                <span className="font-semibold text-green-950">
                  {employee.functionalRate
                    ? `₱${Number(employee.functionalRate).toLocaleString()}`
                    : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* New Position & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="newPositionInput"
                className="block text-xs font-bold text-green-950"
              >
                Promoted Position <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Award
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  id="newPositionInput"
                  type="text"
                  required
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="e.g. Senior Systems Analyst"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-green-950 placeholder:text-stone-400 focus:bg-white focus:border-green-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="newDepartmentSelect"
                className="block text-xs font-bold text-green-950"
              >
                Department / Assignment
              </label>
              <div className="relative">
                <Building
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <select
                  id="newDepartmentSelect"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none cursor-pointer transition-all"
                >
                  {DEPARTMENTS.map((dept: string) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Effective Date & Compensation Adjustment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="effectiveDateInput"
                className="block text-xs font-bold text-green-950"
              >
                Effective Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  id="effectiveDateInput"
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="newFunctionalRateInput"
                className="block text-xs font-bold text-green-950"
              >
                Adjusted Functional Rate / Salary (₱){' '}
                <span className="text-[11px] font-normal text-stone-500">
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <DollarSign
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  id="newFunctionalRateInput"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newFunctionalRate}
                  onChange={(e) => setNewFunctionalRate(e.target.value)}
                  placeholder="e.g. 65000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-green-950 placeholder:text-stone-400 focus:bg-white focus:border-green-800 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Promotion Rationale */}
          <div className="space-y-1.5">
            <label
              htmlFor="rationaleTextarea"
              className="block text-xs font-bold text-green-950"
            >
              Promotion Rationale / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="rationaleTextarea"
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Detail reasons for promotion: exemplary service, tenure milestones, advanced degree attainment, performance evaluation scores..."
              className="w-full p-3.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-medium text-green-950 placeholder:text-stone-400 focus:bg-white focus:border-green-800 outline-none leading-relaxed transition-all resize-none"
            />
            <p className="text-[11px] text-stone-500">
              This citation will appear on official promotion reports and career progression logs.
            </p>
          </div>

          {/* Supporting Document Upload */}
          <div className="space-y-1.5">
            <label
              htmlFor="promotionDocInput"
              className="block text-xs font-bold text-green-950"
            >
              Supporting Appointment Document (PDF){' '}
              <span className="text-[11px] font-normal text-stone-500">
                (Optional)
              </span>
            </label>
            <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/60 hover:bg-stone-50 transition-colors flex flex-col items-center justify-center text-center">
              <UploadCloud size={24} className="text-stone-400 mb-1.5" />
              <input
                id="promotionDocInput"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setDocumentFile(file);
                }}
                className="hidden"
              />
              <label
                htmlFor="promotionDocInput"
                className="text-xs font-semibold text-green-800 hover:text-green-900 cursor-pointer underline"
              >
                {documentFile ? 'Choose a different PDF' : 'Upload Promotion Memo or Board Resolution'}
              </label>
              {documentFile ? (
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  <FileText size={13} />
                  <span className="truncate max-w-xs">{documentFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setDocumentFile(null)}
                    className="text-stone-400 hover:text-stone-700 ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 mt-1">
                  PDF up to 10MB. Document will be saved under 201 Administrative Records.
                </p>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-stone-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={promoteMutation.isPending}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={promoteMutation.isPending}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                isAdmin
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-green-800 hover:bg-green-900'
              }`}
            >
              {promoteMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isAdmin ? (
                <>
                  <Award size={14} />
                  <span>Approve & Promote</span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  <span>Submit Recommendation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
