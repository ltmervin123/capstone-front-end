import React from 'react';
import {
  Calendar,
  Clock,
  Lock,
  Unlock,
  Play,
  Calculator,
  Send,
  CheckCircle2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { PayrollRunStatus, type PayrollRun } from '../../../types/types';

interface PayrollBatchManagerProps {
  payRuns: PayrollRun[];
  isLoading: boolean;
  selectedRunId: string;
  onSelectRunId: (id: string) => void;
  onLockAttendance: (id: string) => void;
  onUnlockAttendance: (id: string) => void;
  onCalculate: (id: string) => void;
  onRequestPublish: (run: PayrollRun) => void;
  onRequestDelete: (run: PayrollRun) => void;
  isLockPending: boolean;
  isUnlockPending: boolean;
  isCalculatePending: boolean;
}

export const PayrollBatchManager: React.FC<PayrollBatchManagerProps> = ({
  payRuns,
  isLoading,
  selectedRunId,
  onSelectRunId,
  onLockAttendance,
  onUnlockAttendance,
  onCalculate,
  onRequestPublish,
  onRequestDelete,
  isLockPending,
  isUnlockPending,
  isCalculatePending,
}) => {
  return (
    <section
      aria-label="Pay run batch management"
      className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
            <Calendar size={22} className="text-amber-500" />
            Pay Run Batches & Lifecycle Control
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Lock attendance, run calculation engine, review line item adjustments,
            and publish employee payslips.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Filter pay run batches"
          className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedRunId === 'ALL'}
            onClick={() => onSelectRunId('ALL')}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
              selectedRunId === 'ALL'
                ? 'bg-green-900 text-amber-300 shadow-xs'
                : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
            }`}
          >
            All Pay Runs
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-3 text-stone-600">
          <Loader2 size={20} className="animate-spin text-green-800" />
          <span className="text-sm font-medium">Loading pay run batches...</span>
        </div>
      ) : payRuns.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-sm font-medium">
          No pay run batches created yet. Click &quot;New Pay Period&quot; above to initialize the first cutoff.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payRuns.map((run) => {
            const isSelected = selectedRunId === run.id;
            const statusBadge = {
              [PayrollRunStatus.DRAFT]: {
                bg: 'bg-stone-100 text-stone-700 border-stone-200',
                label: 'Draft',
                icon: Clock,
              },
              [PayrollRunStatus.ATTENDANCE_LOCKED]: {
                bg: 'bg-blue-50 text-blue-800 border-blue-200',
                label: 'Attendance Locked',
                icon: Lock,
              },
              [PayrollRunStatus.CALCULATED]: {
                bg: 'bg-purple-50 text-purple-800 border-purple-200',
                label: 'Calculated (Review Ready)',
                icon: Calculator,
              },
              [PayrollRunStatus.PUBLISHED]: {
                bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                label: 'Published (Live)',
                icon: CheckCircle2,
              },
            }[run.status];

            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={run.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRunId(run.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRunId(run.id);
                  }
                }}
                className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                  isSelected
                    ? 'border-green-800 bg-emerald-50/20 shadow-xs ring-2 ring-green-800/10'
                    : 'border-stone-200/80 bg-white hover:border-stone-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-green-950 line-clamp-1">
                      {run.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${statusBadge.bg}`}
                    >
                      <StatusIcon size={12} />
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono mt-1.5">
                    {run.startDate} to {run.endDate} ({run.cutoffType})
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-center">
                    <div>
                      <p className="text-[11px] text-stone-500 font-medium">Gross</p>
                      <p className="text-xs font-mono font-bold text-stone-800 tabular-nums mt-0.5">
                        ₱{run.totalGross.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-500 font-medium">Deductions</p>
                      <p className="text-xs font-mono font-bold text-rose-700 tabular-nums mt-0.5">
                        ₱{run.totalDeductions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-500 font-medium">Net Pay</p>
                      <p className="text-xs font-mono font-extrabold text-green-950 tabular-nums mt-0.5">
                        ₱{run.totalNet.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stage action buttons */}
                <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  {run.status === PayrollRunStatus.DRAFT && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLockAttendance(run.id);
                      }}
                      disabled={isLockPending}
                      className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-hidden disabled:opacity-50"
                    >
                      <Lock size={13} />
                      Lock Attendance
                    </button>
                  )}

                  {run.status === PayrollRunStatus.ATTENDANCE_LOCKED && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnlockAttendance(run.id);
                        }}
                        disabled={isUnlockPending}
                        className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden disabled:opacity-50"
                        title="Revert to Draft"
                      >
                        <Unlock size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCalculate(run.id);
                        }}
                        disabled={isCalculatePending}
                        className="flex-1 py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-800 focus-visible:outline-hidden disabled:opacity-50"
                      >
                        <Play size={13} />
                        Calculate Payroll
                      </button>
                    </>
                  )}

                  {run.status === PayrollRunStatus.CALCULATED && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCalculate(run.id);
                        }}
                        disabled={isCalculatePending}
                        className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-800 focus-visible:outline-hidden disabled:opacity-50"
                        title="Re-calculate Run"
                      >
                        <Calculator size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestPublish(run);
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:outline-hidden disabled:opacity-50"
                      >
                        <Send size={13} />
                        Publish Payslips
                      </button>
                    </>
                  )}

                  {run.status === PayrollRunStatus.PUBLISHED && (
                    <div className="flex-1 py-2 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={14} />
                      Released to Portal
                    </div>
                  )}

                  {run.status !== PayrollRunStatus.PUBLISHED && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete(run);
                      }}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:outline-hidden"
                      title="Delete pay run"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
