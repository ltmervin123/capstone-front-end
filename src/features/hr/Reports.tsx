import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Award,
  Users,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Logo } from '../../assets/common/Logo';
import {
  useEmploymentReportQuery,
  usePromotionReportQuery,
  useAttendanceReportQuery,
  useReportFiltersQuery,
} from '../../hooks/useReports';
import { exportToCsv } from '../../utils/exportUtils';
import type {
  EmploymentReportRecord,
  PromotionReportRecord,
  AttendanceReportRecord,
} from '../../services/reportService';

interface ReportsProps {
  initialType?: string;
}

type ReportType = 'Employment Report' | 'Promotion Report' | 'Timely Report';
type DatePreset =
  'all' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

const REPORT_OPTIONS: Array<{
  label: ReportType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  desc: string;
}> = [
  {
    label: 'Employment Report',
    icon: ArrowUpRight,
    desc: 'Staff records, headcount & tenure movements',
  },
  {
    label: 'Promotion Report',
    icon: TrendingUp,
    desc: 'Personnel advancements & career progression',
  },
  {
    label: 'Timely Report',
    icon: Clock,
    desc: 'Punctuality, login records & timeliness statistics',
  },
];

const NMC_CHART_COLORS = [
  '#14532d', // Forest Green
  '#059669', // Emerald
  '#d97706', // Warm Amber
  '#0d9488', // Teal
  '#0284c7', // Sky Blue
  '#15803d', // Leaf Green
  '#b45309', // Deep Amber
  '#0f766e', // Deep Teal
];

export const Reports: React.FC<ReportsProps> = ({ initialType }) => {
  const [reportType, setReportType] = useState<ReportType>(
    (initialType as ReportType) || 'Employment Report'
  );

  // Filters State
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Debounce search query to prevent Recharts & query thrashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Compute active date filters
  const dateFilterRange = useMemo(() => {
    const now = new Date();
    if (datePreset === 'all') {
      return { startDate: undefined, endDate: undefined };
    }
    if (datePreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      };
    }
    if (datePreset === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      };
    }
    if (datePreset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      };
    }
    if (datePreset === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  const queryFilters = useMemo(
    () => ({
      departmentId: selectedDepartment || undefined,
      startDate: dateFilterRange.startDate,
      endDate: dateFilterRange.endDate,
      search: searchQuery.trim() || undefined,
    }),
    [selectedDepartment, dateFilterRange, searchQuery]
  );

  // Query Hooks
  const filtersQuery = useReportFiltersQuery();
  const employmentQuery = useEmploymentReportQuery(
    reportType === 'Employment Report' ? queryFilters : undefined
  );
  const promotionQuery = usePromotionReportQuery(
    reportType === 'Promotion Report' ? queryFilters : undefined
  );
  const attendanceQuery = useAttendanceReportQuery(
    reportType === 'Timely Report' ? queryFilters : undefined
  );

  const activeQuery =
    reportType === 'Employment Report'
      ? employmentQuery
      : reportType === 'Promotion Report'
        ? promotionQuery
        : attendanceQuery;

  const isLoading = activeQuery.isLoading || filtersQuery.isLoading;
  const isError = activeQuery.isError;
  const errorMessage =
    activeQuery.error?.message || 'Failed to load report analytics.';

  const departments = filtersQuery.data?.departments || [];

  // Data references
  const employmentData = employmentQuery.data;
  const promotionData = promotionQuery.data;
  const attendanceData = attendanceQuery.data;

  // Formatted timestamp aligned with Dashboard
  const generatedAt = useMemo(() => {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = now.toLocaleTimeString('en-PH', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} at ${timePart}`;
  }, []);

  // CSV Export Handlers
  const handleExportCsv = () => {
    if (reportType === 'Employment Report' && employmentData) {
      exportToCsv<EmploymentReportRecord>(
        'Employment_Report',
        [
          { header: 'Employee ID', accessor: 'employeeNumber' },
          { header: 'Full Name', accessor: 'fullName' },
          { header: 'Department', accessor: 'department' },
          { header: 'Position', accessor: 'position' },
          { header: 'Tenure', accessor: 'serviceDuration' },
          { header: 'Education Level', accessor: 'educationLevel' },
          { header: 'Employment Date', accessor: 'employmentDate' },
          { header: 'Status', accessor: 'status' },
        ],
        employmentData.records
      );
    } else if (reportType === 'Promotion Report' && promotionData) {
      exportToCsv<PromotionReportRecord>(
        'Promotion_Report',
        [
          { header: 'Employee ID', accessor: 'employeeNumber' },
          { header: 'Full Name', accessor: 'fullName' },
          { header: 'Department', accessor: 'department' },
          { header: 'Previous Position', accessor: 'previousPosition' },
          { header: 'Promoted Position', accessor: 'promotedPosition' },
          { header: 'Effective Date', accessor: 'effectiveDate' },
          { header: 'Promotion Year', accessor: 'promotionYear' },
          { header: 'Status', accessor: 'promotionStatus' },
          { header: 'Rationale', accessor: 'rationale' },
          { header: 'Approved By', accessor: (r) => r.approvedBy || 'Pending' },
        ],
        promotionData.records
      );
    } else if (reportType === 'Timely Report' && attendanceData) {
      exportToCsv<AttendanceReportRecord>(
        'Timely_Attendance_Report',
        [
          { header: 'Employee ID', accessor: 'employeeNumber' },
          { header: 'Full Name', accessor: 'fullName' },
          { header: 'Department', accessor: 'department' },
          { header: 'Position', accessor: 'position' },
          { header: 'Present Logs', accessor: 'present' },
          { header: 'Late Logs', accessor: 'late' },
          { header: 'Absent Logs', accessor: 'absent' },
          { header: 'On Leave', accessor: 'onLeave' },
          { header: 'Total Logs', accessor: 'totalLogs' },
          {
            header: 'Punctuality Rate %',
            accessor: (r) => `${r.punctualityRate}%`,
          },
          {
            header: 'Attendance Rate %',
            accessor: (r) => `${r.attendanceRate}%`,
          },
          { header: 'Performance Rating', accessor: 'performanceRating' },
        ],
        attendanceData.records
      );
    }
  };

  const currentRecordCount =
    reportType === 'Employment Report'
      ? (employmentData?.records.length ?? 0)
      : reportType === 'Promotion Report'
        ? (promotionData?.records.length ?? 0)
        : (attendanceData?.records.length ?? 0);

  // Common Recharts Tooltip styling aligned with Dashboard theme
  const chartTooltipStyle = {
    backgroundColor: '#052e16',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div
      id="reporting_module_container"
      className="space-y-8 animate-in fade-in duration-300 pb-16 print:p-0 print:space-y-4"
    >
      {/* Screen Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              Institutional Reports & Analytics
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Human Resources Information System
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <BarChart3 size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  HR Office
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Generation Stamp */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            id="btn_download_csv"
            onClick={handleExportCsv}
            disabled={isLoading || currentRecordCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-900 text-amber-300 font-semibold rounded-xl text-xs hover:bg-green-800 transition-colors shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
            title="Download CSV formatted for Microsoft Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Section Header & Report Selector */}
      <section
        aria-label="Report library and filters"
        className="space-y-4 print:hidden"
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <FileText size={22} className="text-amber-500" />
              Institutional Dossier
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Comprehensive analytical records across employment movements,
              career promotion pipelines, and daily timeliness records.
            </p>
          </div>

          {/* Report Tab Switcher aligned with Dashboard tablist */}
          <div
            role="tablist"
            aria-label="Filter report dossier view"
            className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {REPORT_OPTIONS.map((opt) => {
              const isSelected = reportType === opt.label;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.label}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setReportType(opt.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                    isSelected
                      ? 'bg-green-900 text-amber-300 shadow-xs'
                      : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon
                    size={14}
                    className={isSelected ? 'text-amber-300' : 'text-stone-500'}
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtering & Drill-down Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Department Selector */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[200px]">
            <Filter size={16} className="text-stone-400 shrink-0" />
            <div className="relative flex-1">
              <label htmlFor="filter_department_select" className="sr-only">
                Filter by Department
              </label>
              <select
                id="filter_department_select"
                aria-label="Filter by department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 pr-8 font-semibold text-xs text-green-950 outline-hidden focus-visible:ring-2 focus-visible:ring-green-800 appearance-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Date Preset Selector */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[180px]">
            <Calendar size={16} className="text-stone-400 shrink-0" />
            <div className="relative flex-1">
              <label htmlFor="filter_date_preset_select" className="sr-only">
                Filter by Date Preset
              </label>
              <select
                id="filter_date_preset_select"
                aria-label="Filter by date preset"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 pr-8 font-semibold text-xs text-green-950 outline-hidden focus-visible:ring-2 focus-visible:ring-green-800 appearance-none cursor-pointer"
              >
                <option value="all">All Time History</option>
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year (2026)</option>
                <option value="custom">Custom Date Range...</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <label htmlFor="filter_custom_start_date" className="sr-only">
                Custom start date
              </label>
              <input
                id="filter_custom_start_date"
                aria-label="Custom start date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-green-950 outline-hidden focus-visible:ring-2 focus-visible:ring-green-800"
              />
              <span className="text-xs text-stone-400 font-semibold">to</span>
              <label htmlFor="filter_custom_end_date" className="sr-only">
                Custom end date
              </label>
              <input
                id="filter_custom_end_date"
                aria-label="Custom end date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-green-950 outline-hidden focus-visible:ring-2 focus-visible:ring-green-800"
              />
            </div>
          )}

          {/* Debounced Search Input */}
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <label htmlFor="filter_search_input" className="sr-only">
              Search records
            </label>
            <input
              id="filter_search_input"
              aria-label="Search employee name, ID, or position"
              type="text"
              placeholder="Search employee name, ID, or position..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 placeholder:text-stone-400 outline-hidden focus-visible:ring-2 focus-visible:ring-green-800"
            />
          </div>

          {/* Clear Filters Button */}
          {(selectedDepartment || datePreset !== 'all' || searchInput) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment('');
                setDatePreset('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setSearchInput('');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 hover:text-green-950 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Error Banner */}
      {isError && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <p className="text-xs font-semibold">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => void activeQuery.refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:outline-hidden"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* KPI Overview Cards aligned with Dashboard layout */}
      <section
        aria-label="Key report metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4"
      >
        {reportType === 'Timely Report' && attendanceData && (
          <>
            {[
              {
                label: 'Average Punctuality',
                subtitle: 'On-time arrival rate',
                value: `${attendanceData.metrics.avgPunctuality}%`,
                icon: Clock,
                iconBg: 'bg-emerald-50 text-emerald-800',
              },
              {
                label: 'Overall Attendance',
                subtitle: 'Presence compliance rate',
                value: `${attendanceData.metrics.attendanceRate}%`,
                icon: CheckCircle2,
                iconBg: 'bg-green-50 text-green-800',
              },
              {
                label: 'Audited Logs',
                subtitle: 'Active records in query',
                value: attendanceData.metrics.totalChecked,
                icon: FileText,
                iconBg: 'bg-stone-100 text-stone-800',
              },
              {
                label: 'Total Tardiness',
                subtitle: 'Recorded late check-ins',
                value: attendanceData.metrics.lates,
                icon: Clock,
                iconBg: 'bg-amber-50 text-amber-900',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group transition-all"
              >
                <div
                  className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
                >
                  <stat.icon size={22} />
                </div>
                <h3 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
                  {stat.value}
                </h3>
                <p className="text-sm font-bold text-stone-800 mt-2">
                  {stat.label}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
              </motion.div>
            ))}
          </>
        )}

        {reportType === 'Promotion Report' && promotionData && (
          <>
            {[
              {
                label: 'Promotions This Year',
                subtitle: 'Effective in 2026',
                value: promotionData.metrics.thisYearCount,
                icon: TrendingUp,
                iconBg: 'bg-amber-50 text-amber-900',
              },
              {
                label: 'Next Year Pipeline',
                subtitle: 'Scheduled for 2027',
                value: promotionData.metrics.nextYearCount,
                icon: ArrowUpRight,
                iconBg: 'bg-teal-50 text-teal-800',
              },
              {
                label: 'Approved Promotions',
                subtitle: 'Sanctioned advancements',
                value: promotionData.metrics.approvedCount,
                icon: Award,
                iconBg: 'bg-emerald-50 text-emerald-800',
              },
              {
                label: 'Total Candidates',
                subtitle: 'Career progressions tracked',
                value: promotionData.metrics.totalEvaluated,
                icon: Users,
                iconBg: 'bg-green-50 text-green-800',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group transition-all"
              >
                <div
                  className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
                >
                  <stat.icon size={22} />
                </div>
                <h3 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
                  {stat.value}
                </h3>
                <p className="text-sm font-bold text-stone-800 mt-2">
                  {stat.label}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
              </motion.div>
            ))}
          </>
        )}

        {reportType === 'Employment Report' && employmentData && (
          <>
            {[
              {
                label: 'Total Headcount',
                subtitle: 'Active institutional roster',
                value: employmentData.metrics.totalEmployees,
                icon: Users,
                iconBg: 'bg-emerald-50 text-emerald-800',
              },
              {
                label: 'Active Retention Rate',
                subtitle: `${employmentData.metrics.activeEmployees} active personnel`,
                value: `${employmentData.metrics.retentionRate}%`,
                icon: TrendingUp,
                iconBg: 'bg-green-50 text-green-800',
              },
              {
                label: 'Annual Growth',
                subtitle: `${employmentData.metrics.growthRate}% annual expansion`,
                value: `+${employmentData.metrics.recentHires}`,
                icon: ArrowUpRight,
                iconBg: 'bg-amber-50 text-amber-900',
              },
              {
                label: 'Inactive & Retired',
                subtitle: 'Transitioned personnel',
                value:
                  employmentData.metrics.inactiveEmployees +
                  employmentData.metrics.retiredEmployees,
                icon: Clock,
                iconBg: 'bg-stone-100 text-stone-700',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group transition-all"
              >
                <div
                  className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
                >
                  <stat.icon size={22} />
                </div>
                <h3 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
                  {stat.value}
                </h3>
                <p className="text-sm font-bold text-stone-800 mt-2">
                  {stat.label}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
              </motion.div>
            ))}
          </>
        )}
      </section>

      {/* Interactive Recharts Analytics Section */}
      <section
        aria-label="Detailed report visualizations"
        className="space-y-6 print:hidden"
      >
        {reportType === 'Employment Report' && employmentData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Headcount Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-green-950">
                    Headcount by Department
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    Staff concentration across academic and administrative units
                  </p>
                </div>
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg text-xs tabular-nums">
                  {employmentData.charts.departmentDistribution.length}{' '}
                  Departments
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employmentData.charts.departmentDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f5f5f4"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#78716c', fontWeight: 600 }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: '#fcd34d' }}
                    />
                    <Bar
                      dataKey="count"
                      name="Staff Count"
                      fill="#14532d"
                      radius={[6, 6, 0, 0]}
                    >
                      {employmentData.charts.departmentDistribution.map(
                        (_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={NMC_CHART_COLORS[i % NMC_CHART_COLORS.length]}
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tenure Profile */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-green-950">
                    Service Duration Profile
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    Distribution of staff tenure and institutional experience
                  </p>
                </div>
                <span className="text-amber-900 font-bold bg-amber-100/80 px-2.5 py-1 rounded-lg text-xs">
                  Tenure Bands
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employmentData.charts.tenureDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f5f5f4"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: '#78716c', fontWeight: 600 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: '#fcd34d' }}
                    />
                    <Bar
                      dataKey="count"
                      name="Employees"
                      fill="#d97706"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {reportType === 'Promotion Report' && promotionData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Promotion Pipeline by Year */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-green-950">
                    Advancement Pipeline by Year
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    Scheduled and pending promotions across review cycles
                  </p>
                </div>
                <span className="text-amber-900 font-bold bg-amber-100/80 px-2.5 py-1 rounded-lg text-xs">
                  Multi-Year Outlook
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={promotionData.charts.yearlyPipeline}
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f5f5f4"
                    />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: '#14532d', fontWeight: 700 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar
                      dataKey="approved"
                      name="Approved"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      name="In Evaluation"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Promotions by Department */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-green-950">
                    Promotions by Department
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    Advancement volume categorized by faculty and office
                  </p>
                </div>
                <span className="text-teal-900 font-bold bg-teal-50 px-2.5 py-1 rounded-lg text-xs">
                  Departmental Split
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={promotionData.charts.departmentBreakdown}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f5f5f4"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="department"
                      type="category"
                      tick={{ fontSize: 11, fill: '#14532d', fontWeight: 700 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: '#fcd34d' }}
                    />
                    <Bar
                      dataKey="count"
                      name="Candidates"
                      fill="#0d9488"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {reportType === 'Timely Report' && attendanceData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Punctuality Trend Line/Area Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-green-950">
                    Punctuality & Presence Timeline
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    Daily punctuality trajectory and arrival rate fluctuations
                  </p>
                </div>
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg text-xs tabular-nums">
                  Daily Logged Records
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={attendanceData.charts.timeseriesTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="punctualityGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#059669"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#059669"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f5f5f4"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      angle={-25}
                      textAnchor="end"
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(val) => [`${val}%`, 'Punctuality Rate']}
                    />
                    <Area
                      type="monotone"
                      dataKey="punctualityRate"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#punctualityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Status Pie Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-green-950">
                  Status Proportions
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Present, Late, Absent & On Leave distribution
                </p>
              </div>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData.charts.statusDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {attendanceData.charts.statusDistribution.map(
                        (entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        )
                      )}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Detailed Data Table Card */}
      <section
        aria-label="Detailed report records"
        className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden flex flex-col"
      >
        {/* Table Top Header Bar */}
        <div className="p-5 bg-stone-50/80 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base sm:text-lg font-bold text-green-950">
                {reportType} Tabular Register
              </h3>
              <span className="px-2.5 py-0.5 bg-green-900 text-amber-300 font-bold text-xs rounded-full shadow-xs tabular-nums">
                {currentRecordCount} Records
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Official institutional records updated as of {generatedAt}
            </p>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/60">
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600"
                >
                  Full Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-xs font-bold text-stone-600"
                >
                  Dept / Position
                </th>

                {reportType === 'Timely Report' ? (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-center"
                    >
                      Roster Checks (P / L / A / O)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-right"
                    >
                      Punctuality Rate
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-center"
                    >
                      Performance
                    </th>
                  </>
                ) : reportType === 'Promotion Report' ? (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600"
                    >
                      Target Position & Rationale
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-center"
                    >
                      Effective Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-right"
                    >
                      Status
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600"
                    >
                      Tenure & Education
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-center"
                    >
                      Employment Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-xs font-bold text-stone-600 text-right"
                    >
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-green-800" />
                      <span className="text-sm font-medium text-stone-600">
                        Aggregating institutional report records...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Employment Report Rows */}
              {!isLoading &&
                reportType === 'Employment Report' &&
                employmentData?.records.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-stone-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-green-900 font-semibold tabular-nums">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-950">
                      {emp.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-green-950">
                        {emp.department}
                      </div>
                      <div className="text-xs font-medium text-stone-500 mt-0.5">
                        {emp.position}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-stone-700">
                        {emp.serviceDuration}
                      </div>
                      <div className="text-xs text-stone-500 font-medium mt-0.5">
                        {emp.educationLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-stone-600 font-medium tabular-nums">
                      {emp.employmentDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                          emp.status === 'ACTIVE' || emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800'
                            : emp.status === 'INACTIVE' ||
                                emp.status === 'Inactive'
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}

              {/* Promotion Report Rows */}
              {!isLoading &&
                reportType === 'Promotion Report' &&
                promotionData?.records.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-stone-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-green-900 font-semibold tabular-nums">
                      {promo.employeeNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-950">
                      {promo.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-green-950">
                        {promo.department}
                      </div>
                      <div className="text-xs font-medium text-stone-500 mt-0.5">
                        Current: {promo.previousPosition}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-xs font-bold text-green-950">
                        {promo.promotedPosition}
                      </div>
                      <div className="text-xs text-stone-500 font-medium leading-relaxed mt-0.5">
                        {promo.rationale}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs font-bold text-green-950 block tabular-nums">
                        {promo.effectiveDate}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 mt-1 inline-block">
                        {promo.promotionYear}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                          promo.promotionStatus.includes('Approved')
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {promo.promotionStatus}
                      </span>
                    </td>
                  </tr>
                ))}

              {/* Timely Report Rows */}
              {!isLoading &&
                reportType === 'Timely Report' &&
                attendanceData?.records.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-stone-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-green-900 font-semibold tabular-nums">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-950">
                      {emp.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-green-950">
                        {emp.department}
                      </div>
                      <div className="text-xs font-medium text-stone-500 mt-0.5">
                        {emp.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div
                        className="inline-flex items-center gap-1.5"
                        aria-label={`Present: ${emp.present}, Late: ${emp.late}, Absent: ${emp.absent}, On Leave: ${emp.onLeave}`}
                      >
                        <span
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold font-mono text-xs rounded-md"
                          title={`${emp.present} Present Logs`}
                        >
                          {emp.present}P
                        </span>
                        <span
                          className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold font-mono text-xs rounded-md"
                          title={`${emp.late} Late Logs`}
                        >
                          {emp.late}L
                        </span>
                        <span
                          className="px-2 py-0.5 bg-rose-50 text-rose-800 font-bold font-mono text-xs rounded-md"
                          title={`${emp.absent} Absent Logs`}
                        >
                          {emp.absent}A
                        </span>
                        <span
                          className="px-2 py-0.5 bg-purple-50 text-purple-800 font-bold font-mono text-xs rounded-md"
                          title={`${emp.onLeave} On Leave Logs`}
                        >
                          {emp.onLeave}O
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-right text-xs">
                      <div className="flex flex-col items-end">
                        <span
                          className={`tabular-nums ${
                            emp.punctualityRate >= 90
                              ? 'text-emerald-700 font-bold'
                              : emp.punctualityRate >= 75
                                ? 'text-amber-700 font-semibold'
                                : 'text-rose-700 font-semibold'
                          }`}
                        >
                          {emp.punctualityRate}%
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          of {emp.totalLogs} logs
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {emp.totalLogs === 0 ? (
                        <span className="px-2.5 py-0.5 bg-stone-100 text-stone-500 rounded-md font-semibold text-xs">
                          No Logs
                        </span>
                      ) : emp.punctualityRate >= 90 ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-xs">
                          Excellent
                        </span>
                      ) : emp.punctualityRate >= 75 ? (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 rounded-md font-bold text-xs">
                          Satisfactory
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-800 rounded-md font-bold text-xs">
                          Review Needed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {/* Empty State */}
              {!isLoading && currentRecordCount === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-stone-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={28} className="text-stone-300" />
                      <p className="text-sm font-medium text-stone-600">
                        No matching records found for the selected filter
                        criteria.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDepartment('');
                          setDatePreset('all');
                          setSearchInput('');
                          setSearchQuery('');
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:text-green-950 underline mt-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Reports;
