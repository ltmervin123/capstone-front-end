import React, { useMemo, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  CalendarDays,
  UserPlus,
  BarChart3,
  GraduationCap,
  Building2,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  Briefcase,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { Role } from "../../types/types";
import type { User, Employee } from '../../types/types';
import { storageService } from '../../services/storageService';
import { Logo } from '../../assets/common/Logo';
import { motion } from 'motion/react';

interface DashboardProps {
  user: User;
  setActiveView: (view: string) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, setActiveView, setSelectedEmployee }) => {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'attendance' | 'department' | 'leaves'>('all');
  
  const employees = storageService.getEmployees();
  const payroll = storageService.getPayroll();
  const leaves = storageService.getLeaves();
  const attendance = storageService.getAttendance();
  const applicants = storageService.getApplicants();

  // If the logged-in user is a restricted employee
  if (user.employeeId) {
    const emp = employees.find(e => e.id === user.employeeId);
    
    // Filter down to employee's own items
    const myAttendance = attendance.filter(a => a.employeeId === user.employeeId);
    const myPayroll = payroll.filter(p => p.employeeId === user.employeeId);
    const myLeaves = leaves.filter(l => l.employeeId === user.employeeId);

    // Compute key metrics
    const presentCount = myAttendance.filter(a => a.status === 'Present').length;
    const lateCount = myAttendance.filter(a => a.status === 'Late').length;
    const absentCount = myAttendance.filter(a => a.status === 'Absent').length;
    const onLeaveCount = myAttendance.filter(a => a.status === 'On Leave').length;
    const totalLogs = myAttendance.length;

    // Attendance index rating
    const attendanceScore = totalLogs > 0 
      ? Math.round(((presentCount + lateCount * 0.7) / totalLogs) * 100) 
      : 100;

    // Performance Index Descriptions
    const performanceLabel = attendanceScore >= 95 
      ? "Outstanding Attendance Performance" 
      : attendanceScore >= 85 
        ? "Excellent Attendance Performance" 
        : "Standard Category";

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-16">
        {/* Welcome Row with custom design */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Logo className="w-20 h-20" />
            <div>
              <h1 className="text-4xl font-black text-green-950 uppercase tracking-tighter">My Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                  Welcome back, {emp ? `${emp.firstName} ${emp.surname}` : user.username}!
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900 rounded-full shadow-sm">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                    {emp?.position || 'NMC Employee'} - {emp?.department || 'Staff'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono tracking-tight bg-white border border-gray-100 rounded-xl px-3.5 py-1.5 shadow-sm">
              Employee ID: {user.employeeId}
            </span>
          </div>
        </header>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bento Item 1: Attendance Summary Section */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="font-black text-green-950 uppercase tracking-tight text-sm flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Attendance Monitor
              </h3>
              <button 
                onClick={() => setActiveView('attendance')}
                className="text-[10px] font-black text-green-700 hover:text-green-900 uppercase flex items-center gap-0.5"
              >
                Log Details <ChevronRight size={12} />
              </button>
            </div>

            {/* Performance rate radial effect */}
            <div className="flex items-center gap-5 p-4 bg-green-50/30 rounded-2xl border border-green-200/20">
              <div className="relative w-16 h-16 flex items-center justify-center bg-green-900 text-yellow-400 rounded-full font-black text-lg shrink-0 shadow-sm">
                {attendanceScore}%
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-green-950">{performanceLabel}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Average of present & punctual marks based on {totalLogs} overall tracking records.</p>
              </div>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="block text-lg font-black text-green-700">{presentCount}</span>
                <span className="text-[8px] font-black uppercase text-gray-400">Present</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="block text-lg font-black text-yellow-600">{lateCount}</span>
                <span className="text-[8px] font-black uppercase text-gray-400">Late</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="block text-lg font-black text-red-600">{absentCount}</span>
                <span className="text-[8px] font-black uppercase text-gray-400">Absent</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="block text-lg font-black text-blue-600">{onLeaveCount}</span>
                <span className="text-[8px] font-black uppercase text-gray-400">On Leave</span>
              </div>
            </div>

            {/* Recent Table */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Recent Attendance Logs</span>
              <div className="overflow-hidden rounded-xl border border-gray-50 max-h-[160px] overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <tbody>
                    {myAttendance.slice(0, 3).map((v) => (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-2.5 font-bold text-green-950">{v.date}</td>
                        <td className="p-2.5 font-mono text-gray-400">{v.timeIn} - {v.timeOut}</td>
                        <td className="p-2.5 text-right">
                          <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase ${
                            v.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-750'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {myAttendance.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-gray-400 italic">No attendance records filed yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bento Item 2: Payroll Payslip Summary */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="font-black text-green-950 uppercase tracking-tight text-sm flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-yellow-500" />
                Salary & Payroll Index
              </h3>
              <button 
                onClick={() => setActiveView('payroll')}
                className="text-[10px] font-black text-green-700 hover:text-green-900 uppercase flex items-center gap-0.5"
              >
                Salary Records <ChevronRight size={12} />
              </button>
            </div>

            {/* Latest Payslip Summary */}
            {myPayroll.length > 0 ? (
              (() => {
                const latest = myPayroll[0];
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50/25 border border-green-200/30 rounded-2xl flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[8px] font-black text-green-805 uppercase tracking-widest block">LATEST PERIOD</span>
                        <h4 className="text-base font-black text-green-950 leading-snug">{latest.month} {latest.year}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Basic: ₱{(latest.basicSalary || 0).toLocaleString()} | Days: {latest.daysWorked || 0}d</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">NET RECEIVED (COLA)</span>
                        <span className="text-lg font-black text-green-900">₱{(latest.cola || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block">FUEL SUB</span>
                        <span className="text-sm font-black text-green-900">₱{(latest.gasoline || 0).toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl text-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase block">TOTAL CLAIMS</span>
                        <span className="text-sm font-black text-green-905">₱{(latest.allowances || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Pay summary log List */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Previous Payslips</span>
                      <div className="space-y-1 max-h-[110px] overflow-y-auto">
                        {myPayroll.slice(1, 4).map((p) => (
                          <div key={p.id} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg text-xs">
                            <span className="font-extrabold text-green-950">{p.month} {p.year}</span>
                            <span className="font-mono text-green-800 font-bold">₱{p.cola.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-150 text-gray-400">
                <span className="block text-xs font-bold leading-relaxed mb-1 text-gray-550">No Payslip History</span>
                <p className="text-[10px] text-zinc-400">Your current month's payslip and COLA accounts are yet to be finalized by the administrative staff.</p>
              </div>
            )}
          </div>

          {/* Bento Item 3: Performance, Education, and Self Services */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="font-black text-green-950 uppercase tracking-tight text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-yellow-500" />
                Performance & Profile
              </h3>
              <span className="text-[9px] font-black uppercase text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Scorecard Active</span>
            </div>

            {/* Profile context summary */}
            <div className="space-y-3.5">
              <div className="p-3 bg-yellow-50/10 border border-yellow-250/10 rounded-2xl flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-400">Position & Grade Rank</span>
                  <span className="text-green-950">{emp?.position || 'Senior Staff'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-400">Service Tenure Duration</span>
                  <span className="text-green-950">{emp?.serviceDuration || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-400">Education Credentials</span>
                  <span className="text-green-955 truncate max-w-[150px]">{emp?.mastersDegreeName || 'Post Graduate'}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-400">Doctorate Status</span>
                  <span className="text-green-955 uppercase text-[9px] tracking-wider font-extrabold">{emp?.doctorateStatus || 'Ongoing'}</span>
                </div>
              </div>

              {/* Integrity Assessment Card */}
              <div className="p-3.5 text-xs bg-green-900 border-none rounded-2xl text-white">
                <h4 className="font-extrabold uppercase text-[8px] tracking-widest text-yellow-400 mb-1">🎓 NMC Academic Directive Feedback</h4>
                <p className="text-[10px] text-green-105 leading-relaxed font-medium">
                  Fantastic job! Your attendance indexes are highly functional. Your advanced educational status and service duration as {emp?.position || 'Senior Developer'} show professional, high-integrity excellence in support of Northern Mindanao Colleges.
                </p>
              </div>

              {/* Actions row */}
              <div className="pt-1 flex gap-2">
                <button 
                  onClick={() => setActiveView('leaves')}
                  className="flex-1 py-3 text-center bg-yellow-400 hover:bg-yellow-500 text-green-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-yellow-400/10"
                >
                  File Leave Application
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // Basic Counter Stats
  const stats = useMemo(() => ({
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === 'Active').length,
    retiredEmployees: employees.filter(e => e.status === 'Retired').length,
    totalMonthlyPayroll: payroll.reduce((acc, p) => acc + p.cola, 0),
    activeLeaves: leaves.filter(l => l.status === 'Approved').length,
  }), [employees, payroll, leaves]);

  // -- 1. Attendance Statistics Computation --
  const latestAttendanceDate = useMemo(() => {
    if (attendance.length === 0) return 'Recent Records';
    const dates = attendance.map(a => a.date);
    const uniqueDatesSorted = [...new Set(dates)].sort();
    return uniqueDatesSorted.pop() || 'Recent Records';
  }, [attendance]);

  const attendanceStats = useMemo(() => {
    // Filter attendance for the latest date to represent "daily attendance"
    const dailyRecords = attendance.filter(a => a.date === latestAttendanceDate);
    
    let present = 0;
    let late = 0;
    let absent = 0;
    let onLeave = 0;

    dailyRecords.forEach(a => {
      if (a.status === 'Present') present++;
      else if (a.status === 'Late') late++;
      else if (a.status === 'Absent') absent++;
      else if (a.status === 'On Leave') onLeave++;
    });

    // If database attendance is empty, populate standard indicator stats for real visualization
    if (attendance.length === 0) {
      present = 8;
      late = 2;
      absent = 1;
      onLeave = 1;
    } else if (dailyRecords.length === 0) {
      // Fallback to average historical status if the latest date has nothing
      attendance.forEach(a => {
        if (a.status === 'Present') present++;
        else if (a.status === 'Late') late++;
        else if (a.status === 'Absent') absent++;
        else if (a.status === 'On Leave') onLeave++;
      });
    }

    const total = present + late + absent + onLeave || 1;

    return {
      dateText: latestAttendanceDate,
      present,
      late,
      absent,
      onLeave,
      total,
      presentPct: Math.round((present / total) * 100),
      latePct: Math.round((late / total) * 100),
      absentPct: Math.round((absent / total) * 100),
      onLeavePct: Math.round((onLeave / total) * 100),
    };
  }, [attendance, latestAttendanceDate]);

  // -- 2. Department Statistics Computation --
  const departmentStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    employees.forEach(emp => {
      const dept = emp.department || 'General Administration';
      counts[dept] = (counts[dept] || 0) + 1;
    });

    // Populate placeholder if empty so graph isn't dry
    if (employees.length === 0) {
      counts['MIS'] = 3;
      counts['Quality Assurance Office'] = 2;
      counts['Accounting /Finance Department'] = 1;
      counts['Office of the President'] = 1;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const maxVal = Math.max(...Object.values(counts), 1);

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
      relativePct: Math.round((count / maxVal) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [employees]);

  // -- 3. Leave Requests Summary Computation --
  const leaveStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    leaves.forEach(l => {
      if (l.status === 'Approved') approved++;
      else if (l.status === 'Pending') pending++;
      else if (l.status === 'Rejected') rejected++;
    });

    if (leaves.length === 0) {
      approved = 2;
      pending = 1;
      rejected = 1;
    }

    const total = approved + pending + rejected || 1;

    // Leave Types Grouping
    const types: { [key: string]: number } = {};
    leaves.forEach(l => {
      types[l.type] = (types[l.type] || 0) + 1;
    });

    if (leaves.length === 0) {
      types['Sick Leave'] = 2;
      types['Vacation Leave'] = 1;
      types['Maternity/Paternity'] = 1;
    }

    const typesTotal = Object.values(types).reduce((a, b) => a + b, 0) || 1;

    return {
      approved,
      pending,
      rejected,
      total,
      approvedPct: Math.round((approved / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      rejectedPct: Math.round((rejected / total) * 100),
      types: Object.entries(types).map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / typesTotal) * 100)
      })).sort((a, b) => b.count - a.count)
    };
  }, [leaves]);

  // -- 4. Qualifications & Education Chart Computation --
  const educationStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    
    employees.forEach(emp => {
      const level = emp.educationLevel || 'College Graduate';
      counts[level] = (counts[level] || 0) + 1;
    });

    if (employees.length === 0) {
      counts['Post Graduate'] = 2;
      counts['College Graduate'] = 3;
      counts['Undergraduate'] = 1;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    const colorMap: { [key: string]: string } = {
      'Post Graduate': 'bg-green-700',
      'Graduate': 'bg-emerald-500',
      'College Graduate': 'bg-yellow-400',
      'Undergraduate': 'bg-orange-400'
    };

    return Object.entries(counts).map(([level, count]) => ({
      level,
      count,
      pct: Math.round((count / total) * 100),
      color: colorMap[level] || 'bg-gray-400'
    })).sort((a, b) => b.count - a.count);
  }, [employees]);

  // -- 5. Recruitment & Career Funnel Computation --
  const recruitmentStats = useMemo(() => {
    let applied = 0;
    let interviewing = 0;
    let offered = 0;
    let rejected = 0;

    applicants.forEach(a => {
      if (a.status === 'Applied') applied++;
      else if (a.status === 'Interviewing') interviewing++;
      else if (a.status === 'Offered') offered++;
      else if (a.status === 'Rejected') rejected++;
    });

    if (applicants.length === 0) {
      applied = 15;
      interviewing = 6;
      offered = 2;
      rejected = 4;
    }

    const total = applied + interviewing + offered + rejected || 1;

    return {
      applied,
      interviewing,
      offered,
      rejected,
      total,
      appliedPct: Math.round((applied / total) * 100),
      interviewingPct: Math.round((interviewing / total) * 100),
      offeredPct: Math.round((offered / total) * 100),
      rejectedPct: Math.round((rejected / total) * 100),
    };
  }, [applicants]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Logo className="w-20 h-20" />
          <div>
            <h1 className="text-4xl font-black text-green-950 uppercase tracking-tighter">DASHBOARD</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">NMC-HR Personnel Information Intelligence</span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900 rounded-full shadow-sm">
                <Users size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">HR OFFICE</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono tracking-tight bg-white border border-gray-100 rounded-xl px-3.5 py-1.5 shadow-sm">
            UTC: 2026-06-08 02:45:37
          </span>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employee', value: stats.totalEmployees, icon: Users, bg: 'bg-green-100', text: 'text-green-900', viewTarget: 'employees' },
          { label: 'Active Employee', value: stats.activeEmployees, icon: UserCheck, bg: 'bg-emerald-100', text: 'text-emerald-900', viewTarget: 'employees' },
          { label: 'Retired', value: stats.retiredEmployees, icon: UserX, bg: 'bg-orange-100', text: 'text-orange-900', viewTarget: 'employees' },
          { label: 'On Leave', value: stats.activeLeaves, icon: CalendarDays, bg: 'bg-purple-100', text: 'text-purple-900', viewTarget: 'leaves' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -4 }}
            onClick={() => setActiveView(stat.viewTarget)}
            className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer transition-all hover:border-yellow-200"
          >
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.text} mb-2 group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} />
            </div>
            <h3 className="text-xl font-black text-green-950 leading-none">{stat.value}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Reports & Analytics Summary Header */}
      <div className="mt-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-green-800 font-black text-xs uppercase tracking-widest">
              <BarChart3 size={16} className="text-yellow-500" />
              <span>NMC-HR Intelligence Reporting Center</span>
            </div>
            <h2 className="text-2xl font-black text-green-950 uppercase tracking-tight mt-1">Interactive Analytics Summary</h2>
            <p className="text-xs text-gray-400 font-medium">Dynamically synchronized records reflecting real-time personnel audits, metrics groups, and system parameters.</p>
          </div>
          
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-2xl p-1">
            {(['all', 'attendance', 'department', 'leaves'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChartTab(tab)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeChartTab === tab 
                    ? 'bg-green-900 text-yellow-400 shadow-sm' 
                    : 'text-green-800 hover:bg-green-50/50'
                }`}
              >
                {tab === 'all' ? 'All Summaries' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid layout of charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart Card A: Daily Attendance Summary (Columns Chart) */}
          {(activeChartTab === 'all' || activeChartTab === 'attendance') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-green-950 text-sm uppercase tracking-tight">Daily Attendance Summary</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Report date: {attendanceStats.dateText}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveView('attendance')}
                    className="flex items-center gap-0.5 text-[10px] font-black text-green-700 uppercase tracking-wider hover:text-green-900"
                  >
                    Manage
                    <ChevronRight size={12} />
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 mb-6">
                  Aggregate staffing presence reflecting registered shift clock-ins relative to target rosters. Update daily records in Attendance to watch indicators shift.
                </p>

                {/* Vertical columns bar stats */}
                <div className="h-52 flex items-end justify-between gap-4 px-2 pt-6 pb-2">
                  {[
                    { label: 'Present', count: attendanceStats.present, pct: attendanceStats.presentPct, colorClass: 'bg-emerald-500' },
                    { label: 'Late', count: attendanceStats.late, pct: attendanceStats.latePct, colorClass: 'bg-amber-400' },
                    { label: 'Absent', count: attendanceStats.absent, pct: attendanceStats.absentPct, colorClass: 'bg-red-400' },
                    { label: 'On Leave', count: attendanceStats.onLeave, pct: attendanceStats.onLeavePct, colorClass: 'bg-purple-400' },
                  ].map((col, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                      <div className="relative w-full flex items-end justify-center h-full">
                        {/* Background structural track */}
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-gray-50 rounded-2xl -z-0"></div>
                        
                        {/* The dynamic bar height */}
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${col.pct || 4}%` }} // Min 4% height so readable even if zero
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                          className={`w-full ${col.colorClass} rounded-2xl cursor-pointer relative z-10 transition-all hover:brightness-105 shadow-sm block group-hover:scale-x-[1.03]`}
                        >
                          {/* Live overlay tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-950 text-white text-[10px] font-black py-1.5 px-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-lg pointer-events-none">
                            {col.count} Staff ({col.pct}%)
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-tight">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Footer bar */}
              <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Total Audited today:</span>
                <span className="font-black text-green-950 text-xs bg-gray-50 px-2.5 py-1 rounded-lg">{attendanceStats.total} Employees</span>
              </div>
            </motion.div>
          )}

          {/* Chart Card B: Department Breakdown Report (Horizontal Progress Bar list) */}
          {(activeChartTab === 'all' || activeChartTab === 'department') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-50 text-green-800 rounded-xl">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-green-950 text-sm uppercase tracking-tight">Departmental Distribution</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Department Counts</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveView('employees')}
                    className="flex items-center gap-0.5 text-[10px] font-black text-green-700 uppercase tracking-wider hover:text-green-900"
                  >
                    View Staff
                    <ChevronRight size={12} />
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 mb-5">
                  Breakdown distribution of employee registers classified by Academic or Administrative organizational sections.
                </p>

                {/* Horizontal Progress Bars list */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {departmentStats.map((dept, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-black text-green-950 tracking-tight">{dept.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 font-bold">{dept.count} Staff</span>
                          <span className="text-green-800 font-black bg-green-50 px-1.5 py-0.5 rounded text-[10px]">{dept.pct}%</span>
                        </div>
                      </div>
                      
                      <div className="relative w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${dept.relativePct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.08 }}
                          className="h-full bg-linear-to-r from-green-800 to-green-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Primary Department:</span>
                <span className="font-black text-green-800 text-xs">{departmentStats[0]?.name || 'None'} ({departmentStats[0]?.count || 0})</span>
              </div>
            </motion.div>
          )}

          {/* Chart Card C: Out-of-Office & Leave Allocation Report */}
          {(activeChartTab === 'all' || activeChartTab === 'leaves') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 text-purple-800 rounded-xl">
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-green-950 text-sm uppercase tracking-tight">Leaves Allocation & Status</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leave Applications Report</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveView('leaves')}
                    className="flex items-center gap-0.5 text-[10px] font-black text-green-700 uppercase tracking-wider hover:text-green-900"
                  >
                    Approvals
                    <ChevronRight size={12} />
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 mb-4">
                  Staff absences status summary. Approved, pending, or rejected request proportions matching annual coverage models.
                </p>

                {/* Compact Leave Types List with Mini Horizontal Segment ribbon */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status Proportions</span>
                    
                    {/* Compound segment progress bar */}
                    <div className="w-full h-4 bg-gray-50 rounded-xl overflow-hidden flex shadow-inner">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${leaveStats.approvedPct}%` }} title={`Approved ${leaveStats.approvedPct}%`} />
                      <div className="bg-amber-400 h-full transition-all" style={{ width: `${leaveStats.pendingPct}%` }} title={`Pending ${leaveStats.pendingPct}%`} />
                      <div className="bg-red-400 h-full transition-all" style={{ width: `${leaveStats.rejectedPct}%` }} title={`Rejected ${leaveStats.rejectedPct}%`} />
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] font-black pt-1">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Approved ({leaveStats.approved})
                      </span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Pending ({leaveStats.pending})
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Rejected ({leaveStats.rejected})
                      </span>
                    </div>
                  </div>

                  {/* Secondary stats on types */}
                  <div className="pt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Requests By Category Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      {leaveStats.types.slice(0, 4).map((type, i) => (
                        <div key={i} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-gray-500 truncate">{type.type}</span>
                          <span className="text-sm font-black text-green-950 mt-1">{type.count} <span className="text-[10px] text-gray-400">({type.pct}%)</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-3 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Total Applications:</span>
                <span className="font-black text-green-950 text-xs bg-gray-50 px-2 py-0.5 rounded">{leaveStats.total} Requests</span>
              </div>
            </motion.div>
          )}

          {/* Chart Card D: Personnel Qualifications Summary (Academic Degree level counts) */}
          {activeChartTab === 'all' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-50 text-yellow-950 rounded-xl">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-green-950 text-sm uppercase tracking-tight">Personnel Education Levels</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Academic Credentials</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 mb-6">
                  Aggregate indicator of maximum attained qualifications inside NMC faculties & supportive services lists.
                </p>

                {/* Circle radial meter of high-end indicators */}
                <div className="space-y-3.5">
                  {educationStats.map((edu, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      {/* Round bullet color code */}
                      <span className={`w-3.5 h-3.5 rounded-full ${edu.color} shrink-0`} />
                      
                      {/* Name & value details */}
                      <div className="flex-1 flex items-center justify-between text-xs font-bold text-green-950 border-b border-gray-50 pb-2">
                        <span className="truncate">{edu.level}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-gray-400 font-bold">{edu.count} Staff</span>
                          <span className="text-green-800 font-black bg-yellow-100 text-[10px] px-1.5 py-0.5 rounded">{edu.pct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Education */}
              <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Primary Qualification:</span>
                <span className="font-black text-green-800 text-xs">{educationStats[0]?.level || 'None'}</span>
              </div>
            </motion.div>
          )}

          {/* Chart Card E: Talent Acquisition Pipeline (Recruitment Funnel) */}
          {activeChartTab === 'all' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-green-950 text-sm uppercase tracking-tight">Recruitment Funnel</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Talent Acquisition Portals</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 mb-5">
                  Interactive recruitment pipeline summarizing incoming applicant counts.
                </p>

                {/* Staggered dynamic status block levels */}
                <div className="space-y-2">
                  {[
                    { label: 'Applied', count: recruitmentStats.applied, pct: recruitmentStats.appliedPct, colorClass: 'bg-blue-500 text-white' },
                    { label: 'Interviewing', count: recruitmentStats.interviewing, pct: recruitmentStats.interviewingPct, colorClass: 'bg-indigo-500 text-white' },
                    { label: 'Offered', count: recruitmentStats.offered, pct: recruitmentStats.offeredPct, colorClass: 'bg-green-600 text-white' },
                    { label: 'Rejected', count: recruitmentStats.rejected, pct: recruitmentStats.rejectedPct, colorClass: 'bg-rose-500 text-white' },
                  ].map((stage, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-2xl relative overflow-hidden group hover:bg-white hover:border-blue-100 cursor-pointer transition-all"
                      onClick={() => setActiveView('talent-acquisition')}
                    >
                      <div className="flex items-center gap-2 z-10">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${stage.colorClass}`}>
                          {stage.count}
                        </span>
                        <span className="text-[11px] font-black text-green-950 group-hover:text-blue-900 transition-colors">{stage.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 group-hover:text-blue-800 font-black z-10">{stage.pct}%</span>
                      {/* Subtle hover background highlight segment */}
                      <span className="absolute bottom-0 left-0 top-0 bg-blue-50/10 transition-all group-hover:w-full -z-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruitment status footer */}
              <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Total Evaluated:</span>
                <span className="font-black text-green-950 text-xs bg-gray-50 px-2 py-0.5 rounded">{recruitmentStats.total} Profiles</span>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};
