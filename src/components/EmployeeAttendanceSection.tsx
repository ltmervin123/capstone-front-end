import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Download,
  AlertCircle,
  Loader2,
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  Search,
} from 'lucide-react';
import { useAttendanceQuery } from '../hooks/useAttendance';
import { ApiRequestError } from '../utils/apiClient';
import { Logo } from '../assets/common/Logo';
import { AttendanceStatus, type AttendanceRecord } from '../types/types';
import {
  getStatusColor,
  formatAttendanceTime,
  getStatusIcon,
} from '../utils/attendanceUtils';
import { exportToCsv } from '../utils/exportUtils';

export const EmployeeAttendanceSection: React.FC = () => {
  const attendanceQuery = useAttendanceQuery();

  const attendance = attendanceQuery.data ?? [];
  const listLoading = attendanceQuery.isPending;
  const listError =
    attendanceQuery.error instanceof ApiRequestError
      ? attendanceQuery.error.message
      : attendanceQuery.error instanceof Error
        ? attendanceQuery.error.message
        : attendanceQuery.error
          ? 'Failed to load attendance.'
          : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const {
    presentCount,
    lateCount,
    absentOrLeaveCount,
    filteredAttendance,
  } = useMemo(() => {
    let present = 0;
    let late = 0;
    let absentOrLeave = 0;

    for (const record of attendance) {
      if (record.status === AttendanceStatus.PRESENT) {
        present++;
      } else if (record.status === AttendanceStatus.LATE) {
        late++;
      } else if (
        record.status === AttendanceStatus.ABSENT ||
        record.status === AttendanceStatus.ON_LEAVE
      ) {
        absentOrLeave++;
      }
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = attendance.filter((record: AttendanceRecord) => {
      const matchesSearch =
        !normalizedSearch ||
        record.date.toLowerCase().includes(normalizedSearch) ||
        (record.remarks && record.remarks.toLowerCase().includes(normalizedSearch));

      const matchesFilter =
        filterStatus === 'All'
          ? true
          : filterStatus === 'ABSENT_OR_LEAVE'
            ? record.status === AttendanceStatus.ABSENT ||
              record.status === AttendanceStatus.ON_LEAVE
            : record.status === filterStatus;

      return matchesSearch && matchesFilter;
    });

    return {
      presentCount: present,
      lateCount: late,
      absentOrLeaveCount: absentOrLeave,
      filteredAttendance: filtered,
    };
  }, [attendance, searchTerm, filterStatus]);

  const statCards = [
    {
      label: 'Total Logs',
      subtitle: 'All recorded sessions',
      value: attendance.length,
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-800',
    },
    {
      label: 'Present Days',
      subtitle: 'On-time attendance',
      value: presentCount,
      icon: UserCheck,
      iconBg: 'bg-green-50 text-green-800',
    },
    {
      label: 'Late Arrivals',
      subtitle: 'Recorded tardiness',
      value: lateCount,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-900',
    },
    {
      label: 'Absent & On Leave',
      subtitle: 'Unattended or filed leaves',
      value: absentOrLeaveCount,
      icon: CalendarDays,
      iconBg: 'bg-purple-50 text-purple-800',
    },
  ];

  const handleExport = () => {
    exportToCsv<AttendanceRecord>(
      'My_Attendance_Records',
      [
        { header: 'Date', accessor: 'date' },
        { header: 'Time In', accessor: (row) => formatAttendanceTime(row.timeIn) },
        { header: 'Time Out', accessor: (row) => formatAttendanceTime(row.timeOut) },
        { header: 'Status', accessor: 'status' },
        { header: 'Remarks', accessor: (row) => row.remarks || '--' },
      ],
      filteredAttendance
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header matching Dashboard */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              My Attendance
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Official Daily Clock-in &amp; Clock-out Logs
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <UserCheck size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  Employee View
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>My Official Logs</span>
          </span>
        </div>
      </header>

      {/* Error Alert */}
      {listError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Could not load attendance:</span> {listError}
          </div>
          <button
            type="button"
            onClick={() => void attendanceQuery.refetch()}
            className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <section
        aria-label="My attendance summary metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center select-none"
          >
            <div className={`p-3 rounded-xl ${stat.iconBg} mb-3`}>
              <stat.icon size={22} />
            </div>
            <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
              {stat.value}
            </h2>
            <p className="text-sm font-bold text-stone-800 mt-2">
              {stat.label}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Main Table Card */}
      <section
        aria-label="My attendance history"
        className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Attendance History
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Review personal clock-in and clock-out logs and verified timestamps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                size={16}
              />
              <input
                type="text"
                aria-label="Search records by date or remarks"
                placeholder="Search date or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-medium text-green-950 placeholder:text-stone-400 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                size={14}
              />
              <select
                aria-label="Filter my records by status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-8 pr-8 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-stone-800 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value={AttendanceStatus.PRESENT}>Present</option>
                <option value={AttendanceStatus.LATE}>Late</option>
                <option value={AttendanceStatus.ABSENT}>Absent</option>
                <option value={AttendanceStatus.ON_LEAVE}>On Leave</option>
                <option value="ABSENT_OR_LEAVE">Absent &amp; On Leave</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden shrink-0"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-stone-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-600">
                <th scope="col" className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-wide">
                  Date
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-wide">
                  Time In
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-wide">
                  Time Out
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-wide">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold text-stone-700 tracking-wide">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {listLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-stone-600">
                      <Loader2 size={28} className="animate-spin text-green-800" />
                      <p className="font-semibold text-xs text-stone-600">
                        Loading attendance records...
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!listLoading &&
                filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50/70 transition-colors group">
                    <td className="px-6 py-4 text-xs font-semibold text-stone-700 tabular-nums">
                      {record.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-stone-600 tabular-nums">
                        {formatAttendanceTime(record.timeIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-stone-600 tabular-nums">
                        {formatAttendanceTime(record.timeOut)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tabular-nums ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {getStatusIcon(record.status)}
                        <span>{record.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {record.remarks ? (
                        <span className="italic">{record.remarks}</span>
                      ) : (
                        <span className="text-stone-300">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              {!listLoading && filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-stone-400">
                    <Calendar size={40} className="mx-auto mb-3 text-stone-300 stroke-1" />
                    <p className="font-bold text-stone-700 text-sm">
                      No attendance records found
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      Try adjusting your filter options.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table summary & reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 pt-1 gap-2">
          <span>
            Showing <strong className="text-green-950 font-bold">{filteredAttendance.length}</strong> of{' '}
            <strong className="text-green-950 font-bold">{attendance.length}</strong> total records
          </span>
          {(filterStatus !== 'All' || searchTerm.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus('All');
                setSearchTerm('');
              }}
              className="text-emerald-800 hover:text-green-950 font-semibold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
