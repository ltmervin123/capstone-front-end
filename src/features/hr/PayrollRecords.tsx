import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { Logo } from '../../assets/common/Logo';
import {
  payrollService,
  type AdjustPayrollRecordPayload,
  type CreatePayrollRunPayload,
} from '../../services/payrollService';
import {
  Role,
  type PayrollRecord,
  type PayrollRun,
} from '../../types/types';

// Modular payroll subcomponents
import { PayrollKpiCards } from './payroll/PayrollKpiCards';
import { PayrollBatchManager } from './payroll/PayrollBatchManager';
import { PayrollFilterBar } from './payroll/PayrollFilterBar';
import { PayrollTable } from './payroll/PayrollTable';
import { CreatePayRunModal } from './payroll/CreatePayRunModal';
import { AdjustPayrollModal } from './payroll/AdjustPayrollModal';
import { PayslipReceiptModal } from './payroll/PayslipReceiptModal';
import { PayrollConfirmDialog } from './payroll/PayrollConfirmDialog';

export const PayrollRecords: React.FC = () => {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const isEmployeeAccount =
    currentUser?.role === Role.EMPLOYEE ||
    (!!currentUser?.employeeId && currentUser?.role !== Role.ADMIN);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');
  const [selectedRunId, setSelectedRunId] = useState<string>('ALL');

  // Modals & Feedback State
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
  const [adjustingRecord, setAdjustingRecord] = useState<PayrollRecord | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // React Queries
  const {
    data: payRuns = [],
    isLoading: isLoadingRuns,
  } = useQuery({
    queryKey: ['payroll', 'runs'],
    queryFn: () => payrollService.listPayrollRuns(),
    enabled: !isEmployeeAccount,
  });

  const {
    data: payrollList = [],
    isLoading: isLoadingRecords,
  } = useQuery({
    queryKey: ['payroll', 'records', selectedRunId, filterMonth, filterYear],
    queryFn: () =>
      payrollService.listPayrollRecords({
        payrollRunId: selectedRunId === 'ALL' ? undefined : selectedRunId,
        month: filterMonth === 'All' ? undefined : filterMonth,
        year: filterYear === 'All' ? undefined : Number(filterYear),
      }),
  });

  // Mutations
  const createRunMutation = useMutation({
    mutationFn: (payload: CreatePayrollRunPayload) =>
      payrollService.createPayrollRun(payload),
    onSuccess: (newRun) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setIsCreateRunOpen(false);
      setSelectedRunId(newRun.id);
      setFeedbackBanner({
        type: 'success',
        message: `Pay run "${newRun.name}" created successfully.`,
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to create pay run.',
      });
    },
  });

  const lockAttendanceMutation = useMutation({
    mutationFn: (runId: string) => payrollService.lockAttendance(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setFeedbackBanner({
        type: 'success',
        message: 'Attendance locked successfully. Batch is now ready for calculation.',
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to lock attendance.',
      });
    },
  });

  const unlockAttendanceMutation = useMutation({
    mutationFn: (runId: string) => payrollService.unlockAttendance(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setFeedbackBanner({
        type: 'success',
        message: 'Attendance unlocked. Pay run reverted to Draft.',
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to unlock attendance.',
      });
    },
  });

  const calculateMutation = useMutation({
    mutationFn: (runId: string) => payrollService.calculatePayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setFeedbackBanner({
        type: 'success',
        message: 'Payroll calculation finished. Line items are ready for review.',
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to calculate payroll.',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (runId: string) => payrollService.publishPayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setFeedbackBanner({
        type: 'success',
        message:
          'Payroll run published successfully! Payslips are now visible to employees.',
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to publish payroll.',
      });
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: (runId: string) => payrollService.deletePayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setSelectedRunId('ALL');
      setFeedbackBanner({
        type: 'success',
        message: 'Pay run deleted successfully.',
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to delete payroll run.',
      });
    },
  });

  const adjustRecordMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdjustPayrollRecordPayload;
    }) => payrollService.adjustPayrollRecord(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setAdjustingRecord(null);
      setFeedbackBanner({
        type: 'success',
        message: 'Payroll record adjustments saved successfully.',
      });
    },
    onError: (err: Error) => {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to adjust payroll record.',
      });
    },
  });

  // Filtered payroll records
  const filteredPayroll = useMemo(() => {
    return payrollList.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q))
      );
    });
  }, [payrollList, searchQuery]);

  // Aggregate metrics
  const visibleMetrics = useMemo(() => {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalGasoline = 0;

    filteredPayroll.forEach((p) => {
      totalGross += p.grossPay || p.basicSalary + p.allowances + p.gasoline;
      totalDeductions += p.totalDeductions;
      totalNet += p.netPay;
      totalGasoline += p.gasoline;
    });

    return { totalGross, totalDeductions, totalNet, totalGasoline };
  }, [filteredPayroll]);

  // Unique filter values
  const availableMonths = useMemo(() => {
    const list = payrollList.map((p) => p.month);
    return ['All', ...new Set(list)];
  }, [payrollList]);

  const availableYears = useMemo(() => {
    const list = payrollList.map((p) => p.year.toString());
    return ['All', ...new Set(list)];
  }, [payrollList]);

  const selectedRun = useMemo(() => {
    if (selectedRunId === 'ALL') return null;
    return payRuns.find((r) => r.id === selectedRunId) || null;
  }, [payRuns, selectedRunId]);

  // Confirmation Request Handlers
  const handleRequestPublish = (run: PayrollRun) => {
    setConfirmDialog({
      title: 'Publish Payslips',
      message: `Are you ready to publish "${run.name}"? Payslips will immediately become visible to all employees in their portal.`,
      confirmLabel: 'Publish Payslips',
      confirmVariant: 'primary',
      onConfirm: () => publishMutation.mutate(run.id),
    });
  };

  const handleRequestDelete = (run: PayrollRun) => {
    setConfirmDialog({
      title: 'Delete Pay Run',
      message: `Are you sure you want to delete pay run "${run.name}"? All calculated temporary line items for this batch will be cleared.`,
      confirmLabel: 'Delete Pay Run',
      confirmVariant: 'danger',
      onConfirm: () => deleteRunMutation.mutate(run.id),
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              {isEmployeeAccount ? 'My Payroll & Payslips' : 'Payroll Management Suite'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                {isEmployeeAccount
                  ? 'Personal verified compensation statements and payslips'
                  : 'Human Resources Information System'}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <Banknote size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  {isEmployeeAccount ? 'Payslip Portal' : 'HR Finance'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {!isEmployeeAccount && (
            <button
              type="button"
              onClick={() => setIsCreateRunOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
            >
              <Plus size={16} className="text-amber-300" />
              <span>New Pay Period</span>
            </button>
          )}
        </div>
      </header>

      {/* In-app Notification Feedback Banner */}
      {feedbackBanner && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition-all ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80'
              : 'bg-rose-50 text-rose-900 border-rose-200/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-700 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-stone-500 hover:text-stone-800 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <PayrollKpiCards
        metrics={visibleMetrics}
        isEmployeeAccount={isEmployeeAccount}
      />

      {/* Pay Runs Workflow Management Bar (Admins & HR) */}
      {!isEmployeeAccount && (
        <PayrollBatchManager
          payRuns={payRuns}
          isLoading={isLoadingRuns}
          selectedRunId={selectedRunId}
          onSelectRunId={setSelectedRunId}
          onLockAttendance={(id) => lockAttendanceMutation.mutate(id)}
          onUnlockAttendance={(id) => unlockAttendanceMutation.mutate(id)}
          onCalculate={(id) => calculateMutation.mutate(id)}
          onRequestPublish={handleRequestPublish}
          onRequestDelete={handleRequestDelete}
          isLockPending={lockAttendanceMutation.isPending}
          isUnlockPending={unlockAttendanceMutation.isPending}
          isCalculatePending={calculateMutation.isPending}
        />
      )}

      {/* Search & Filter Controls */}
      <PayrollFilterBar
        isEmployeeAccount={isEmployeeAccount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRun={selectedRun}
        onClearSelectedRun={() => setSelectedRunId('ALL')}
        filterMonth={filterMonth}
        onFilterMonthChange={setFilterMonth}
        filterYear={filterYear}
        onFilterYearChange={setFilterYear}
        availableMonths={availableMonths}
        availableYears={availableYears}
      />

      {/* Payroll Records Data Table */}
      <PayrollTable
        records={filteredPayroll}
        isLoading={isLoadingRecords}
        isEmployeeAccount={isEmployeeAccount}
        onViewPayslip={setViewingRecord}
        onAdjustRecord={setAdjustingRecord}
      />

      {/* Modals & Dialogs */}
      <CreatePayRunModal
        isOpen={isCreateRunOpen}
        onClose={() => setIsCreateRunOpen(false)}
        onSubmit={(payload) => createRunMutation.mutate(payload)}
        isPending={createRunMutation.isPending}
      />

      <AdjustPayrollModal
        key={adjustingRecord?.id ?? 'empty'}
        record={adjustingRecord}
        onClose={() => setAdjustingRecord(null)}
        onSubmit={(payload) => {
          if (adjustingRecord) {
            adjustRecordMutation.mutate({ id: adjustingRecord.id, payload });
          }
        }}
        isPending={adjustRecordMutation.isPending}
      />

      <PayslipReceiptModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      <PayrollConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
};
