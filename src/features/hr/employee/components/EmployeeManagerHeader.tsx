import React from 'react';
import { Plus, Users } from 'lucide-react';
import { Logo } from '../../../../assets/common/Logo';

interface EmployeeManagerHeaderProps {
  onAddNew: () => void;
}

export const EmployeeManagerHeader: React.FC<EmployeeManagerHeaderProps> = ({
  onAddNew,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4 sm:gap-5">
        <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
            Employee Manager
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs font-semibold text-emerald-800">
              Personnel &amp; Operations Hub
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
              <Users size={12} className="text-amber-300" />
              <span className="text-[11px] font-bold tracking-wide">
                HR Department
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-auto">
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
        >
          <Plus size={15} />
          <span>Add Employee</span>
        </button>
      </div>
    </header>
  );
};
