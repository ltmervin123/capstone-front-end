import React from 'react';
import { Activity, Download, Filter, History, Search, X } from 'lucide-react';
import type { AuditLog } from '../../../../types/types';

interface AuditTrailTableProps {
  logs: AuditLog[];
  logSearchQuery: string;
  onSearchChange: (value: string) => void;
  logFilterUser: string;
  onFilterUserChange: (value: string) => void;
  logInitiators: string[];
  onExportLogs: () => void;
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  logs,
  logSearchQuery,
  onSearchChange,
  logFilterUser,
  onFilterUserChange,
  logInitiators,
  onExportLogs,
}) => {
  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search audit trail by staff member, action, or details..."
            value={logSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
          />
          {logSearchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[220px]">
          <Filter className="text-emerald-800 shrink-0 ml-1" size={15} />
          <label htmlFor="logFilterUserSelect" className="sr-only">
            Filter by staff member
          </label>
          <select
            id="logFilterUserSelect"
            value={logFilterUser}
            onChange={(e) => onFilterUserChange(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none cursor-pointer transition-all"
          >
            <option value="All">All Staff Members</option>
            {logInitiators.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onExportLogs}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
        >
          <Download size={14} />
          Export Logs
        </button>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/90 border-b border-stone-200/80">
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                >
                  Date &amp; Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                >
                  Staff Member
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                >
                  Activity &amp; Details
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider text-right"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-stone-50/60 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-mono text-xs font-semibold text-green-950">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs shrink-0">
                        {log.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-green-950">
                        {log.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-xs text-green-950">
                        {log.action}
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5 leading-relaxed max-w-xl">
                        {log.details || 'Standard system activity logged.'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-800 rounded-full border border-green-200/60">
                      <Activity size={11} className="text-emerald-700" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        Logged
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <History size={32} className="text-stone-300" />
                      <p className="font-bold text-sm text-stone-700">
                        No audit records found
                      </p>
                      <p className="text-xs text-stone-500">
                        No events matched your search query.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
