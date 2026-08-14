import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  CalendarDays,
  BarChart3,
  GraduationCap,
  Building2,
  Clock,
  Briefcase,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Logo } from '../../assets/common/Logo';
import { motion } from 'motion/react';
import { useDashboardQuery } from '../../hooks/useDashboard';
import { ApiRequestError } from '../../utils/apiClient';

interface DashboardProps {
  setActiveView: (view: string) => void;
}

const EDUCATION_COLORS: Record<string, string> = {
  'Post Graduate': 'bg-green-700',
  'Graduate': 'bg-emerald-500',
  "Master's Degree": 'bg-green-700',
  'College Graduate': 'bg-yellow-400',
  'Undergraduate': 'bg-orange-400',
};

export const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'attendance' | 'department' | 'leaves'>('all');
  const dashboardQuery = useDashboardQuery();

  const summary = dashboardQuery.data;
  const listError =
    dashboardQuery.error instanceof ApiRequestError
      ? dashboardQuery.error.message
      : dashboardQuery.error instanceof Error
        ? dashboardQuery.error.message
        : dashboardQuery.error
          ? 'Failed to load dashboard.'
          : null;

  if (dashboardQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-800" />
      </div>
    );
  }

  if (listError || !summary) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-[30px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-red-700">{listError ?? 'Failed to load dashboard.'}</p>
      </div>
    );
  }

  const stats = summary.stats;
  const attendanceStats = summary.attendance;
  const departmentStats = summary.departments;
  const leaveStats = summary.leaves;
  const educationStats = summary.education.map((edu) => ({
    ...edu,
    color: EDUCATION_COLORS[edu.level] || 'bg-gray-400',
  }));
  const recruitmentStats = summary.recruitment;
  const generatedAt = new Date(summary.generatedAt).toISOString().replace('T', ' ').slice(0, 19);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
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
            UTC: {generatedAt}
          </span>
        </div>
      </header>

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

                <div className="h-52 flex items-end justify-between gap-4 px-2 pt-6 pb-2">
                  {[
                    { label: 'Present', count: attendanceStats.present, pct: attendanceStats.presentPct, colorClass: 'bg-emerald-500' },
                    { label: 'Late', count: attendanceStats.late, pct: attendanceStats.latePct, colorClass: 'bg-amber-400' },
                    { label: 'Absent', count: attendanceStats.absent, pct: attendanceStats.absentPct, colorClass: 'bg-red-400' },
                    { label: 'On Leave', count: attendanceStats.onLeave, pct: attendanceStats.onLeavePct, colorClass: 'bg-purple-400' },
                  ].map((col, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                      <div className="relative w-full flex items-end justify-center h-full">
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-gray-50 rounded-2xl -z-0"></div>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${col.pct || 4}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                          className={`w-full ${col.colorClass} rounded-2xl cursor-pointer relative z-10 transition-all hover:brightness-105 shadow-sm block group-hover:scale-x-[1.03]`}
                        >
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

              <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Total Audited today:</span>
                <span className="font-black text-green-950 text-xs bg-gray-50 px-2.5 py-1 rounded-lg">{attendanceStats.total} Employees</span>
              </div>
            </motion.div>
          )}

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

                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {departmentStats.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium">No employee records yet.</p>
                  ) : departmentStats.map((dept, index) => (
                    <div key={dept.name} className="space-y-1">
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

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status Proportions</span>
                    
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

                  <div className="pt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Requests By Category Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      {leaveStats.types.slice(0, 4).map((type) => (
                        <div key={type.type} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
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

                <div className="space-y-3.5">
                  {educationStats.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium">No education data yet.</p>
                  ) : educationStats.map((edu) => (
                    <div key={edu.level} className="flex items-center gap-4">
                      <span className={`w-3.5 h-3.5 rounded-full ${edu.color} shrink-0`} />
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

              <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold uppercase tracking-wider">Primary Qualification:</span>
                <span className="font-black text-green-800 text-xs">{educationStats[0]?.level || 'None'}</span>
              </div>
            </motion.div>
          )}

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

                <div className="space-y-2">
                  {[
                    { label: 'Applied', count: recruitmentStats.applied, pct: recruitmentStats.appliedPct, colorClass: 'bg-blue-500 text-white' },
                    { label: 'Interviewing', count: recruitmentStats.interviewing, pct: recruitmentStats.interviewingPct, colorClass: 'bg-indigo-500 text-white' },
                    { label: 'Offered', count: recruitmentStats.offered, pct: recruitmentStats.offeredPct, colorClass: 'bg-green-600 text-white' },
                    { label: 'Rejected', count: recruitmentStats.rejected, pct: recruitmentStats.rejectedPct, colorClass: 'bg-rose-500 text-white' },
                  ].map((stage) => (
                    <div 
                      key={stage.label} 
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
                      <span className="absolute bottom-0 left-0 top-0 bg-blue-50/10 transition-all group-hover:w-full -z-0" />
                    </div>
                  ))}
                </div>
              </div>

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
