import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Clock, Download, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { storageService } from '../../services/storageService.ts';
import { useCurrentUser } from '../../hooks/useAuth';
import { Logo } from '../../assets/common/Logo.tsx';
import { type AttendanceRecord, AttendanceStatus, type Employee } from '../../types/types.ts';

export const AttendanceRecords: React.FC = () => {
  const currentUser = useCurrentUser();
  const isEmployeeAccount = !!currentUser?.employeeId;
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newRecord, setNewRecord] = useState<Partial<AttendanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    timeIn: '08:00',
    timeOut: '17:00',
    status: AttendanceStatus.PRESENT,
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAttendance(storageService.getAttendance());
    setEmployees(storageService.getEmployees());
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeId) return;

    const employee = employees.find(emp => emp.id === newRecord.employeeId);
    const record: AttendanceRecord = {
      id: `ATT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      employeeId: newRecord.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.surname}` : 'Unknown',
      date: newRecord.date || '',
      timeIn: newRecord.timeIn || '',
      timeOut: newRecord.timeOut || '',
      status: newRecord.status as AttendanceStatus || AttendanceStatus.PRESENT,
      remarks: newRecord.remarks || ''
    };

    storageService.saveAttendance(record);
    storageService.addLog('System', `Added attendance record for ${record.employeeName}`, `Date: ${record.date}`);
    setShowAddModal(false);
    loadData();
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      timeIn: '08:00',
      timeOut: '17:00',
      status: AttendanceStatus.PRESENT,
      remarks: ''
    });
  };

  const filteredAttendance = attendance.filter(record => {
    // If logged in as an employee, strictly show only their own records
    if (currentUser?.employeeId && record.employeeId !== currentUser.employeeId) {
      return false;
    }

    const matchesSearch = 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'bg-green-100 text-green-700 border-green-200';
      case AttendanceStatus.LATE: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case AttendanceStatus.ABSENT: return 'bg-red-100 text-red-700 border-red-200';
      case AttendanceStatus.ON_LEAVE: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return <CheckCircle2 size={12} />;
      case AttendanceStatus.LATE: return <Clock size={12} />;
      case AttendanceStatus.ABSENT: return <XCircle size={12} />;
      case AttendanceStatus.ON_LEAVE: return <AlertCircle size={12} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <Logo className="w-14 h-14" />
          <div>
            <h2 className="text-3xl font-black text-green-900 uppercase tracking-tighter">
              {currentUser?.employeeId ? "My Attendance" : "Attendance Records"}
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              {currentUser?.employeeId 
                ? "Your official daily clock-in/out tracking and session logs" 
                : "Daily clock-in/out tracking and monitoring of personnel"}
            </p>
          </div>
        </div>
        {!currentUser?.employeeId && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-green-950 font-black px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-yellow-400/20 active:scale-95 uppercase text-xs tracking-widest"
          >
            <Plus size={18} />
            Manual Entry
          </button>
        )}
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {!currentUser?.employeeId && (
            <div className="flex-1 relative animate-in fade-in duration-300">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-950"
              />
            </div>
          )}
          <div className="flex gap-4 ml-auto">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                className="pl-10 pr-10 py-4 bg-gray-50 border-none rounded-[24px] font-bold text-green-950 appearance-none focus:ring-2 focus:ring-yellow-400 outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(AttendanceStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <button className="px-6 py-4 bg-green-900 text-yellow-400 font-black rounded-[24px] flex items-center gap-2 hover:bg-green-800 transition-colors uppercase text-xs tracking-widest">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-green-900 text-yellow-400 text-left">
                {!isEmployeeAccount && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest rounded-tl-[24px]">Employee</th>}
                <th className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest ${isEmployeeAccount ? 'rounded-tl-[24px]' : ''}`}>Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Time In</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Time Out</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest rounded-tr-[24px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                  {!isEmployeeAccount && (
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-black text-green-950 leading-none">{record.employeeName}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase">{record.employeeId}</p>
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-5 text-sm font-bold text-green-800">{record.date}</td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs font-bold text-gray-500">{record.timeIn}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs font-bold text-gray-500">{record.timeOut}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter flex items-center gap-1.5 w-fit ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {record.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs text-gray-500 italic">{record.remarks || '--'}</td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={isEmployeeAccount ? 5 : 6} className="px-8 py-20 text-center text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No attendance records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-green-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl relative border-4 border-yellow-400">
            <h3 className="text-2xl font-black text-green-900 mb-2 uppercase tracking-tighter">Manual Attendance Entry</h3>
            <p className="text-gray-500 text-sm font-medium mb-8">Override or add missing attendance logs</p>
            
            <form onSubmit={handleAddRecord} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Employee</label>
                <select 
                  required
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                  value={newRecord.employeeId}
                  onChange={e => setNewRecord({...newRecord, employeeId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.surname} ({emp.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Date</label>
                  <input 
                    type="date" required
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={newRecord.date}
                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Status</label>
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={newRecord.status}
                    onChange={e => setNewRecord({...newRecord, status: e.target.value as AttendanceStatus})}
                  >
                    {Object.values(AttendanceStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block text-green-600">Time In</label>
                  <input 
                    type="time"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={newRecord.timeIn}
                    onChange={e => setNewRecord({...newRecord, timeIn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block text-red-600">Time Out</label>
                  <input 
                    type="time"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={newRecord.timeOut}
                    onChange={e => setNewRecord({...newRecord, timeOut: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Remarks</label>
                <textarea 
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-green-950 h-24"
                  value={newRecord.remarks}
                  onChange={e => setNewRecord({...newRecord, remarks: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-green-900 text-yellow-400 font-black rounded-2xl hover:bg-green-800 transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
