import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
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
} from 'lucide-react';
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
import { Logo } from '../../assets/common/Logo.tsx';
import {
  useEmploymentReportQuery,
  usePromotionReportQuery,
  useAttendanceReportQuery,
  useReportFiltersQuery,
} from '../../hooks/useReports.ts';
import { exportToCsv, exportToJson } from '../../utils/exportUtils.ts';
import type {
  EmploymentReportRecord,
  PromotionReportRecord,
  AttendanceReportRecord,
} from '../../services/reportService.ts';

interface ReportsProps {
  initialType?: string;
}

type ReportType = 'Employment Report' | 'Promotion Report' | 'Timely Report';
type DatePreset = 'all' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

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
    desc: 'Records of personnel advancements & career pipeline',
  },
  {
    label: 'Timely Report',
    icon: Clock,
    desc: 'Punctuality, login records & timeliness statistics',
  },
];

const NMC_CHART_COLORS = [
  '#14532d', // Dark Emerald / Forest
  '#eab308', // Warm Amber Gold
  '#0284c7', // Sky Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Mint Emerald
  '#f97316', // Orange
  '#0d9488', // Teal
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
  const [searchQuery, setSearchQuery] = useState<string>('');

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
  const errorMessage = activeQuery.error?.message || 'Failed to load report analytics.';

  const departments = filtersQuery.data?.departments || [];

  // Data references
  const employmentData = employmentQuery.data;
  const promotionData = promotionQuery.data;
  const attendanceData = attendanceQuery.data;

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
          { header: 'Punctuality Rate %', accessor: (r) => `${r.punctualityRate}%` },
          { header: 'Attendance Rate %', accessor: (r) => `${r.attendanceRate}%` },
          { header: 'Performance Rating', accessor: 'performanceRating' },
        ],
        attendanceData.records
      );
    }
  };

  const handleExportJson = () => {
    const data =
      reportType === 'Employment Report'
        ? employmentData
        : reportType === 'Promotion Report'
          ? promotionData
          : attendanceData;
    if (data) {
      exportToJson(reportType, data);
    }
  };

  const currentRecordCount =
    reportType === 'Employment Report'
      ? employmentData?.records.length ?? 0
      : reportType === 'Promotion Report'
        ? promotionData?.records.length ?? 0
        : attendanceData?.records.length ?? 0;

  return (
    <div id="reporting_module_container" className="space-y-8 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      {/* Printable Institutional Header (Visible ONLY on print) */}
      <div className="hidden print:block border-b-2 border-green-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="w-14 h-14" />
            <div>
              <h1 className="text-xl font-black text-green-950 uppercase tracking-tight">
                Northern Mindanao Colleges, Inc.
              </h1>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Human Resource Management & Development Office
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                Official Analytical Dossier • Generated on {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-green-900 text-yellow-400 font-black text-xs uppercase rounded-md tracking-wider">
              {reportType}
            </span>
            <p className="text-[9px] text-gray-500 mt-1 uppercase">
              Filter: {selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : 'All Departments'}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
              Reporting & Analytics
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                Live institutional intelligence and compliance auditing
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
                <BarChart3 size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  NMC INTEL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn_download_csv"
            onClick={handleExportCsv}
            disabled={isLoading || currentRecordCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-900 text-yellow-400 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-green-950 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Download CSV formatted for Microsoft Excel"
          >
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
          <button
            id="btn_download_json"
            onClick={handleExportJson}
            disabled={isLoading || currentRecordCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-green-950 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-green-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Download raw structured JSON dataset"
          >
            <Download size={14} />
            JSON
          </button>
          <button
            id="btn_print_report"
            onClick={() => window.print()}
            className="flex items-center gap-2 p-2.5 bg-yellow-400 text-green-950 hover:bg-yellow-300 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            title="Print Official Report Document"
          >
            <Printer size={18} />
          </button>
        </div>
      </header>

      {/* Report Library Selector */}
      <div className="print:hidden space-y-4">
        <h2 className="text-xs font-black text-green-900 uppercase tracking-widest ml-1">
          Report Library
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REPORT_OPTIONS.map((opt) => {
            const isSelected = reportType === opt.label;
            const Icon = opt.icon;
            return (
              <button
                id={`report_opt_${opt.label.toLowerCase().replace(/ /g, '_')}`}
                key={opt.label}
                onClick={() => setReportType(opt.label)}
                className={`text-left p-4 rounded-3xl transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-green-900 border-green-900 text-yellow-400 shadow-xl'
                    : 'bg-white border-gray-100 text-green-950 hover:bg-green-50/70 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Icon
                    size={20}
                    className={isSelected ? 'text-yellow-400' : 'text-green-700'}
                  />
                  <span className="font-black text-sm">{opt.label}</span>
                </div>
                <p
                  className={`text-[11px] font-medium ${
                    isSelected ? 'text-green-200' : 'text-gray-400'
                  }`}
                >
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtering & Drill-down Toolbar */}
      <div className="print:hidden bg-white p-5 rounded-[32px] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Department Selector */}
        <div className="flex items-center gap-2.5 min-w-[220px]">
          <Filter size={16} className="text-green-800 shrink-0" />
          <div className="relative flex-1">
            <select
              id="filter_department_select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 pr-9 font-bold text-xs text-green-950 outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Preset Selector */}
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <Calendar size={16} className="text-green-800 shrink-0" />
          <div className="relative flex-1">
            <select
              id="filter_date_preset_select"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 pr-9 font-bold text-xs text-green-950 outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer"
            >
              <option value="all">All Time History</option>
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year (2026)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold text-green-950 outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <span className="text-xs text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold text-green-950 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        )}

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="filter_search_input"
            type="text"
            placeholder="Search employee name, ID, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-xs font-bold text-green-950 outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Reset Filters Button */}
        {(selectedDepartment || datePreset !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedDepartment('');
              setDatePreset('all');
              setCustomStartDate('');
              setCustomEndDate('');
              setSearchQuery('');
            }}
            className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-green-800 hover:text-green-950 hover:bg-green-50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-rose-600" />
            <p className="text-xs font-bold">{errorMessage}</p>
          </div>
          <button
            onClick={() => void activeQuery.refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white font-black text-xs rounded-xl hover:bg-rose-700 transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Dynamic KPI Summary Cards */}
      {reportType === 'Timely Report' && attendanceData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div id="stat_punctuality" className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Average Punctuality</span>
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Clock size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-950">{attendanceData.metrics.avgPunctuality}%</p>
              <p className="text-[10px] font-bold text-emerald-700 uppercase mt-1">on-time arrival rate</p>
            </div>
          </div>

          <div id="stat_attendance_rate" className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Overall Attendance</span>
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-950">{attendanceData.metrics.attendanceRate}%</p>
              <p className="text-[10px] font-bold text-blue-700 uppercase mt-1">presence compliance</p>
            </div>
          </div>

          <div id="stat_audited_logs" className="p-5 bg-green-900 rounded-3xl border border-green-950 flex flex-col justify-between shadow-xs text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 font-mono">Audited Logs</span>
              <div className="p-2 bg-green-800 text-yellow-400 rounded-xl">
                <FileText size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-white">{attendanceData.metrics.totalChecked}</p>
              <p className="text-[10px] font-bold text-green-300 uppercase mt-1">active records in query</p>
            </div>
          </div>

          <div id="stat_tardiness_count" className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Total Tardiness</span>
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Clock size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-950">{attendanceData.metrics.lates}</p>
              <p className="text-[10px] font-bold text-amber-700 uppercase mt-1">recorded late check-ins</p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'Promotion Report' && promotionData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div id="stat_promotions_2026" className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Promotions This Year</span>
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <TrendingUp size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-950">{promotionData.metrics.thisYearCount}</p>
              <p className="text-[10px] font-bold text-amber-700 uppercase mt-1">effective in 2026</p>
            </div>
          </div>

          <div id="stat_promotions_2027" className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Next Year Pipeline</span>
              <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-indigo-950">{promotionData.metrics.nextYearCount}</p>
              <p className="text-[10px] font-bold text-indigo-700 uppercase mt-1">scheduled for 2027</p>
            </div>
          </div>

          <div id="stat_approved_promotions" className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Approved Promotions</span>
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Award size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-950">{promotionData.metrics.approvedCount}</p>
              <p className="text-[10px] font-bold text-emerald-700 uppercase mt-1">board & admin sanctioned</p>
            </div>
          </div>

          <div id="stat_pipeline_total" className="p-5 bg-green-900 rounded-3xl border border-green-950 flex flex-col justify-between shadow-xs text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 font-mono">Total Candidates</span>
              <div className="p-2 bg-green-800 text-yellow-400 rounded-xl">
                <Users size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-white">{promotionData.metrics.totalEvaluated}</p>
              <p className="text-[10px] font-bold text-green-300 uppercase mt-1">career progressions tracked</p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'Employment Report' && employmentData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div id="stat_total_headcount" className="p-5 bg-green-50 rounded-3xl border border-green-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-900">Total Headcount</span>
              <div className="p-2 bg-green-100 text-green-800 rounded-xl">
                <Users size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-green-950">{employmentData.metrics.totalEmployees}</p>
              <p className="text-[10px] font-bold text-green-700 uppercase mt-1">institutional staff roster</p>
            </div>
          </div>

          <div id="stat_retention_rate" className="p-5 bg-yellow-50 rounded-3xl border border-yellow-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-900">Active Retention Rate</span>
              <div className="p-2 bg-yellow-100 text-yellow-800 rounded-xl">
                <TrendingUp size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-950">{employmentData.metrics.retentionRate}%</p>
              <p className="text-[10px] font-bold text-yellow-700 uppercase mt-1">{employmentData.metrics.activeEmployees} active personnel</p>
            </div>
          </div>

          <div id="stat_recent_hires" className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Annual Growth / Hires</span>
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-950">+{employmentData.metrics.recentHires}</p>
              <p className="text-[10px] font-bold text-blue-700 uppercase mt-1">{employmentData.metrics.growthRate}% annual expansion rate</p>
            </div>
          </div>

          <div id="stat_inactive_staff" className="p-5 bg-gray-50 rounded-3xl border border-gray-200 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Inactive & Retired</span>
              <div className="p-2 bg-gray-200 text-gray-700 rounded-xl">
                <Clock size={18} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">
                {employmentData.metrics.inactiveEmployees + employmentData.metrics.retiredEmployees}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">transitioned personnel</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Recharts Analytics Section */}
      <div className="print:hidden space-y-6">
        {reportType === 'Employment Report' && employmentData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Headcount Distribution */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">
                    Headcount by Department
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Staff concentration across academic and administrative units
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-green-50 text-green-900 font-black text-[10px] rounded-full uppercase">
                  {employmentData.charts.departmentDistribution.length} Departments
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employmentData.charts.departmentDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 600 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#14532d', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#facc15' }}
                    />
                    <Bar dataKey="count" name="Staff Count" fill="#14532d" radius={[8, 8, 0, 0]}>
                      {employmentData.charts.departmentDistribution.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={NMC_CHART_COLORS[i % NMC_CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tenure Profile */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">
                    Service Duration Profile
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Distribution of staff tenure and institutional experience
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-yellow-105 text-yellow-900 font-black text-[10px] rounded-full uppercase">
                  Tenure Bands
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employmentData.charts.tenureDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#14532d', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#facc15' }}
                    />
                    <Bar dataKey="count" name="Employees" fill="#eab308" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {reportType === 'Promotion Report' && promotionData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Promotion Pipeline by Year */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">
                    Advancement Pipeline by Year
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Scheduled and pending promotions across review cycles
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 font-black text-[10px] rounded-full uppercase">
                  Multi-Year Outlook
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={promotionData.charts.yearlyPipeline} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#14532d', fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#14532d', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pending" name="In Evaluation" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Promotions by Department */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">
                    Promotions by Department
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Advancement volume categorized by faculty and office
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-900 font-black text-[10px] rounded-full uppercase">
                  Departmental Split
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={promotionData.charts.departmentBreakdown} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#14532d', fontWeight: 700 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#14532d', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#facc15' }}
                    />
                    <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {reportType === 'Timely Report' && attendanceData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Punctuality Trend Line/Area Chart (col-span-2) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">
                    Punctuality & Presence Timeline
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Daily punctuality trajectory and arrival rate fluctuations
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 font-black text-[10px] rounded-full uppercase">
                  Daily Logged Records
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData.charts.timeseriesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="punctualityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-25} textAnchor="end" interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#14532d', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(val: any) => [`${val}%`, 'Punctuality Rate']}
                    />
                    <Area type="monotone" dataKey="punctualityRate" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#punctualityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Status Pie Breakdown (col-span-1) */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">
                  Status Proportions
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                      {attendanceData.charts.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#14532d', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Data Table Card */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
        {/* Table Top Header Bar */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-green-950">
                {reportType} Tabular Register
              </h3>
              <span className="px-2.5 py-0.5 bg-yellow-400 text-green-950 font-black text-[10px] rounded-full uppercase tracking-wider">
                {currentRecordCount} Records
              </span>
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              Live Audited Database Records • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dept / Position</th>

                {reportType === 'Timely Report' ? (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                      Roster Checks (P/L/A/O)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                      Punctuality
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                      Performance
                    </th>
                  </>
                ) : reportType === 'Promotion Report' ? (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Target Position & Rationale
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                      Effective Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                      Status
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Tenure & Education
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                      Employment Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-green-900">
                      <RefreshCw size={28} className="animate-spin text-green-800" />
                      <p className="text-xs font-black uppercase tracking-widest text-green-950">
                        Aggregating Report Analytics...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Employment Report Rows */}
              {!isLoading &&
                reportType === 'Employment Report' &&
                employmentData?.records.map((emp) => (
                  <tr key={emp.id} className="hover:bg-green-50/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-green-900 font-bold">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-950">
                      {emp.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-black text-green-900">{emp.department}</div>
                      <div className="text-[10px] font-medium text-gray-500">{emp.position}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-bold text-gray-800">{emp.serviceDuration}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{emp.educationLevel}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-gray-600 font-bold">
                      {emp.employmentDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                          emp.status === 'ACTIVE' || emp.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.status === 'INACTIVE' || emp.status === 'Inactive'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
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
                  <tr key={promo.id} className="hover:bg-green-50/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-green-900 font-bold">
                      {promo.employeeNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-950">
                      {promo.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-black text-green-900">{promo.department}</div>
                      <div className="text-[10px] font-medium text-gray-500">Current: {promo.previousPosition}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-[11px] font-black text-amber-900">{promo.promotedPosition}</div>
                      <div className="text-[9px] text-gray-500 leading-snug mt-0.5">{promo.rationale}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs font-black text-green-950 block">
                        {promo.effectiveDate}
                      </span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 mt-1 inline-block">
                        {promo.promotionYear}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-xl font-black text-[9px] uppercase tracking-tight ${
                          promo.promotionStatus.includes('Approved')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
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
                  <tr key={emp.id} className="hover:bg-green-50/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-green-900 font-bold">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-green-950">
                      {emp.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-black text-green-900">{emp.department}</div>
                      <div className="text-[10px] font-medium text-gray-500">{emp.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.present} Present Logs`}>
                          {emp.present}P
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.late} Late Logs`}>
                          {emp.late}L
                        </span>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.absent} Absent Logs`}>
                          {emp.absent}A
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.onLeave} On Leave Logs`}>
                          {emp.onLeave}O
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-right text-xs">
                      <div className="flex flex-col items-end">
                        <span
                          className={
                            emp.punctualityRate >= 90
                              ? 'text-emerald-700 font-black'
                              : emp.punctualityRate >= 75
                                ? 'text-amber-600 font-bold'
                                : 'text-rose-600 font-bold'
                          }
                        >
                          {emp.punctualityRate}%
                        </span>
                        <span className="text-[8px] text-gray-400 font-semibold uppercase">
                          of {emp.totalLogs} logs
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {emp.totalLogs === 0 ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full font-black text-[8px] uppercase tracking-wider">
                          No Logs
                        </span>
                      ) : emp.punctualityRate >= 90 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[8px] uppercase tracking-wider">
                          ★ Excellent
                        </span>
                      ) : emp.punctualityRate >= 75 ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[8px] uppercase tracking-wider">
                          Satisfactory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-black text-[8px] uppercase tracking-wider">
                          Review Req
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {/* Empty State */}
              {!isLoading && currentRecordCount === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p>Your filter and search criteria returned no matching records.</p>
                      <button
                        onClick={() => {
                          setSelectedDepartment('');
                          setDatePreset('all');
                          setSearchQuery('');
                        }}
                        className="text-xs font-black text-green-900 underline uppercase tracking-wider mt-2 cursor-pointer"
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
      </div>
    </div>
  );
};
export default Reports;
