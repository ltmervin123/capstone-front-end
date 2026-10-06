import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Banknote,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Coins,
  TrendingUp,
  Calculator,
  Lock,
  Unlock,
  Send,
  Eye,
  Printer,
  Calendar,
  AlertCircle,
  Loader2,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { Logo } from '../../assets/common/Logo.tsx';
import {
  payrollService,
  type AdjustPayrollRecordPayload,
  type CreatePayrollRunPayload,
} from '../../services/payrollService';
import {
  CutoffType,
  PayrollRunStatus,
  Role,
  type PayrollRecord,
} from '../../types/types';
import { motion, AnimatePresence } from 'motion/react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PayrollRecords: React.FC = () => {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const isEmployeeAccount =
    currentUser?.role === Role.EMPLOYEE || (!!currentUser?.employeeId && currentUser?.role !== Role.ADMIN);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');
  const [selectedRunId, setSelectedRunId] = useState<string>('ALL');

  // Modals
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
  const [adjustingRecord, setAdjustingRecord] = useState<PayrollRecord | null>(null);

  // New Pay Run Form State
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const [newRunName, setNewRunName] = useState(`${MONTH_NAMES[currentMonthIdx]} ${currentYear} - Monthly`);
  const [newRunCutoff, setNewRunCutoff] = useState<CutoffType>(CutoffType.MONTHLY);
  const [newRunStartDate, setNewRunStartDate] = useState(
    new Date(currentYear, currentMonthIdx, 1).toISOString().slice(0, 10)
  );
  const [newRunEndDate, setNewRunEndDate] = useState(
    new Date(currentYear, currentMonthIdx + 1, 0).toISOString().slice(0, 10)
  );

  // Adjustment Form State
  const [adjDaysWorked, setAdjDaysWorked] = useState<number>(22);
  const [adjFunctionalRate, setAdjFunctionalRate] = useState<number>(1500);
  const [adjAllowances, setAdjAllowances] = useState<number>(3000);
  const [adjGasoline, setAdjGasoline] = useState<number>(1000);
  const [adjTardinessMinutes, setAdjTardinessMinutes] = useState<number>(0);
  const [adjSss, setAdjSss] = useState<number>(1350);
  const [adjPhilHealth, setAdjPhilHealth] = useState<number>(825);
  const [adjPagIbig, setAdjPagIbig] = useState<number>(200);
  const [adjTax, setAdjTax] = useState<number>(0);
  const [adjCashAdvance, setAdjCashAdvance] = useState<number>(0);
  const [adjOtherDeductions, setAdjOtherDeductions] = useState<number>(0);

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
    mutationFn: (payload: CreatePayrollRunPayload) => payrollService.createPayrollRun(payload),
    onSuccess: (newRun) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setIsCreateRunOpen(false);
      setSelectedRunId(newRun.id);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create pay run');
    },
  });

  const lockAttendanceMutation = useMutation({
    mutationFn: (runId: string) => payrollService.lockAttendance(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to lock attendance');
    },
  });

  const unlockAttendanceMutation = useMutation({
    mutationFn: (runId: string) => payrollService.unlockAttendance(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to unlock attendance');
    },
  });

  const calculateMutation = useMutation({
    mutationFn: (runId: string) => payrollService.calculatePayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to calculate payroll');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (runId: string) => payrollService.publishPayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      alert('Payroll run published successfully! Payslips are now available to employees.');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to publish payroll');
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: (runId: string) => payrollService.deletePayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setSelectedRunId('ALL');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete payroll run');
    },
  });

  const adjustRecordMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustPayrollRecordPayload }) =>
      payrollService.adjustPayrollRecord(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setAdjustingRecord(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to adjust payroll record');
    },
  });

  // Cutoff selection presets
  const handleCutoffTypeChange = (type: CutoffType) => {
    setNewRunCutoff(type);
    const d = new Date(newRunStartDate);
    const y = d.getFullYear();
    const m = d.getMonth();

    if (type === CutoffType.MONTHLY) {
      setNewRunName(`${MONTH_NAMES[m]} ${y} - Monthly`);
      setNewRunStartDate(new Date(y, m, 1).toISOString().slice(0, 10));
      setNewRunEndDate(new Date(y, m + 1, 0).toISOString().slice(0, 10));
    } else if (type === CutoffType.FIRST_HALF) {
      setNewRunName(`${MONTH_NAMES[m]} ${y} - 1st Cutoff`);
      setNewRunStartDate(new Date(y, m, 1).toISOString().slice(0, 10));
      setNewRunEndDate(new Date(y, m, 15).toISOString().slice(0, 10));
    } else if (type === CutoffType.SECOND_HALF) {
      setNewRunName(`${MONTH_NAMES[m]} ${y} - 2nd Cutoff`);
      setNewRunStartDate(new Date(y, m, 16).toISOString().slice(0, 10));
      setNewRunEndDate(new Date(y, m + 1, 0).toISOString().slice(0, 10));
    }
  };

  // Open adjustment modal
  const handleOpenAdjust = (rec: PayrollRecord) => {
    setAdjustingRecord(rec);
    setAdjDaysWorked(rec.daysWorked);
    setAdjFunctionalRate(rec.functionalRate);
    setAdjAllowances(rec.allowances);
    setAdjGasoline(rec.gasoline);
    setAdjTardinessMinutes(rec.tardinessMinutes);
    setAdjSss(rec.sssDeduction);
    setAdjPhilHealth(rec.philHealthDeduction);
    setAdjPagIbig(rec.pagIbigDeduction);
    setAdjTax(rec.taxWithheld);
    setAdjCashAdvance(rec.cashAdvance);
    setAdjOtherDeductions(rec.otherDeductions);
  };

  // Live adjustment calculations
  const adjBasicSalaryCalc = useMemo(() => adjFunctionalRate * adjDaysWorked, [adjFunctionalRate, adjDaysWorked]);
  const adjGrossPayCalc = useMemo(
    () => adjBasicSalaryCalc + adjAllowances + adjGasoline,
    [adjBasicSalaryCalc, adjAllowances, adjGasoline]
  );
  const adjTardinessCalc = useMemo(() => {
    const minuteRate = adjFunctionalRate / 8 / 60;
    return Math.round(minuteRate * adjTardinessMinutes * 100) / 100;
  }, [adjFunctionalRate, adjTardinessMinutes]);
  const adjTotalDeductionsCalc = useMemo(
    () =>
      Math.round(
        (adjTardinessCalc +
          adjSss +
          adjPhilHealth +
          adjPagIbig +
          adjTax +
          adjCashAdvance +
          adjOtherDeductions) *
          100
      ) / 100,
    [adjTardinessCalc, adjSss, adjPhilHealth, adjPagIbig, adjTax, adjCashAdvance, adjOtherDeductions]
  );
  const adjNetPayCalc = useMemo(
    () => Math.round((adjGrossPayCalc - adjTotalDeductionsCalc) * 100) / 100,
    [adjGrossPayCalc, adjTotalDeductionsCalc]
  );

  // Submit adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingRecord) return;
    adjustRecordMutation.mutate({
      id: adjustingRecord.id,
      payload: {
        daysWorked: adjDaysWorked,
        functionalRate: adjFunctionalRate,
        allowances: adjAllowances,
        gasoline: adjGasoline,
        tardinessMinutes: adjTardinessMinutes,
        sssDeduction: adjSss,
        philHealthDeduction: adjPhilHealth,
        pagIbigDeduction: adjPagIbig,
        taxWithheld: adjTax,
        cashAdvance: adjCashAdvance,
        otherDeductions: adjOtherDeductions,
      },
    });
  };

  // Filtered payroll records
  const filteredPayroll = useMemo(() => {
    return payrollList.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q));
      return matchesSearch;
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

  // Unique months & years
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

  return (
    <div className="space-y-6">
      {/* Header View */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-16 h-16" />
          <div>
            <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
              {isEmployeeAccount ? 'My Payroll Payslips' : 'Payroll Management Suite'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                {isEmployeeAccount
                  ? 'Your personal verified monthly payroll logs and payslips'
                  : 'Pay Runs, Attendance Lock, Statutory Contributions & Payslip Publishing'}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900 rounded-full shadow-sm">
                <Banknote size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  {isEmployeeAccount ? 'PAYSLIP CENTER' : 'HR FINANCE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!isEmployeeAccount && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateRunOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-yellow-400 text-green-950 hover:bg-yellow-500 transition-colors font-black rounded-xl shadow-lg border border-yellow-500/20 text-xs uppercase cursor-pointer"
            >
              <Plus size={16} />
              New Pay Period
            </button>
          </div>
        )}
      </header>

      {/* Aggregate Overview Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? 'My Net Take-Home Pay' : 'Total Net Distribution'}
            </span>
            <div className="p-2 bg-green-50 text-green-800 rounded-xl">
              <Coins size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-green-950">₱{visibleMetrics.totalNet.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? 'Your released take-home salary' : 'Total payout across listed records'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? 'My Gross Earnings' : 'Total Gross Earnings'}
            </span>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-blue-950">₱{visibleMetrics.totalGross.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? 'Basic pay plus allowances' : 'Basic salaries + fuel + allowances'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? 'My Total Deductions' : 'Total Deductions'}
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Calculator size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-rose-950">₱{visibleMetrics.totalDeductions.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? 'SSS, PhilHealth, Pag-IBIG & tax' : 'Statutory shares, tardiness & advances'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? 'My Fuel Allowance' : 'Total Fuel Allowances'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-950">₱{visibleMetrics.totalGasoline.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? 'Travel & mobility subsidies' : 'Mobility allocations distributed'}
            </p>
          </div>
        </div>
      </div>

      {/* ADMIN & HR: PAY RUNS WORKFLOW MANAGEMENT BAR */}
      {!isEmployeeAccount && (
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-green-950 uppercase tracking-tight flex items-center gap-2">
                <Calendar size={16} className="text-yellow-600" />
                Pay Run Batches & Lifecycle Control
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                Lock Attendance ➔ Run Calculation Engine ➔ Review & Adjust ➔ Publish Payslips
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedRunId('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRunId === 'ALL'
                    ? 'bg-green-900 text-yellow-400 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Pay Runs
              </button>
            </div>
          </div>

          {/* Pay Run Cards Carousel / Grid */}
          {isLoadingRuns ? (
            <div className="py-8 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin text-green-800" />
              <span className="text-xs font-bold">Loading pay run batches...</span>
            </div>
          ) : payRuns.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs font-bold">
              No pay run batches created yet. Click "New Pay Period" above to start!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {payRuns.map((run) => {
                const isSelected = selectedRunId === run.id;
                const statusBadge = {
                  [PayrollRunStatus.DRAFT]: {
                    bg: 'bg-amber-50 text-amber-800 border-amber-200',
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

                const Icon = statusBadge.icon;

                return (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-green-800 bg-green-50/20 shadow-md ring-2 ring-green-800/10'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs text-green-950 uppercase tracking-tight line-clamp-1">
                          {run.name}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${statusBadge.bg}`}
                        >
                          <Icon size={10} />
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">
                        {run.startDate} to {run.endDate} ({run.cutoffType})
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 bg-gray-50/70 p-2.5 rounded-xl text-center">
                        <div>
                          <p className="text-[8px] text-gray-400 uppercase font-black">Gross</p>
                          <p className="text-[11px] font-mono font-bold text-gray-800">
                            ₱{run.totalGross.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-400 uppercase font-black">Deductions</p>
                          <p className="text-[11px] font-mono font-bold text-rose-700">
                            ₱{run.totalDeductions.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-400 uppercase font-black">Net Pay</p>
                          <p className="text-[11px] font-mono font-black text-green-900">
                            ₱{run.totalNet.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stage action buttons */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                      {run.status === PayrollRunStatus.DRAFT && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            lockAttendanceMutation.mutate(run.id);
                          }}
                          disabled={lockAttendanceMutation.isPending}
                          className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        >
                          <Lock size={11} />
                          Lock Attendance
                        </button>
                      )}

                      {run.status === PayrollRunStatus.ATTENDANCE_LOCKED && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unlockAttendanceMutation.mutate(run.id);
                            }}
                            disabled={unlockAttendanceMutation.isPending}
                            className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            title="Revert to Draft"
                          >
                            <Unlock size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              calculateMutation.mutate(run.id);
                            }}
                            disabled={calculateMutation.isPending}
                            className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                          >
                            <Play size={11} />
                            Calculate Payroll
                          </button>
                        </>
                      )}

                      {run.status === PayrollRunStatus.CALCULATED && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              calculateMutation.mutate(run.id);
                            }}
                            disabled={calculateMutation.isPending}
                            className="py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            title="Re-calculate Run"
                          >
                            <Calculator size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you ready to publish "${run.name}"? Payslips will be visible to employees.`)) {
                                publishMutation.mutate(run.id);
                              }
                            }}
                            disabled={publishMutation.isPending}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                          >
                            <Send size={11} />
                            Publish Payslips
                          </button>
                        </>
                      )}

                      {run.status === PayrollRunStatus.PUBLISHED && (
                        <div className="flex-1 py-1 text-center text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} />
                          Released to Portal
                        </div>
                      )}

                      {run.status !== PayrollRunStatus.PUBLISHED && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete pay run "${run.name}"?`)) {
                              deleteRunMutation.mutate(run.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Delete pay run"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div
        className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row items-center ${
          isEmployeeAccount ? 'justify-end' : 'justify-between'
        } gap-4`}
      >
        {!isEmployeeAccount && (
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee by name, ID or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-green-950 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-green-800 bg-gray-50/50"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Selected Run Label */}
          {selectedRun && (
            <div className="px-3 py-1 bg-green-50 text-green-900 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>Run: {selectedRun.name}</span>
              <button
                onClick={() => setSelectedRunId('ALL')}
                className="hover:text-green-700 text-gray-400 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Month:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-100 bg-white text-xs font-bold rounded-xl text-green-950"
            >
              {availableMonths.map((m, idx) => (
                <option key={idx} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Year:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-100 bg-white text-xs font-bold rounded-xl text-green-950"
            >
              {availableYears.map((y, idx) => (
                <option key={idx} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PAYROLL RECORDS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-50/40 border-b border-gray-100">
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                  Period & Cutoff
                </th>
                {!isEmployeeAccount && (
                  <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">
                    Employee
                  </th>
                )}
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-center">
                  Days
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-right">
                  Basic Pay
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-rose-800 uppercase tracking-widest text-right bg-rose-50/10">
                  Deductions
                </th>
                <th className="px-5 py-3.5 text-[10px] font-black text-green-900 uppercase tracking-widest text-right bg-green-50/10">
                  Net Take-Home
                </th>
                {!isEmployeeAccount && (
                  <th className="px-4 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-center">
                    Status
                  </th>
                )}
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {isLoadingRecords ? (
                <tr>
                  <td colSpan={isEmployeeAccount ? 6 : 8} className="px-6 py-12 text-center text-gray-400 font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-green-800" />
                      <span>Loading payroll records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={isEmployeeAccount ? 6 : 8} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No payroll data matched the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-green-50/10 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-green-900">
                          {p.month} {p.year}
                        </span>
                        {p.payrollRunName && (
                          <p className="text-[10px] text-gray-400 font-medium">{p.payrollRunName}</p>
                        )}
                      </td>
                      {!isEmployeeAccount && (
                        <td className="px-5 py-4">
                          <p className="font-bold text-green-950 leading-tight">{p.employeeName}</p>
                          <p className="text-[10px] text-gray-400 font-mono tracking-tight">
                            {p.employeeId} {p.department ? `• ${p.department}` : ''}
                          </p>
                        </td>
                      )}
                      <td className="px-5 py-4 font-mono font-bold text-gray-600 text-center">
                        {p.daysWorked}d
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-gray-800 text-right">
                        ₱{p.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-rose-650 text-right bg-rose-50/5">
                        ₱{p.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-mono font-black text-green-950 text-right bg-green-50/20 text-sm">
                        ₱{p.netPay.toLocaleString()}
                      </td>
                      {!isEmployeeAccount && (
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              p.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-850 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingRecord(p)}
                            className="p-1.5 bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="View official payslip receipt"
                          >
                            <Eye size={13} />
                          </button>
                          {!isEmployeeAccount && (
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="p-1.5 bg-green-50 text-green-800 hover:bg-yellow-400 hover:text-green-950 rounded-lg transition-all cursor-pointer"
                              title="Adjust line items"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW PAY RUN MODAL */}
      <AnimatePresence>
        {isCreateRunOpen && (
          <div className="fixed inset-0 bg-green-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg border border-green-50 shadow-2xl overflow-hidden flex flex-col my-8"
            >
              <div className="bg-green-900 px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <Calendar className="text-yellow-400" size={20} />
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight">Open New Pay Period</h3>
                    <p className="text-[10px] text-green-200 font-bold uppercase tracking-wider">
                      Northern Mindanao Colleges, Inc.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateRunOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createRunMutation.mutate({
                    name: newRunName,
                    cutoffType: newRunCutoff,
                    startDate: newRunStartDate,
                    endDate: newRunEndDate,
                  });
                }}
                className="p-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Pay Period Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRunName}
                    onChange={(e) => setNewRunName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-green-950 bg-gray-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Cutoff Cycle Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCutoffTypeChange(CutoffType.MONTHLY)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        newRunCutoff === CutoffType.MONTHLY
                          ? 'border-green-800 bg-green-50 text-green-950 shadow-xs'
                          : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Full Month (1st–End)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCutoffTypeChange(CutoffType.FIRST_HALF)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        newRunCutoff === CutoffType.FIRST_HALF
                          ? 'border-green-800 bg-green-50 text-green-950 shadow-xs'
                          : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      1st Half (1st–15th)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCutoffTypeChange(CutoffType.SECOND_HALF)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        newRunCutoff === CutoffType.SECOND_HALF
                          ? 'border-green-800 bg-green-50 text-green-950 shadow-xs'
                          : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      2nd Half (16th–End)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRunCutoff(CutoffType.CUSTOM)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        newRunCutoff === CutoffType.CUSTOM
                          ? 'border-green-800 bg-green-50 text-green-950 shadow-xs'
                          : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Custom Dates
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newRunStartDate}
                      onChange={(e) => setNewRunStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-green-950 bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newRunEndDate}
                      onChange={(e) => setNewRunEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-green-950 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-start gap-2 text-[10px] text-amber-900 font-medium">
                  <AlertCircle size={14} className="shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    New pay runs begin in <b>DRAFT</b> status. Once created, you can Lock Attendance and run the
                    automated calculation engine.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateRunOpen(false)}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 rounded-xl text-xs font-bold text-gray-600 uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRunMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-900 hover:bg-green-850 text-yellow-400 font-extrabold rounded-xl transition-all shadow-md text-xs uppercase cursor-pointer"
                  >
                    {createRunMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Initialize Pay Period
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADJUST PAYROLL RECORD MODAL */}
      <AnimatePresence>
        {adjustingRecord && (
          <div className="fixed inset-0 bg-green-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-green-50 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              <div className="bg-green-900 px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <Calculator className="text-yellow-400" size={20} />
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight">Adjust Payroll Record</h3>
                    <p className="text-[10px] text-green-200 font-bold uppercase tracking-wider">
                      {adjustingRecord.employeeName} ({adjustingRecord.employeeId}) • {adjustingRecord.month}{' '}
                      {adjustingRecord.year}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAdjustingRecord(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAdjustment} className="p-6 overflow-y-auto space-y-5">
                {/* Earnings Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-green-900 uppercase tracking-wider border-b border-gray-100 pb-1">
                    1. Earnings Adjustments
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Daily Rate (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjFunctionalRate}
                        onChange={(e) => setAdjFunctionalRate(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Days Worked
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={adjDaysWorked}
                        onChange={(e) => setAdjDaysWorked(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Allowances (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjAllowances}
                        onChange={(e) => setAdjAllowances(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Gasoline (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjGasoline}
                        onChange={(e) => setAdjGasoline(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Statutory & Taxes Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider border-b border-gray-100 pb-1">
                    2. Mandatory Statutory Contributions & Taxes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        SSS Share (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjSss}
                        onChange={(e) => setAdjSss(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        PhilHealth (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjPhilHealth}
                        onChange={(e) => setAdjPhilHealth(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Pag-IBIG (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjPagIbig}
                        onChange={(e) => setAdjPagIbig(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Withholding Tax (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjTax}
                        onChange={(e) => setAdjTax(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Tardiness & Other Deductions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider border-b border-gray-100 pb-1">
                    3. Tardiness & Special Deductions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Tardiness (Mins)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={adjTardinessMinutes}
                        onChange={(e) => setAdjTardinessMinutes(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                      <p className="text-[8px] text-gray-400">Ded: ₱{adjTardinessCalc.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Cash Advance (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjCashAdvance}
                        onChange={(e) => setAdjCashAdvance(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                        Other Deductions (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={adjOtherDeductions}
                        onChange={(e) => setAdjOtherDeductions(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-rose-100 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-Time Formula Recalculation Panel */}
                <div className="bg-green-950 text-white rounded-2xl p-4 border border-green-900 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-400">
                    <Calculator size={13} />
                    <span>Real-Time Audit Formula Output</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <div>
                      <p className="text-emerald-300/80 text-[9px] uppercase">Gross Earnings</p>
                      <p className="font-mono text-sm mt-0.5">₱{adjGrossPayCalc.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-rose-300/80 text-[9px] uppercase">Total Deductions</p>
                      <p className="font-mono text-sm mt-0.5">₱{adjTotalDeductionsCalc.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-300/80 text-[9px] uppercase">Computed Net Pay</p>
                      <p className="font-mono text-base font-black text-yellow-400 mt-0.5">
                        ₱{adjNetPayCalc.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingRecord(null)}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 rounded-xl text-xs font-bold text-gray-600 uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustRecordMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-900 hover:bg-green-850 text-yellow-400 font-extrabold rounded-xl transition-all shadow-md text-xs uppercase cursor-pointer"
                  >
                    {adjustRecordMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Save Adjustments
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICIAL PRINTABLE PAYSLIP RECEIPT MODAL */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 bg-green-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg border border-green-50 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-green-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Banknote className="text-yellow-400" size={18} />
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">NMC Member Payslip</h3>
                    <p className="text-[9px] text-green-200 font-bold uppercase tracking-wider">
                      Official Monthly Compensation Statement
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
                    title="Print Payslip"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => setViewingRecord(null)}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5" id="payslip-print-section">
                {/* Header Identity */}
                <div className="text-center pb-4 border-b border-gray-100 flex flex-col items-center">
                  <Logo className="w-14 h-14 mb-2" />
                  <h2 className="text-lg font-black text-green-950 uppercase tracking-tight">
                    Northern Mindanao Colleges, Inc.
                  </h2>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    A.D. Curato St., Cabadbaran City, Agusan del Norte
                  </p>
                  <div className="mt-2.5 px-3 py-0.5 bg-green-50 text-green-900 font-black text-[9px] uppercase rounded-full tracking-widest border border-green-200">
                    Official Employee Payslip Receipt
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Employee</p>
                    <p className="font-extrabold text-green-950">{viewingRecord.employeeName}</p>
                    <p className="text-[9px] font-mono text-gray-500">
                      {viewingRecord.employeeId} {viewingRecord.position ? `• ${viewingRecord.position}` : ''}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Pay Period</p>
                    <p className="font-extrabold text-green-950">
                      {viewingRecord.month} {viewingRecord.year}
                    </p>
                    <p className="text-[9px] font-mono text-gray-500">Ref: {viewingRecord.id.slice(-8)}</p>
                  </div>
                </div>

                {/* Breakdown Sections */}
                <div className="space-y-4">
                  {/* Gross Earnings */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-green-800 tracking-wider mb-1.5 border-b border-green-100 pb-1">
                      1. Gross Earnings Breakdown
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">
                          Daily Functional Rate ({viewingRecord.daysWorked} days)
                        </span>
                        <span className="font-mono font-bold text-gray-800">
                          ₱{viewingRecord.functionalRate.toLocaleString()} / day
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">Basic Pay Salary (Rate × Days)</span>
                        <span className="font-mono font-bold text-gray-800">
                          ₱{viewingRecord.basicSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">COLA / Basic Allowances</span>
                        <span className="font-mono font-bold text-gray-800">
                          ₱{viewingRecord.allowances.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">Gasoline & Travel Subsidy</span>
                        <span className="font-mono font-bold text-gray-800">
                          ₱{viewingRecord.gasoline.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold text-green-950 bg-green-50/40 px-2.5 rounded-xl border border-green-100/40">
                        <span>Total Gross Earnings</span>
                        <span className="font-mono font-black">
                          ₱{(viewingRecord.grossPay || viewingRecord.basicSalary + viewingRecord.allowances + viewingRecord.gasoline).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Breakdown */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-rose-850 tracking-wider mb-1.5 border-b border-rose-100 pb-1">
                      2. Statutory Contributions & Deductions
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {viewingRecord.tardinessDeduction > 0 && (
                        <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                          <span className="text-gray-500">
                            Tardiness Penalty ({viewingRecord.tardinessMinutes} mins late)
                          </span>
                          <span className="font-mono font-bold text-rose-700">
                            ₱{viewingRecord.tardinessDeduction.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">SSS Employee Contribution</span>
                        <span className="font-mono font-bold text-rose-700">
                          ₱{viewingRecord.sssDeduction.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">PhilHealth Employee Contribution</span>
                        <span className="font-mono font-bold text-rose-700">
                          ₱{viewingRecord.philHealthDeduction.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                        <span className="text-gray-500">Pag-IBIG (HDMF) Contribution</span>
                        <span className="font-mono font-bold text-rose-700">
                          ₱{viewingRecord.pagIbigDeduction.toLocaleString()}
                        </span>
                      </div>
                      {viewingRecord.taxWithheld > 0 && (
                        <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                          <span className="text-gray-500">BIR Withholding Tax</span>
                          <span className="font-mono font-bold text-rose-700">
                            ₱{viewingRecord.taxWithheld.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {viewingRecord.cashAdvance > 0 && (
                        <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                          <span className="text-gray-500">Cash Advance Reimbursement</span>
                          <span className="font-mono font-bold text-rose-700">
                            ₱{viewingRecord.cashAdvance.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {viewingRecord.otherDeductions > 0 && (
                        <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                          <span className="text-gray-500">Other Deductions</span>
                          <span className="font-mono font-bold text-rose-700">
                            ₱{viewingRecord.otherDeductions.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 font-bold text-rose-950 bg-rose-50/40 px-2.5 rounded-xl border border-rose-100/40">
                        <span>Total Deductions</span>
                        <span className="font-mono font-black text-rose-800">
                          ₱{viewingRecord.totalDeductions.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Take-Home Box */}
                <div className="bg-green-950 text-white rounded-2xl p-4 border border-green-900 text-center space-y-0.5">
                  <p className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">
                    NET TAKE-HOME PAYOUT
                  </p>
                  <p className="text-2xl font-black font-mono text-yellow-400">
                    ₱{viewingRecord.netPay.toLocaleString()}
                  </p>
                  <p className="text-[8px] text-green-200/70 font-medium uppercase tracking-wider">
                    NORTHERN MINDANAO COLLEGES, INC.
                  </p>
                </div>

                {/* Physical Signing Footer for Printing */}
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-6 text-[9px] text-gray-400 font-bold uppercase mt-2">
                  <div className="border-t border-gray-300 pt-1 text-center">
                    <p className="text-green-950 font-black leading-tight">CHIEF FINANCE OFFICER</p>
                    <p className="text-[8px] text-gray-400">Authorizing Officer</p>
                  </div>
                  <div className="border-t border-gray-300 pt-1 text-center">
                    <p className="text-green-950 font-black leading-tight">EMPLOYEE SIGNATURE</p>
                    <p className="text-[8px] text-gray-400">Acknowledgment of Release</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="px-5 py-2 bg-green-900 hover:bg-green-850 text-yellow-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Close Payslip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
