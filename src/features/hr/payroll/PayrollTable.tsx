import React from 'react';
import { Eye, Edit2, Loader2 } from 'lucide-react';
import type { PayrollRecord } from '../../../types/types';

interface PayrollTableProps {
  records: PayrollRecord[];
  isLoading: boolean;
  isEmployeeAccount: boolean;
  onViewPayslip: (record: PayrollRecord) => void;
  onAdjustRecord: (record: PayrollRecord) => void;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  records,
  isLoading,
  isEmployeeAccount,
  onViewPayslip,
  onAdjustRecord,
}) => {
  return (
    <section
      aria-label="Payroll records table"
      className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200/80">
              <th className="px-5 py-4 text-xs font-bold text-green-950">
                Period & Cutoff
              </th>
              {!isEmployeeAccount && (
                <th className="px-5 py-4 text-xs font-bold text-green-950">
                  Employee
                </th>
              )}
              <th className="px-5 py-4 text-xs font-bold text-green-950 text-center">
                Days
              </th>
              <th className="px-5 py-4 text-xs font-bold text-green-950 text-right">
                Basic Pay
              </th>
              <th className="px-5 py-4 text-xs font-bold text-rose-800 text-right bg-rose-50/20">
                Deductions
              </th>
              <th className="px-5 py-4 text-xs font-bold text-green-950 text-right bg-emerald-50/30">
                Net Take-Home
              </th>
              {!isEmployeeAccount && (
                <th className="px-4 py-4 text-xs font-bold text-green-950 text-center">
                  Status
                </th>
              )}
              <th className="px-5 py-4 text-xs font-bold text-green-950 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {isLoading ? (
              <tr>
                <td
                  colSpan={isEmployeeAccount ? 6 : 8}
                  className="px-6 py-12 text-center text-stone-500 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin text-green-800" />
                    <span>Loading payroll records...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td
                  colSpan={isEmployeeAccount ? 6 : 8}
                  className="px-6 py-12 text-center text-stone-500 font-medium"
                >
                  No payroll data matched the selected criteria.
                </td>
              </tr>
            ) : (
              records.map((p) => {
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-green-950">
                        {p.month} {p.year}
                      </span>
                      {p.payrollRunName && (
                        <p className="text-xs text-stone-500 font-medium">
                          {p.payrollRunName}
                        </p>
                      )}
                    </td>
                    {!isEmployeeAccount && (
                      <td className="px-5 py-4">
                        <p className="font-bold text-stone-900 leading-tight">
                          {p.employeeName}
                        </p>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          {p.employeeId}{' '}
                          {p.department ? `• ${p.department}` : ''}
                        </p>
                      </td>
                    )}
                    <td className="px-5 py-4 font-mono font-semibold text-stone-700 text-center tabular-nums">
                      {p.daysWorked}d
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-stone-800 text-right tabular-nums">
                      ₱{p.basicSalary.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-rose-700 text-right bg-rose-50/10 tabular-nums">
                      ₱{p.totalDeductions.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-mono font-extrabold text-green-950 text-right bg-emerald-50/25 text-sm tabular-nums">
                      ₱{p.netPay.toLocaleString()}
                    </td>
                    {!isEmployeeAccount && (
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewPayslip(p)}
                          className="p-2 min-h-[36px] min-w-[36px] bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-hidden"
                          title="View official payslip receipt"
                        >
                          <Eye size={15} />
                        </button>
                        {!isEmployeeAccount && (
                          <button
                            type="button"
                            onClick={() => onAdjustRecord(p)}
                            className="p-2 min-h-[36px] min-w-[36px] bg-emerald-50 text-emerald-800 hover:bg-green-900 hover:text-white rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                            title="Adjust line items"
                          >
                            <Edit2 size={15} />
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
    </section>
  );
};
