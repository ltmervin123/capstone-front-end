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
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../assets/common/Logo';
import { motion } from 'motion/react';
import { useDashboardQuery } from '../../hooks/useDashboard';
import { ApiRequestError } from '../../utils/apiClient';

interface DashboardProps {
  setActiveView?: (view: string) => void;
}

type ChartTab = 'all' | 'attendance' | 'department' | 'leaves' | 'education' | 'recruitment';

const CHART_TABS: { id: ChartTab; label: string }[] = [
  { id: 'all', label: 'All Metrics' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'department', label: 'Departments' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'education', label: 'Education' },
  { id: 'recruitment', label: 'Recruitment' },
];

const EDUCATION_COLORS: Record<string, string> = {
  'Post Graduate': 'bg-emerald-700',
  "Master's Degree": 'bg-green-700',
  'Graduate': 'bg-teal-600',
  'College Graduate': 'bg-amber-500',
  'Undergraduate': 'bg-orange-400',
};

export const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const navigate = useNavigate();
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('all');
  const dashboardQuery = useDashboardQuery();

  const handleNavigate = (pathOrView: string) => {
    if (setActiveView) {
      setActiveView(pathOrView.replace(/^\//, ''));
    }
    const targetPath = pathOrView.startsWith('/') ? pathOrView : `/${pathOrView}`;
    navigate(targetPath);
  };

  const summary = dashboardQuery.data;
  const listError =
    dashboardQuery.error instanceof ApiRequestError
      ? dashboardQuery.error.message
      : dashboardQuery.error instanceof Error
        ? dashboardQuery.error.message
        : dashboardQuery.error
          ? 'Failed to load dashboard data.'
          : null;

  if (dashboardQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-green-800" />
        <span className="text-sm font-medium text-stone-600">Loading dashboard metrics...</span>
      </div>
    );
  }

  if (listError || !summary) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-700">{listError ?? 'Unable to load dashboard records at this time.'}</p>
        <button
          type="button"
          onClick={() => dashboardQuery.refetch()}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const stats = summary.stats;
  const attendanceStats = summary.attendance;
  const departmentStats = summary.departments;
  const leaveStats = summary.leaves;
  const educationStats = summary.education.map((edu) => ({
    ...edu,
    color: EDUCATION_COLORS[edu.level] || 'bg-stone-400',
  }));
  const recruitmentStats = summary.recruitment;
  const generatedDate = new Date(summary.generatedAt);
  const datePart = generatedDate.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = generatedDate.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const generatedAt = `${datePart} at ${timePart}`;

  const statCards = [
    { 
      label: 'Total Staff', 
      subtitle: 'Registered personnel', 
      value: stats.totalEmployees, 
      icon: Users, 
      iconBg: 'bg-emerald-50 text-emerald-800', 
      viewTarget: 'employees' 
    },
    { 
      label: 'Active Personnel', 
      subtitle: 'Currently reporting', 
      value: stats.activeEmployees, 
      icon: UserCheck, 
      iconBg: 'bg-green-50 text-green-800', 
      viewTarget: 'employees' 
    },
    { 
      label: 'Retired Staff', 
      subtitle: 'Completed service', 
      value: stats.retiredEmployees, 
      icon: UserX, 
      iconBg: 'bg-amber-50 text-amber-900', 
      viewTarget: 'employees' 
    },
    { 
      label: 'On Leave', 
      subtitle: 'Approved absences', 
      value: stats.activeLeaves, 
      icon: CalendarDays, 
      iconBg: 'bg-purple-50 text-purple-800', 
      viewTarget: 'leaves' 
    },
  ];

  const isTabVisible = (tab: ChartTab) => activeChartTab === 'all' || activeChartTab === tab;
  const isSingleTabActive = activeChartTab !== 'all';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              Administrative Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Human Resources Information System
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <Users size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">HR Office</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated {generatedAt}</span>
          </span>
        </div>
      </header>

      {/* KPI Overview Cards */}
      <section aria-label="Key personnel metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -3 }}
            onClick={() => handleNavigate(stat.viewTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavigate(stat.viewTarget);
              }
            }}
            role="button"
            tabIndex={0}
            className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
          >
            <div className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
              {stat.value}
            </h2>
            <p className="text-sm font-bold text-stone-800 mt-2">{stat.label}</p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
          </motion.div>
        ))}
      </section>

      {/* Operations & Detailed Analytics */}
      <section aria-label="Operational analytics" className="mt-8 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <BarChart3 size={22} className="text-amber-500" />
              Operational Overview
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Live metrics across daily attendance, department headcounts, leave requests, and recruiting pipelines.
            </p>
          </div>
          
          {/* Tab Filter Switcher */}
          <div 
            role="tablist" 
            aria-label="Filter dashboard analytics view" 
            className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {CHART_TABS.map((tab) => {
              const isActive = activeChartTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveChartTab(tab.id)}
                  className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                    isActive 
                      ? 'bg-green-900 text-amber-300 shadow-xs' 
                      : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
          {/* Daily Attendance Card */}
          {isTabVisible('attendance') && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isSingleTabActive 
                  ? 'col-span-1 md:col-span-12 lg:col-span-12' 
                  : 'col-span-1 md:col-span-12 lg:col-span-6'
              } bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-950 text-base">Today&apos;s Attendance</h3>
                      <p className="text-xs text-stone-500 font-medium">Logged for {attendanceStats.dateText}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNavigate('/attendance')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-green-950 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  >
                    <span>Manage</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <p className="text-xs text-stone-600 mb-6">
                  Staff present, late, on leave, or absent against today&apos;s scheduled rosters. Click Manage to review timesheets.
                </p>

                <div className="h-56 flex items-end justify-between gap-4 px-2 pt-6 pb-2">
                  {[
                    { label: 'Present', count: attendanceStats.present, pct: attendanceStats.presentPct, colorClass: 'bg-emerald-500' },
                    { label: 'Late', count: attendanceStats.late, pct: attendanceStats.latePct, colorClass: 'bg-amber-400' },
                    { label: 'Absent', count: attendanceStats.absent, pct: attendanceStats.absentPct, colorClass: 'bg-rose-500' },
                    { label: 'On Leave', count: attendanceStats.onLeave, pct: attendanceStats.onLeavePct, colorClass: 'bg-purple-500' },
                  ].map((col, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                      <div className="mb-2 text-center">
                        <span className="block text-xs font-extrabold text-green-950 tabular-nums">{col.count}</span>
                        <span className="block text-[11px] font-medium text-stone-500 tabular-nums">{col.pct}%</span>
                      </div>
                      <div className="relative w-full flex items-end justify-center h-full">
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-stone-100 rounded-xl -z-0" />
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${col.pct || 4}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.08 }}
                          className={`w-full ${col.colorClass} rounded-xl cursor-pointer relative z-10 transition-all hover:brightness-105 shadow-xs block group-hover:scale-x-[1.03]`}
                        >
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-green-950 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md pointer-events-none">
                            {col.count} Staff ({col.pct}%)
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-xs font-semibold text-stone-600 mt-2">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 mt-4 flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium">Total Scheduled Today</span>
                <span className="font-bold text-green-950 bg-stone-100 px-2.5 py-1 rounded-lg tabular-nums">
                  {attendanceStats.total} Employees
                </span>
              </div>
            </motion.div>
          )}

          {/* Department Distribution Card */}
          {isTabVisible('department') && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isSingleTabActive 
                  ? 'col-span-1 md:col-span-12 lg:col-span-12' 
                  : 'col-span-1 md:col-span-12 lg:col-span-6'
              } bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-green-50 text-green-800 rounded-xl">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-950 text-base">Department Distribution</h3>
                      <p className="text-xs text-stone-500 font-medium">Headcount breakdown</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNavigate('/employees')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-green-950 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  >
                    <span>View Directory</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <p className="text-xs text-stone-600 mb-5">
                  Active faculty and staff distribution across academic departments and administrative offices.
                </p>

                <div className="space-y-3.5 max-h-[230px] overflow-y-auto pr-1">
                  {departmentStats.length === 0 ? (
                    <p className="text-xs text-stone-500 font-medium py-4 text-center">No employee records found.</p>
                  ) : departmentStats.map((dept, index) => (
                    <div key={dept.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-green-950">{dept.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-stone-500 font-medium tabular-nums">{dept.count} Staff</span>
                          <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] tabular-nums">
                            {dept.pct}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${dept.relativePct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.06 }}
                          className="h-full bg-linear-to-r from-green-800 to-emerald-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 mt-4 flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium">Largest Unit</span>
                <span className="font-bold text-green-900 tabular-nums">
                  {departmentStats[0]?.name || 'None'} ({departmentStats[0]?.count || 0} Staff)
                </span>
              </div>
            </motion.div>
          )}

          {/* Leaves Allocation & Status Card */}
          {isTabVisible('leaves') && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-1 md:col-span-12 lg:col-span-12 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 text-purple-800 rounded-xl">
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-950 text-base">Leave Requests</h3>
                      <p className="text-xs text-stone-500 font-medium">Review and approvals</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNavigate('/leaves')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-green-950 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  >
                    <span>Manage Leaves</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <p className="text-xs text-stone-600 mb-4">
                  Summary of leave applications submitted for review, pending approvals, and type breakdown.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Left: Approval Status */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-stone-700 block">Approval Status</span>
                    
                    <div className="w-full h-3.5 bg-stone-100 rounded-lg overflow-hidden flex shadow-inner">
                      <div 
                        className="bg-emerald-500 h-full transition-all" 
                        style={{ width: `${leaveStats.approvedPct}%` }} 
                        title={`Approved: ${leaveStats.approved} (${leaveStats.approvedPct}%)`} 
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all" 
                        style={{ width: `${leaveStats.pendingPct}%` }} 
                        title={`Pending: ${leaveStats.pending} (${leaveStats.pendingPct}%)`} 
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all" 
                        style={{ width: `${leaveStats.rejectedPct}%` }} 
                        title={`Rejected: ${leaveStats.rejected} (${leaveStats.rejectedPct}%)`} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-semibold pt-1">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        Approved ({leaveStats.approved})
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        Pending ({leaveStats.pending})
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        Rejected ({leaveStats.rejected})
                      </span>
                    </div>
                  </div>

                  {/* Right: Requests by Leave Type */}
                  <div>
                    <span className="text-xs font-bold text-stone-700 block mb-2">Requests by Leave Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      {leaveStats.types.slice(0, 4).map((type) => (
                        <div key={type.type} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60 flex flex-col justify-between">
                          <span className="text-xs font-medium text-stone-600 truncate">{type.type}</span>
                          <span className="text-sm font-bold text-green-950 mt-1 tabular-nums">
                            {type.count} <span className="text-xs font-normal text-stone-500">({type.pct}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3 mt-4 flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium">Total Applications</span>
                <span className="font-bold text-green-950 bg-stone-100 px-2.5 py-1 rounded-lg tabular-nums">
                  {leaveStats.total} Requests
                </span>
              </div>
            </motion.div>
          )}

          {/* Education Attainment Card */}
          {isTabVisible('education') && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isSingleTabActive 
                  ? 'col-span-1 md:col-span-12 lg:col-span-12' 
                  : 'col-span-1 md:col-span-6 lg:col-span-6'
              } bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-50 text-amber-900 rounded-xl">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-950 text-base">Education Levels</h3>
                      <p className="text-xs text-stone-500 font-medium">Academic qualifications</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-600 mb-5">
                  Highest completed qualifications recorded across faculty and administrative personnel.
                </p>

                <div className="space-y-3">
                  {educationStats.length === 0 ? (
                    <p className="text-xs text-stone-500 font-medium py-4 text-center">No education records found.</p>
                  ) : educationStats.map((edu) => (
                    <div key={edu.level} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${edu.color} shrink-0`} />
                      <div className="flex-1 flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                        <span className="font-medium text-stone-800 truncate">{edu.level}</span>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-stone-500 font-medium">{edu.count} Staff</span>
                          <span className="text-amber-900 font-bold bg-amber-100/80 text-[11px] px-2 py-0.5 rounded">
                            {edu.pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 mt-4 flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium">Most Common Level</span>
                <span className="font-bold text-green-900">
                  {educationStats[0]?.level || 'None'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Recruitment Funnel Card */}
          {isTabVisible('recruitment') && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isSingleTabActive 
                  ? 'col-span-1 md:col-span-12 lg:col-span-12' 
                  : 'col-span-1 md:col-span-6 lg:col-span-6'
              } bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-950 text-base">Recruitment Pipeline</h3>
                      <p className="text-xs text-stone-500 font-medium">Active hiring stages</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNavigate('/talent-acquisition')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-hidden"
                  >
                    <span>View</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <p className="text-xs text-stone-600 mb-4">
                  Active candidate volume across screening, interview rounds, and job offers.
                </p>

                <div className="space-y-2">
                  {[
                    { label: 'Applied', count: recruitmentStats.applied, pct: recruitmentStats.appliedPct, badgeClass: 'bg-blue-100 text-blue-800' },
                    { label: 'Interviewing', count: recruitmentStats.interviewing, pct: recruitmentStats.interviewingPct, badgeClass: 'bg-indigo-100 text-indigo-800' },
                    { label: 'Offered', count: recruitmentStats.offered, pct: recruitmentStats.offeredPct, badgeClass: 'bg-emerald-100 text-emerald-800' },
                    { label: 'Hired', count: recruitmentStats.hired, pct: recruitmentStats.hiredPct, badgeClass: 'bg-green-100 text-green-900 font-bold' },
                    { label: 'Rejected', count: recruitmentStats.rejected, pct: recruitmentStats.rejectedPct, badgeClass: 'bg-rose-100 text-rose-800' },
                  ].map((stage) => (
                    <div 
                      key={stage.label} 
                      onClick={() => handleNavigate('/talent-acquisition')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNavigate('/talent-acquisition');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200/60 rounded-xl relative overflow-hidden group hover:bg-white hover:border-blue-200 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-hidden"
                    >
                      <div className="flex items-center gap-2 z-10">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${stage.badgeClass}`}>
                          {stage.count}
                        </span>
                        <span className="text-xs font-semibold text-green-950 group-hover:text-blue-900 transition-colors">
                          {stage.label}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-stone-500 group-hover:text-blue-800 tabular-nums z-10">
                        {stage.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 mt-4 flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium">Total Candidates</span>
                <span className="font-bold text-green-950 bg-stone-100 px-2.5 py-1 rounded-lg tabular-nums">
                  {recruitmentStats.total} Profiles
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};
