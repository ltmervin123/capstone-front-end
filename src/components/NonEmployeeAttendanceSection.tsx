import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useAuth';
import { useAttendanceQuery } from '../hooks/useAttendance';
import { ApiRequestError } from '../utils/apiClient';
import { Logo } from '../assets/common/Logo';
import { Role, AttendanceStatus, type AttendanceRecord } from '../types/types';
import {
  getStatusColor,
  formatAttendanceTime,
  getStatusIcon,
} from '../utils/attendanceUtils';
import { exportToCsv } from '../utils/exportUtils';
import { ManualAttendanceModal } from './ManualAttendanceModal';

export const NonEmployeeAttendanceSection: React.FC = () => {
  const currentUser = useCurrentUser();
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
  const [showAddModal, setShowAddModal] = useState(false);

  const badgeText = currentUser?.role === Role.ADMIN ? 'ADMIN OPS' : 'HR OPS';

  const filteredAttendance = attendance.filter((record: AttendanceRecord) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const presentCount = attendance.filter(
    (record) => record.status === AttendanceStatus.PRESENT
  ).length;
  const lateCount = attendance.filter(
    (record) => record.status === AttendanceStatus.LATE
  ).length;
  const absentOrLeaveCount = attendance.filter(
    (record) =>
      record.status === AttendanceStatus.ABSENT ||
      record.status === AttendanceStatus.ON_LEAVE
  ).length;

  const handleExport = () => {
    exportToCsv<AttendanceRecord>(
      'Personnel_Attendance_Records',
      [
        { header: 'Employee ID', accessor: 'employeeId' },
        { header: 'Employee Name', accessor: 'employeeName' },
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
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-14 h-14" />
          <div>
            <h2 className="text-3xl font-black text-green-900 uppercase tracking-tighter">
              Attendance Records
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                Daily clock-in/out tracking and monitoring of personnel
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
                <Users size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  {badgeText}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-green-950 font-black px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-yellow-400/20 active:scale-95 uppercase text-xs tracking-widest cursor-pointer w-fit"
        >
          <Plus size={18} />
          Manual Entry
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus('All')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'All'
              ? 'bg-green-100/70 border-green-300 ring-2 ring-green-900'
              : 'bg-white border-gray-100 hover:bg-green-50/50 shadow-sm'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-green-800">
            Total Records
          </p>
          <p className="text-2xl font-black text-green-950 mt-1">
            {attendance.length}
          </p>
          <p className="text-[9px] text-gray-500 font-bold mt-1">
            All personnel logs
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(AttendanceStatus.PRESENT)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === AttendanceStatus.PRESENT
              ? 'bg-emerald-100/70 border-emerald-300 ring-2 ring-emerald-900'
              : 'bg-white border-gray-100 hover:bg-emerald-50/50 shadow-sm'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Present
          </p>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {presentCount}
          </p>
          <p className="text-[9px] text-emerald-700 font-bold mt-1">
            On-time attendance
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(AttendanceStatus.LATE)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === AttendanceStatus.LATE
              ? 'bg-yellow-100/70 border-yellow-300 ring-2 ring-yellow-700'
              : 'bg-white border-gray-100 hover:bg-yellow-50/50 shadow-sm'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-yellow-800">
            Late Arrivals
          </p>
          <p className="text-2xl font-black text-yellow-950 mt-1">
            {lateCount}
          </p>
          <p className="text-[9px] text-yellow-700 font-bold mt-1">
            Tardiness logs
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(AttendanceStatus.ABSENT)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === AttendanceStatus.ABSENT
              ? 'bg-red-100/70 border-red-300 ring-2 ring-red-700'
              : 'bg-white border-gray-100 hover:bg-red-50/50 shadow-sm'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-red-800">
            Absences / Leaves
          </p>
          <p className="text-2xl font-black text-red-950 mt-1">
            {absentOrLeaveCount}
          </p>
          <p className="text-[9px] text-red-700 font-bold mt-1">
            Unattended / filed leaves
          </p>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        {listError && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 rounded-2xl border border-red-100 text-red-800 text-xs">
            <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Could not load attendance:</span> {listError}
            </div>
            <button
              type="button"
              onClick={() => void attendanceQuery.refetch()}
              className="text-[10px] font-black uppercase tracking-wider text-red-700 hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative animate-in fade-in duration-300">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-950"
            />
          </div>

          <div className="flex gap-4 ml-auto">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="pl-10 pr-10 py-4 bg-gray-50 border-none rounded-[24px] font-bold text-green-950 appearance-none focus:ring-2 focus:ring-yellow-400 outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(AttendanceStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-6 py-4 bg-green-900 text-yellow-400 font-black rounded-[24px] flex items-center gap-2 hover:bg-green-800 transition-colors uppercase text-xs tracking-widest cursor-pointer"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-green-900 text-yellow-400 text-left">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest rounded-tl-[24px]">
                  Employee
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">
                  Date
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">
                  Time In
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">
                  Time Out
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest rounded-tr-[24px]">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listLoading && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-green-900">
                      <Loader2 size={32} className="animate-spin" />
                      <p className="font-black uppercase text-xs tracking-[0.3em]">
                        Loading attendance...
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!listLoading &&
                filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-black text-green-950 leading-none">
                          {record.employeeName}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase">
                          {record.employeeId}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-green-800">{record.date}</td>
                    <td className="px-8 py-5">
                      <span className="font-mono text-xs font-bold text-gray-500">
                        {formatAttendanceTime(record.timeIn)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-mono text-xs font-bold text-gray-500">
                        {formatAttendanceTime(record.timeOut)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter flex items-center gap-1.5 w-fit ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-500 italic">
                      {record.remarks || '--'}
                    </td>
                  </tr>
                ))}
              {!listLoading && filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      No attendance records found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <ManualAttendanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};
