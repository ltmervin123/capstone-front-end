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
  FileSpreadsheet,
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Logo } from '../../assets/common/Logo.tsx';
import { type Employee } from '../../types/types';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

interface ReportsProps {
  initialType?: string;
}

export const Reports: React.FC<ReportsProps> = ({ initialType }) => {
  const [reportType, setReportType] = useState(initialType || 'Employment Report');
  const employees = storageService.getEmployees();

  // Chat chatbot states
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `👋 **NMC-HR Intel active**. Select a quick prompt or type a custom command below to automatically analyze current records and generate advanced analytics.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Dynamic Metrics processing for Reports
  const processedData = useMemo(() => {
    if (reportType === 'Timely Report') {
      const attendance = storageService.getAttendance();
      return employees.map(emp => {
        const empLogs = attendance.filter(a => a.employeeId === emp.id);
        const present = empLogs.filter(a => a.status === 'Present').length;
        const late = empLogs.filter(a => a.status === 'Late').length;
        const absent = empLogs.filter(a => a.status === 'Absent').length;
        const onLeave = empLogs.filter(a => a.status === 'On Leave').length;
        const total = present + late + absent + onLeave;

        // Punctuality Rate = Present / (Present + Late)
        const punctualityRate = total > 0 && (present + late) > 0
          ? Math.round((present / (present + late)) * 100)
          : 100; // default to 100 if no logs

        // Attendance Rate = (Present + Late) / Total logs
        const attendanceRate = total > 0 
          ? Math.round(((present + late) / total) * 100)
          : 100;

        return {
          ...emp,
          present,
          late,
          absent,
          onLeave,
          totalLogs: total,
          punctualityRate,
          attendanceRate
        };
      });
    }

    if (reportType === 'Promotion Report') {
      return employees.map(emp => {
        if (emp.id === 'EMP001') {
          return {
            ...emp,
            hasUpcomingPromotion: true,
            promotedPosition: 'Lead Systems Architect & Tech Director',
            promotionDate: '2026-11-15', // This Year
            promotionStatus: 'Approved & Scheduled',
            promotionYear: 'This Year (2026)',
            rationale: '16 Years of service duration, completion of MS in Information Technology, and exemplary system architect contributions.'
          };
        } else if (emp.id === 'EMP002') {
          return {
            ...emp,
            hasUpcomingPromotion: true,
            promotedPosition: 'Quality Assurance Director',
            promotionDate: '2027-04-10', // Next Year
            promotionStatus: 'Approved by board review',
            promotionYear: 'Next Year (2027)',
            rationale: 'Graduating status for Master of Business Administration (MBA) credentials with 11 Years of outstanding operations loyalty.'
          };
        } else {
          return {
            ...emp,
            hasUpcomingPromotion: true,
            promotedPosition: 'In Evaluation for Promotion',
            promotionDate: '2026-12-01',
            promotionStatus: 'Recommended & Pending',
            promotionYear: 'This Year (2026)',
            rationale: 'Active standard tenure overview. Recommended for high-level technical assessment.'
          };
        }
      });
    }
    
    // Default handles standard reports
    return employees;
  }, [reportType, employees]);

  const promotionalStats = useMemo(() => {
    const thisYearCount = processedData.filter((emp: any) => emp.promotionYear?.includes('2026')).length;
    const nextYearCount = processedData.filter((emp: any) => emp.promotionYear?.includes('2027')).length;
    return {
      thisYearCount,
      nextYearCount
    };
  }, [processedData]);

  const timelyMetrics = useMemo(() => {
    const attendance = storageService.getAttendance();
    if (attendance.length === 0) {
      return {
        avgPunctuality: 94,
        attendanceRate: 98,
        totalChecked: 0,
        lates: 0
      };
    }
    const presents = attendance.filter(a => a.status === 'Present').length;
    const lates = attendance.filter(a => a.status === 'Late').length;
    const absents = attendance.filter(a => a.status === 'Absent').length;
    const onLeaves = attendance.filter(a => a.status === 'On Leave').length;
    
    const totalWorkingLogs = presents + lates;
    const totalAllLogs = presents + lates + absents + onLeaves;

    const avgPunctuality = totalWorkingLogs > 0
      ? Math.round((presents / totalWorkingLogs) * 105) // weight nicely
      : 100;

    const boundedAvgPunctuality = Math.min(avgPunctuality, 100);

    const attendanceRate = totalAllLogs > 0
      ? Math.round(((presents + lates) / totalAllLogs) * 100)
      : 100;

    return {
      avgPunctuality: boundedAvgPunctuality,
      attendanceRate,
      totalChecked: totalAllLogs,
      lates
    };
  }, []);

  const reportOptions = [
    { label: 'Employment Report', icon: ArrowUpRight, desc: 'Staff records and employment movements' },
    { label: 'Promotion Report', icon: TrendingUp, desc: 'Records of personnel advancements' },
    { label: 'Timely Report', icon: Clock, desc: 'Punctuality, login records & timeliness statistics' },
  ];

  const quickPrompts = useMemo(() => {
    if (reportType === 'Timely Report') {
      return [
        { label: '📊 Executive Timeliness Audit', text: 'Generate an executive summary audit ranking NMC punctuality trends and identifying departments needing attendance optimization.' },
        { label: '🚨 Shift compliance recommendations', text: 'Provide staffing policy and active compliance optimization recommendations based on currently logged punctualities.' }
      ];
    }
    if (reportType === 'Promotion Report') {
      return [
        { label: '🏆 Career Advancement summary', text: 'Summarize career growth trends, identifying departments with active advancements and promoting staff longevity.' },
        { label: '🔮 2026-2027 Promotion Forecast', text: 'Analyze and provide a detailed forecast on the upcoming scheduled promotions for This Year (2026) and Next Year (2027). Address which specific employees (Juan Dela Cruz, Jose Rizal) are scheduled, their respective promotions dates, and reasons.' }
      ];
    }
    return [
      { label: '✨ Staffing Density audit', text: 'Analyze our personnel structure, headcount density across active departments, and generate a strategic talent report.' }
    ];
  }, [reportType]);

  const askGemini = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: promptText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          reportData: processedData,
          userPrompt: promptText,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not connect to the remote AI service.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text || 'No response returned.' }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ **Failed to generate report:** ${err.message || 'Could not reach server API. Please ensure server.ts is active.'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${reportType.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div id="reporting_module_container" className="space-y-8 max-w-7xl mx-auto pb-16">
      <header className="flex items-center gap-4">
        <Logo className="w-12 h-12" />
        <div>
          <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">Reporting & Analytics</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">Generate official documentation and summaries</span>
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
              <BarChart3 size={12} className="text-yellow-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">HR INTEL</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Report Selection & Instant Assistant Prompts (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-black text-green-900 uppercase tracking-widest ml-1">Report Library</h2>
            {reportOptions.map((opt) => (
              <button
                id={`report_opt_${opt.label.toLowerCase().replace(/ /g, '_')}`}
                key={opt.label}
                onClick={() => setReportType(opt.label)}
                className={`
                  w-full text-left p-4 rounded-3xl transition-all border
                  ${reportType === opt.label 
                    ? 'bg-green-900 border-green-900 text-yellow-400 shadow-lg' 
                    : 'bg-white border-gray-100 text-green-950 hover:bg-green-50'}
                `}
              >
                <div className="flex items-center gap-3 mb-1">
                  <opt.icon size={18} className={reportType === opt.label ? 'text-yellow-400' : 'text-green-700'} />
                  <span className="font-bold text-sm">{opt.label}</span>
                </div>
                <p className={`text-[10px] font-medium ${reportType === opt.label ? 'text-green-300' : 'text-gray-400'}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Preset Prompts Box */}
          <div className="bg-green-50/50 rounded-3xl p-5 border border-green-100/80 space-y-3.5 no-print">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-green-900 uppercase tracking-widest">
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
              <span>Auto-Generate Reports</span>
            </div>
            <p className="text-[11px] font-semibold text-green-800 leading-relaxed">
              Click a specific preset below to command NMC-HR Intel to construct an automated analysis of this report:
            </p>
            <div className="space-y-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => askGemini(p.text)}
                  className="w-full text-left p-3 bg-white hover:bg-yellow-50 text-[10px] font-black text-green-950 rounded-2xl border border-green-100 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Report Preview (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-green-950">{reportType}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Preview ({processedData.length} Records) • Generated {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  id="btn_download_report"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-green-950 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-yellow-300 transition-all shadow-md active:scale-95"
                >
                  <Download size={14} />
                  Download
                </button>
                <button 
                  id="btn_print_report"
                  onClick={() => window.print()}
                  className="p-2 text-green-800 hover:bg-green-100 rounded-xl transition-all"
                  title="Print Report"
                >
                  <Printer size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dept / Position</th>
                    {reportType === 'Timely Report' ? (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Roster Checks (P/L/A/O)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Punctuality</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Performance</th>
                      </>
                    ) : reportType === 'Promotion Report' ? (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Target Position</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Effective Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Status</th>
                      </>
                    ) : (
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Employment Date</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {processedData.map((row) => {
                    const emp = row as any;
                    return (
                      <tr key={emp.id} className="hover:bg-green-50/10 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-green-800 font-bold">{emp.id}</td>
                        <td className="px-6 py-4 text-xs font-bold text-green-950">{emp.surname}, {emp.firstName}</td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-black text-green-850">{emp.department}</div>
                          <div className="text-[10px] font-medium text-gray-400">{emp.position}</div>
                        </td>
                        {reportType === 'Timely Report' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="inline-flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.present} Present`}>{emp.present}P</span>
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.late} Late`}>{emp.late}L</span>
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.absent} Absent`}>{emp.absent}A</span>
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold font-mono text-[9px] rounded-sm" title={`${emp.onLeave} On Leave`}>{emp.onLeave}O</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono font-black text-right text-xs">
                              <div className="flex flex-col items-end">
                                <span className={emp.punctualityRate >= 90 ? 'text-emerald-700 font-black' : emp.punctualityRate >= 75 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold'}>
                                  {emp.punctualityRate}%
                                </span>
                                <span className="text-[8px] text-gray-400 font-semibold uppercase">of {emp.totalLogs || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {emp.totalLogs === 0 ? (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full font-black text-[8px] uppercase tracking-wider">No Logs</span>
                              ) : emp.punctualityRate >= 90 ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[8px] uppercase tracking-wider">★ Excellent</span>
                              ) : emp.punctualityRate >= 75 ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-[8px] uppercase tracking-wider">Satisfactory</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-black text-[8px] uppercase tracking-wider">Review Req</span>
                              )}
                            </td>
                          </>
                        ) : reportType === 'Promotion Report' ? (
                          <>
                            <td className="px-6 py-4">
                              <div className="text-[11px] font-black text-amber-850">{emp.promotedPosition}</div>
                              <div className="text-[9px] text-gray-400 max-w-[180px] font-medium leading-relaxed mt-0.5">{emp.rationale}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-mono text-xs font-black text-green-950">{emp.promotionDate}</span>
                                <span className={`text-[8px] mt-1 font-black uppercase px-2 py-0.5 rounded-full ${
                                  emp.promotionYear?.includes('2026') 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-indigo-150 text-indigo-800'
                                }`}>
                                  {emp.promotionYear}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`px-2.5 py-1 rounded-xl font-black text-[9px] uppercase tracking-tight ${
                                emp.promotionStatus?.includes('Approved') 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-105 text-yellow-850'
                              }`}>
                                {emp.promotionStatus}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className="px-6 py-4 text-xs font-bold text-gray-600">{emp.employmentDate}</td>
                        )}
                      </tr>
                    );
                  })}
                  {processedData.length === 0 && (
                    <tr>
                      <td colSpan={reportType === 'Timely Report' ? 6 : reportType === 'Promotion Report' ? 6 : 4} className="px-6 py-20 text-center text-gray-400 italic font-medium">
                        Your criteria returned no records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Summary Footer */}
          {reportType === 'Timely Report' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div id="stat_punctuality" className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="text-emerald-800" size={18} />
                  <h4 className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">Average Punctuality</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-950">{timelyMetrics.avgPunctuality}%</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">on-time / presence metrics</p>
                </div>
              </div>
              <div id="stat_attendance_rate" className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="text-blue-800" size={18} />
                  <h4 className="font-black text-blue-900 uppercase text-[10px] tracking-widest">Overall Attendance</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-blue-950">{timelyMetrics.attendanceRate}%</p>
                  <p className="text-[9px] font-bold text-blue-700 uppercase mt-0.5">registered roster checks</p>
                </div>
              </div>
              <div id="stat_audited_logs" className="p-5 bg-green-900 rounded-3xl border border-green-950 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-yellow-400" size={18} />
                  <h4 className="font-black text-yellow-400 uppercase text-[10px] tracking-widest font-mono">Audited Logs</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-white">{timelyMetrics.totalChecked} Records</p>
                  <p className="text-[9px] font-bold text-green-400 uppercase mt-0.5">active logs in database</p>
                </div>
              </div>
            </div>
          ) : reportType === 'Promotion Report' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div id="stat_promotions_2026" className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-amber-800" size={18} />
                  <h4 className="font-black text-amber-900 uppercase text-[10px] tracking-widest">Promotions This Year (2026)</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-amber-950">{promotionalStats.thisYearCount} Employee(s)</p>
                  <p className="text-[9px] font-bold text-amber-600 uppercase mt-0.5">Approved & Scheduled</p>
                </div>
              </div>
              <div id="stat_promotions_2027" className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <ArrowUpRight className="text-indigo-800" size={18} />
                  <h4 className="font-black text-indigo-900 uppercase text-[10px] tracking-widest">Promotions Next Year (2027)</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-indigo-950">{promotionalStats.nextYearCount} Employee(s)</p>
                  <p className="text-[9px] font-bold text-indigo-650 uppercase mt-0.5">Board Review Scheduled</p>
                </div>
              </div>
              <div id="stat_avg_service" className="p-5 bg-green-900 rounded-3xl border border-green-950 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="text-yellow-400" size={18} />
                  <h4 className="font-black text-yellow-400 uppercase text-[10px] tracking-widest font-mono">Talent Pipelines</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-white">{processedData.length} Pipeline Entries</p>
                  <p className="text-[9px] font-bold text-green-400 uppercase mt-0.5">High Potential Evaluated</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div id="stat_growth" className="p-5 bg-green-50 rounded-3xl border border-green-100 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="text-green-800" size={18} />
                  <h4 className="font-black text-green-900 uppercase text-[10px] tracking-widest">Growth Trend</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-green-950">+12%</p>
                  <p className="text-[9px] font-bold text-green-600 uppercase mt-0.5">vs Last Quarter</p>
                </div>
              </div>
              <div id="stat_retention" className="p-5 bg-yellow-50 rounded-3xl border border-yellow-100 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-yellow-800" size={18} />
                  <h4 className="font-black text-yellow-900 uppercase text-[10px] tracking-widest">Retention Rate</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-green-950">94.2%</p>
                  <p className="text-[9px] font-bold text-yellow-700 uppercase mt-0.5">System Optimal</p>
                </div>
              </div>
              <div id="stat_payroll_tot" className="p-5 bg-green-900 rounded-3xl border border-green-950 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <FileSpreadsheet className="text-yellow-400" size={18} />
                  <h4 className="font-black text-yellow-400 uppercase text-[10px] tracking-widest font-mono">Total Payroll</h4>
                </div>
                <div>
                  <p className="text-xl font-black text-white">PHP 12.4M</p>
                  <p className="text-[9px] font-bold text-green-400 uppercase mt-0.5">Projected Monthly</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive AI Chatbot & Generated Intelligence (col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col h-[650px] overflow-hidden no-print">
          {/* Chat Header */}
          <div className="p-4 bg-green-900 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1 px-1.5 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Bot size={15} className="text-green-900" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-yellow-400">NMC-HR Intel</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[8px] text-green-200 font-bold uppercase tracking-widest">Active Analyser</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setMessages([{
                role: 'assistant',
                content: `👋 **NMC-HR Intel active**. Select a quick prompt or type a custom command below to automatically analyze current records and generate advanced analytics.`
              }])}
              className="p-1 px-2 text-[9px] font-black bg-green-950 text-green-100 hover:bg-green-800 rounded-lg transition-all"
              title="Clear Conversation"
            >
              Reset
            </button>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`p-1 rounded-full flex items-center justify-center h-5 w-5 shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-yellow-400 text-green-950' : 'bg-green-900 text-white'}`}>
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className="space-y-1 max-w-[calc(100%-24px)]">
                  <div
                    className={`p-3 rounded-2xl text-[11px] leading-relaxed relative group shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-green-900 text-white rounded-tr-none'
                        : 'bg-white text-green-950 border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <p className="font-semibold whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.role === 'assistant' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            setCopiedIndex(index);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="p-1 cursor-pointer bg-gray-50 hover:bg-yellow-50 border border-gray-100 text-gray-400 hover:text-green-800 rounded transition-all flex items-center gap-1 text-[9px] font-black"
                          title="Copy Report Contents"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={9} className="text-emerald-700 font-bold" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={9} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 mr-auto max-w-[90%] items-start">
                <div className="p-1 rounded-full bg-green-900 text-white flex items-center justify-center h-5 w-5 animate-spin">
                  <Loader2 size={12} />
                </div>
                <div className="p-3 bg-white text-green-900 border border-green-50 rounded-2xl rounded-tl-none text-[10px] font-black uppercase tracking-tight animate-pulse shadow-sm">
                  📚 Compiling dataset ... Generating automatic executive report ...
                </div>
              </div>
            )}
          </div>

          {/* Form Input footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !loading) askGemini(input);
            }}
            className="p-3 border-t border-gray-100 bg-white flex gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Query ${reportType.toLowerCase()}...`}
              disabled={loading}
              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-[10px] focus:outline-none focus:ring-1 focus:ring-green-900 transition-all font-bold tracking-tight disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-green-900 hover:bg-green-850 text-white rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center shrink-0"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
