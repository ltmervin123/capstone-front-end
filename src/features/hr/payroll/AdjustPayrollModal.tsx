import React, { useState, useMemo } from 'react';
import { Calculator, X, Loader2, Check } from 'lucide-react';
import type { PayrollRecord } from '../../../types/types';
import type { AdjustPayrollRecordPayload } from '../../../services/payrollService';
import { motion, AnimatePresence } from 'motion/react';

interface AdjustPayrollModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
  onSubmit: (payload: AdjustPayrollRecordPayload) => void;
  isPending: boolean;
}

export const AdjustPayrollModal: React.FC<AdjustPayrollModalProps> = ({
  record,
  onClose,
  onSubmit,
  isPending,
}) => {
  const [adjDaysWorked, setAdjDaysWorked] = useState<number>(
    record?.daysWorked ?? 22
  );
  const [adjFunctionalRate, setAdjFunctionalRate] = useState<number>(
    record?.functionalRate ?? 1500
  );
  const [adjAllowances, setAdjAllowances] = useState<number>(
    record?.allowances ?? 3000
  );
  const [adjGasoline, setAdjGasoline] = useState<number>(
    record?.gasoline ?? 1000
  );
  const [adjTardinessMinutes, setAdjTardinessMinutes] = useState<number>(
    record?.tardinessMinutes ?? 0
  );
  const [adjSss, setAdjSss] = useState<number>(record?.sssDeduction ?? 1350);
  const [adjPhilHealth, setAdjPhilHealth] = useState<number>(
    record?.philHealthDeduction ?? 825
  );
  const [adjPagIbig, setAdjPagIbig] = useState<number>(
    record?.pagIbigDeduction ?? 200
  );
  const [adjTax, setAdjTax] = useState<number>(record?.taxWithheld ?? 0);
  const [adjCashAdvance, setAdjCashAdvance] = useState<number>(
    record?.cashAdvance ?? 0
  );
  const [adjOtherDeductions, setAdjOtherDeductions] = useState<number>(
    record?.otherDeductions ?? 0
  );

  // Live adjustment calculations
  const adjBasicSalaryCalc = useMemo(
    () => adjFunctionalRate * adjDaysWorked,
    [adjFunctionalRate, adjDaysWorked]
  );
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
    [
      adjTardinessCalc,
      adjSss,
      adjPhilHealth,
      adjPagIbig,
      adjTax,
      adjCashAdvance,
      adjOtherDeductions,
    ]
  );
  const adjNetPayCalc = useMemo(
    () => Math.round((adjGrossPayCalc - adjTotalDeductionsCalc) * 100) / 100,
    [adjGrossPayCalc, adjTotalDeductionsCalc]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
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
    });
  };

  return (
    <AnimatePresence>
      {record && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-record-title"
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh] relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3
                    id="adjust-record-title"
                    className="font-bold text-lg text-green-950 tracking-tight"
                  >
                    Adjust Payroll Record
                  </h3>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    {record.employeeName} ({record.employeeId}) • {record.month}{' '}
                    {record.year}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 space-y-0"
            >
              <div className="p-6 space-y-5">
                {/* Earnings Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-green-950 pb-1.5 border-b border-stone-200/80">
                    1. Earnings Adjustments
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-functional-rate"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Daily Rate (₱)
                      </label>
                      <input
                        id="adj-functional-rate"
                        type="number"
                        min={0}
                        step="any"
                        value={adjFunctionalRate}
                        onChange={(e) =>
                          setAdjFunctionalRate(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-days-worked"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Days Worked
                      </label>
                      <input
                        id="adj-days-worked"
                        type="number"
                        min={0}
                        max={31}
                        value={adjDaysWorked}
                        onChange={(e) =>
                          setAdjDaysWorked(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-allowances"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Allowances (₱)
                      </label>
                      <input
                        id="adj-allowances"
                        type="number"
                        min={0}
                        step="any"
                        value={adjAllowances}
                        onChange={(e) =>
                          setAdjAllowances(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-gasoline"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Gasoline (₱)
                      </label>
                      <input
                        id="adj-gasoline"
                        type="number"
                        min={0}
                        step="any"
                        value={adjGasoline}
                        onChange={(e) =>
                          setAdjGasoline(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Statutory & Taxes Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-rose-900 pb-1.5 border-b border-stone-200/80">
                    2. Mandatory Statutory Contributions & Taxes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-sss"
                        className="text-xs font-semibold text-stone-600"
                      >
                        SSS Share (₱)
                      </label>
                      <input
                        id="adj-sss"
                        type="number"
                        min={0}
                        step="any"
                        value={adjSss}
                        onChange={(e) => setAdjSss(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-rose-50/20 border border-rose-200 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-rose-700 focus:ring-1 focus:ring-rose-700 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-philhealth"
                        className="text-xs font-semibold text-stone-600"
                      >
                        PhilHealth (₱)
                      </label>
                      <input
                        id="adj-philhealth"
                        type="number"
                        min={0}
                        step="any"
                        value={adjPhilHealth}
                        onChange={(e) =>
                          setAdjPhilHealth(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-rose-50/20 border border-rose-200 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-rose-700 focus:ring-1 focus:ring-rose-700 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-pagibig"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Pag-IBIG (₱)
                      </label>
                      <input
                        id="adj-pagibig"
                        type="number"
                        min={0}
                        step="any"
                        value={adjPagIbig}
                        onChange={(e) =>
                          setAdjPagIbig(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-rose-50/20 border border-rose-200 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-rose-700 focus:ring-1 focus:ring-rose-700 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-tax"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Tax Withheld (₱)
                      </label>
                      <input
                        id="adj-tax"
                        type="number"
                        min={0}
                        step="any"
                        value={adjTax}
                        onChange={(e) => setAdjTax(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-rose-50/20 border border-rose-200 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-rose-700 focus:ring-1 focus:ring-rose-700 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Tardiness & Other Deductions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 pb-1.5 border-b border-stone-200/80">
                    3. Tardiness & Special Deductions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-tardiness"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Tardiness (Mins)
                      </label>
                      <input
                        id="adj-tardiness"
                        type="number"
                        min={0}
                        value={adjTardinessMinutes}
                        onChange={(e) =>
                          setAdjTardinessMinutes(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        Deduction: ₱{adjTardinessCalc.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-cash-advance"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Cash Advance (₱)
                      </label>
                      <input
                        id="adj-cash-advance"
                        type="number"
                        min={0}
                        step="any"
                        value={adjCashAdvance}
                        onChange={(e) =>
                          setAdjCashAdvance(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="adj-other-deductions"
                        className="text-xs font-semibold text-stone-600"
                      >
                        Other Deductions (₱)
                      </label>
                      <input
                        id="adj-other-deductions"
                        type="number"
                        min={0}
                        step="any"
                        value={adjOtherDeductions}
                        onChange={(e) =>
                          setAdjOtherDeductions(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold font-mono text-stone-900 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 focus-visible:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-Time Formula Recalculation Panel */}
                <div className="bg-stone-900 text-white rounded-xl p-4 border border-stone-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Calculator size={15} />
                    <span>Real-Time Audit Formula Output</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-emerald-300 text-xs font-medium">
                        Gross Earnings
                      </p>
                      <p className="font-mono text-base font-bold tabular-nums mt-0.5 text-white">
                        ₱{adjGrossPayCalc.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-rose-300 text-xs font-medium">
                        Total Deductions
                      </p>
                      <p className="font-mono text-base font-bold tabular-nums mt-0.5 text-white">
                        ₱{adjTotalDeductionsCalc.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-300 text-xs font-medium">
                        Computed Net Pay
                      </p>
                      <p className="font-mono text-lg font-extrabold text-amber-300 tabular-nums mt-0.5">
                        ₱{adjNetPayCalc.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="p-4 sm:px-6 bg-stone-50/80 border-t border-stone-200/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-xl transition-all shadow-xs text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={16} className="text-amber-300" />
                  )}
                  Save Adjustments
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
