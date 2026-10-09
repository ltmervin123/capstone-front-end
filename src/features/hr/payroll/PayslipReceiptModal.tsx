import React from 'react';
import { Banknote, Printer, X } from 'lucide-react';
import { Logo } from '../../../assets/common/Logo';
import type { PayrollRecord } from '../../../types/types';
import { motion, AnimatePresence } from 'motion/react';

interface PayslipReceiptModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
}

export const PayslipReceiptModal: React.FC<PayslipReceiptModalProps> = ({
  record,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {record && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payslip-modal-title"
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-lg border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh] relative"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200/80 flex items-center justify-between text-green-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Banknote size={18} />
                </div>
                <div>
                  <h3
                    id="payslip-modal-title"
                    className="font-bold text-sm tracking-tight text-green-950"
                  >
                    NMC Member Payslip
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Official Monthly Compensation Statement
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:text-green-950 hover:bg-emerald-50 rounded-xl border border-stone-200/80 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  title="Print Payslip"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="p-6 overflow-y-auto space-y-5"
              id="payslip-print-section"
            >
              {/* Header Identity */}
              <div className="text-center pb-4 border-b border-stone-200/80 flex flex-col items-center">
                <Logo className="w-14 h-14 mb-2" />
                <h2 className="text-lg font-extrabold text-green-950 tracking-tight">
                  Northern Mindanao Colleges, Inc.
                </h2>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  A.D. Curato St., Cabadbaran City, Agusan del Norte
                </p>
                <div className="mt-2.5 px-3 py-0.5 bg-emerald-50 text-emerald-900 font-bold text-xs rounded-full border border-emerald-200">
                  Official Employee Payslip Receipt
                </div>
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                <div className="space-y-0.5">
                  <p className="text-xs text-stone-500 font-medium">Employee</p>
                  <p className="font-bold text-green-950">
                    {record.employeeName}
                  </p>
                  <p className="text-xs font-mono text-stone-500">
                    {record.employeeId}{' '}
                    {record.position ? `• ${record.position}` : ''}
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-xs text-stone-500 font-medium">Pay Period</p>
                  <p className="font-bold text-green-950">
                    {record.month} {record.year}
                  </p>
                  <p className="text-xs font-mono text-stone-500">
                    Ref: {record.id.slice(-8)}
                  </p>
                </div>
              </div>

              {/* Breakdown Sections */}
              <div className="space-y-4">
                {/* Gross Earnings */}
                <div>
                  <h4 className="text-xs font-bold text-green-950 mb-2 border-b border-stone-200/80 pb-1">
                    1. Gross Earnings Breakdown
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">
                        Daily Functional Rate ({record.daysWorked} days)
                      </span>
                      <span className="font-mono font-semibold text-stone-800 tabular-nums">
                        ₱{record.functionalRate.toLocaleString()} / day
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">
                        Basic Salary (Rate × Days)
                      </span>
                      <span className="font-mono font-semibold text-stone-800 tabular-nums">
                        ₱{record.basicSalary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">COLA / Allowances</span>
                      <span className="font-mono font-semibold text-stone-800 tabular-nums">
                        ₱{record.allowances.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">
                        Gasoline & Travel Subsidy
                      </span>
                      <span className="font-mono font-semibold text-stone-800 tabular-nums">
                        ₱{record.gasoline.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-green-950 bg-emerald-50/50 px-3 rounded-xl border border-emerald-100">
                      <span>Total Gross Earnings</span>
                      <span className="font-mono font-extrabold tabular-nums">
                        ₱
                        {(
                          record.grossPay ||
                          record.basicSalary +
                            record.allowances +
                            record.gasoline
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-rose-900 mb-2 border-b border-stone-200/80 pb-1">
                    2. Statutory Contributions & Deductions
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {record.tardinessDeduction > 0 && (
                      <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                        <span className="text-stone-600">
                          Tardiness ({record.tardinessMinutes} mins late)
                        </span>
                        <span className="font-mono font-semibold text-rose-700 tabular-nums">
                          ₱{record.tardinessDeduction.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">
                        SSS Employee Share
                      </span>
                      <span className="font-mono font-semibold text-rose-700 tabular-nums">
                        ₱{record.sssDeduction.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">
                        PhilHealth Employee Share
                      </span>
                      <span className="font-mono font-semibold text-rose-700 tabular-nums">
                        ₱{record.philHealthDeduction.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                      <span className="text-stone-600">
                        Pag-IBIG (HDMF) Contribution
                      </span>
                      <span className="font-mono font-semibold text-rose-700 tabular-nums">
                        ₱{record.pagIbigDeduction.toLocaleString()}
                      </span>
                    </div>
                    {record.taxWithheld > 0 && (
                      <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                        <span className="text-stone-600">
                          BIR Withholding Tax
                        </span>
                        <span className="font-mono font-semibold text-rose-700 tabular-nums">
                          ₱{record.taxWithheld.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {record.cashAdvance > 0 && (
                      <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                        <span className="text-stone-600">
                          Cash Advance Reimbursement
                        </span>
                        <span className="font-mono font-semibold text-rose-700 tabular-nums">
                          ₱{record.cashAdvance.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {record.otherDeductions > 0 && (
                      <div className="flex justify-between py-1 border-b border-dashed border-stone-200/80">
                        <span className="text-stone-600">Other Deductions</span>
                        <span className="font-mono font-semibold text-rose-700 tabular-nums">
                          ₱{record.otherDeductions.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 font-bold text-rose-950 bg-rose-50/40 px-3 rounded-xl border border-rose-100">
                      <span>Total Deductions</span>
                      <span className="font-mono font-extrabold text-rose-700 tabular-nums">
                        ₱{record.totalDeductions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Take-Home Box */}
              <div className="bg-green-950 text-white rounded-xl p-4 border border-green-900 text-center space-y-1">
                <p className="text-xs font-bold text-amber-300">
                  Net Take-Home Payout
                </p>
                <p className="text-3xl font-extrabold font-mono text-amber-300 tabular-nums tracking-tight">
                  ₱{record.netPay.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-200 font-medium">
                  Northern Mindanao Colleges, Inc.
                </p>
              </div>

              {/* Physical Signing Footer for Printing */}
              <div className="pt-5 border-t border-stone-200/80 grid grid-cols-2 gap-8 text-xs text-stone-500 mt-2">
                <div className="border-t border-stone-300 pt-1.5 text-center">
                  <p className="text-green-950 font-bold leading-tight">
                    Chief Finance Officer
                  </p>
                  <p className="text-[11px] text-stone-400">Authorizing Officer</p>
                </div>
                <div className="border-t border-stone-300 pt-1.5 text-center">
                  <p className="text-green-950 font-bold leading-tight">
                    Employee Signature
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Acknowledgment of Release
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 bg-stone-50/80 border-t border-stone-200/80 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-green-900 hover:bg-green-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                Close Payslip
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
