import React from 'react';
import { Search, X } from 'lucide-react';
import type { PayrollRun } from '../../../types/types';

interface PayrollFilterBarProps {
  isEmployeeAccount: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedRun: PayrollRun | null;
  onClearSelectedRun: () => void;
  filterMonth: string;
  onFilterMonthChange: (month: string) => void;
  filterYear: string;
  onFilterYearChange: (year: string) => void;
  availableMonths: string[];
  availableYears: string[];
}

export const PayrollFilterBar: React.FC<PayrollFilterBarProps> = ({
  isEmployeeAccount,
  searchQuery,
  onSearchChange,
  selectedRun,
  onClearSelectedRun,
  filterMonth,
  onFilterMonthChange,
  filterYear,
  onFilterYearChange,
  availableMonths,
  availableYears,
}) => {
  return (
    <section
      aria-label="Payroll filter and search"
      className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4"
    >
      {!isEmployeeAccount && (
        <div className="relative w-full md:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            aria-label="Search employee by name, ID, or department"
            placeholder="Search employee by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200/80 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden bg-stone-50"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {selectedRun && (
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
            <span>Batch: {selectedRun.name}</span>
            <button
              type="button"
              onClick={onClearSelectedRun}
              className="hover:text-emerald-700 text-stone-400 cursor-pointer"
              title="Clear batch filter"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Month Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="filter-month" className="text-xs font-bold text-stone-600">
            Month:
          </label>
          <select
            id="filter-month"
            value={filterMonth}
            onChange={(e) => onFilterMonthChange(e.target.value)}
            className="px-3 py-1.5 border border-stone-200/80 bg-white text-xs font-semibold rounded-xl text-stone-800 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden shadow-xs cursor-pointer"
          >
            {availableMonths.map((m, idx) => (
              <option key={idx} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="filter-year" className="text-xs font-bold text-stone-600">
            Year:
          </label>
          <select
            id="filter-year"
            value={filterYear}
            onChange={(e) => onFilterYearChange(e.target.value)}
            className="px-3 py-1.5 border border-stone-200/80 bg-white text-xs font-semibold rounded-xl text-stone-800 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden shadow-xs cursor-pointer"
          >
            {availableYears.map((y, idx) => (
              <option key={idx} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};
