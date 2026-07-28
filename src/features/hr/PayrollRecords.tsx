import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Filter, 
  Search, 
  Banknote, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Coins, 
  TrendingUp, 
  Calculator,
  Calendar,
  AlertCircle,
  Eye,
  Printer
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Logo } from '../../assets/common/Logo.tsx';
import type { PayrollRecord, Employee } from '../../types/types';
import { motion, AnimatePresence } from 'motion/react';

export const PayrollRecords: React.FC = () => {
  const currentUser = storageService.getCurrentUser();
  const isEmployeeAccount = !!currentUser?.employeeId;
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>(() => storageService.getPayroll());
  const employees = useMemo(() => storageService.getEmployees(), []);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');
  
  // Editor/Add State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);

  // Form Fields
  const [empId, setEmpId] = useState('');
  const [month, setMonth] = useState('June');
  const [year, setYear] = useState(2026);
  const [functionalRate, setFunctionalRate] = useState<number>(1500);
  const [daysWorked, setDaysWorked] = useState<number>(22);
  const [allowances, setAllowances] = useState<number>(3000);
  const [gasoline, setGasoline] = useState<number>(1000);
  const [cashAdvance, setCashAdvance] = useState<number>(0);
  const [employeeShare, setEmployeeShare] = useState<number>(1200);
  const [otherDeductions, setOtherDeductions] = useState<number>(300);

  // Auto-calculated fields inside the form state
  const basicSalaryCalculated = useMemo(() => functionalRate * daysWorked, [functionalRate, daysWorked]);
  const grossPayCalculated = useMemo(() => basicSalaryCalculated + allowances + gasoline, [basicSalaryCalculated, allowances, gasoline]);
  const totalDeductionsCalculated = useMemo(() => cashAdvance + employeeShare + otherDeductions, [cashAdvance, employeeShare, otherDeductions]);
  const netPayCalculated = useMemo(() => grossPayCalculated - totalDeductionsCalculated, [grossPayCalculated, totalDeductionsCalculated]);

  // Handle Employee selection to set reasonable defaults
  const handleEmployeeChange = (selectedId: string) => {
    setEmpId(selectedId);
    // Find if they already have an existing payroll to prefill, or assign standard baseline
    const matchedEmployee = employees.find(e => e.id === selectedId);
    if (matchedEmployee) {
      setFunctionalRate(matchedEmployee.functionalRate !== undefined ? matchedEmployee.functionalRate : (matchedEmployee.position.includes('Senior') || matchedEmployee.position.includes('Manager') ? 2200 : 1500));
      setGasoline(matchedEmployee.gasoline !== undefined ? matchedEmployee.gasoline : 1000);
      setCashAdvance(matchedEmployee.cashAdvance !== undefined ? matchedEmployee.cashAdvance : 0);
      setEmployeeShare(matchedEmployee.employeeShare !== undefined ? matchedEmployee.employeeShare : 1200);
    }
  };

  // Open modal for creation
  const handleCreateNew = () => {
    setEditingRecord(null);
    if (employees.length > 0) {
      setEmpId(employees[0].id);
      handleEmployeeChange(employees[0].id);
    } else {
      setEmpId('');
      setFunctionalRate(1500);
      setGasoline(1000);
      setCashAdvance(0);
      setEmployeeShare(1200);
    }
    setMonth('June');
    setYear(2026);
    setDaysWorked(22);
    setAllowances(3000);
    setOtherDeductions(300);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditRecord = (record: PayrollRecord) => {
    setEditingRecord(record);
    setEmpId(record.employeeId);
    setMonth(record.month);
    setYear(record.year);
    setFunctionalRate(record.functionalRate || 1500);
    setDaysWorked(record.daysWorked || 22);
    setAllowances(record.allowances || 0);
    setGasoline(record.gasoline || 0);
    setCashAdvance(record.cashAdvance || 0);
    setEmployeeShare(record.employeeShare || 0);
    setOtherDeductions(record.otherDeductions || 0);
    setIsModalOpen(true);
  };

  // Handle saving
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedEmployee = employees.find(emp => emp.id === empId);
    if (!matchedEmployee) {
      alert('Please select a valid employee.');
      return;
    }

    const savedRecord: PayrollRecord = {
      id: editingRecord ? editingRecord.id : `PAY-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      employeeId: empId,
      employeeName: `${matchedEmployee.firstName} ${matchedEmployee.surname}`,
      month,
      year: Number(year),
      functionalRate,
      daysWorked,
      basicSalary: basicSalaryCalculated,
      allowances,
      gasoline,
      cashAdvance,
      employeeShare,
      otherDeductions,
      deductions: totalDeductionsCalculated,
      cola: netPayCalculated // Stores Net Pay
    };

    storageService.savePayroll(savedRecord);
    // Refresh local list state
    const updatedList = storageService.getPayroll();
    setPayrollList(updatedList);
    setIsModalOpen(false);
  };

  // Handle deleting
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      storageService.deletePayroll(id);
      setPayrollList(storageService.getPayroll());
    }
  };

  // Filtered lists
  const filteredPayroll = useMemo(() => {
    return payrollList.filter(p => {
      // If logged in as an employee, strictly show only their own payroll records
      if (isEmployeeAccount && currentUser?.employeeId && p.employeeId !== currentUser.employeeId) {
        return false;
      }
      const matchesSearch = p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonth = filterMonth === 'All' || p.month === filterMonth;
      const matchesYear = filterYear === 'All' || p.year.toString() === filterYear;
      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [payrollList, searchQuery, filterMonth, filterYear, isEmployeeAccount, currentUser]);

  // Aggregate Metrics computed from currently visible list
  const visibleMetrics = useMemo(() => {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalCashAdvances = 0;
    let totalGasoline = 0;
    
    filteredPayroll.forEach(p => {
      const basic = p.basicSalary || 0;
      const allow = p.allowances || 0;
      const gas = p.gasoline || 0;
      const adv = p.cashAdvance || 0;
      const share = p.employeeShare || 0;
      const oth = p.otherDeductions || 0;

      totalGross += (basic + allow + gas);
      totalDeductions += (adv + share + oth);
      totalNet += p.cola; // Net Pay
      totalCashAdvances += adv;
      totalGasoline += gas;
    });

    return {
      totalGross,
      totalDeductions,
      totalNet,
      totalCashAdvances,
      totalGasoline
    };
  }, [filteredPayroll]);

  // Unique months & years in databases for quick filter dropdowns
  const availableMonths = useMemo(() => {
    const list = payrollList.map(p => p.month);
    return ['All', ...new Set(list)];
  }, [payrollList]);

  const availableYears = useMemo(() => {
    const list = payrollList.map(p => p.year.toString());
    return ['All', ...new Set(list)];
  }, [payrollList]);

  return (
    <div className="space-y-6">
      {/* Header View */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-16 h-16" />
          <div>
            <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">
              {isEmployeeAccount ? "My Payroll Payslips" : "Payroll Management"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">
                {isEmployeeAccount ? "Your personal monthly payroll logs and payslips" : "Salary, Cash Advances & Allowances Suite"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900 rounded-full shadow-sm">
                <Banknote size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  {isEmployeeAccount ? "PAYSLIP CENTER" : "HR FINANCE"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {!isEmployeeAccount && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-5 py-3 bg-yellow-400 text-green-950 hover:bg-yellow-500 transition-colors font-black rounded-xl shadow-lg border border-yellow-500/20 text-xs uppercase"
            >
              <Plus size={16} />
              Add Payroll Record
            </button>
          </div>
        )}
      </header>

      {/* Aggregate Overview Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? "My Net Salary (COLA)" : "Total COLA Distribution"}
            </span>
            <div className="p-2 bg-green-50 text-green-800 rounded-xl">
              <Coins size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-green-950">₱{visibleMetrics.totalNet.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? "Your net take-home pay summary" : "Total COLA payout value"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? "My Cash Advances" : "Total Cash Advances"}
            </span>
            <div className="p-2 bg-red-50 text-red-700 rounded-xl">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-950">₱{visibleMetrics.totalCashAdvances.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? "Your outstanding cash advance deduction" : "Outstanding advances deducted"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? "My Fuel Allowance" : "Total Gasoline Allowances"}
            </span>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
              <Plus size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-blue-950">₱{visibleMetrics.totalGasoline.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? "Your fuel & travel subsidies" : "Fuel & travel subsidies allocated"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {isEmployeeAccount ? "My Total Deductions" : "Aggregated Deductions"}
            </span>
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <Calculator size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-950">₱{visibleMetrics.totalDeductions.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {isEmployeeAccount ? "Your total shared costs, SSS, PhilHealth, Pag-IBIG" : "Contributions and shared costs"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar controls */}
      <div className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row items-center ${isEmployeeAccount ? 'justify-end' : 'justify-between'} gap-4`}>
        {!isEmployeeAccount && (
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-green-950 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-green-800 bg-gray-50/50"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Month:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-100 bg-white text-xs font-bold rounded-xl text-green-950"
            >
              {availableMonths.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Year:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-100 bg-white text-xs font-bold rounded-xl text-green-950"
            >
              {availableYears.map((y, idx) => (
                <option key={idx} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table database representation */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-50/40 border-b border-gray-100">
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">Period</th>
                {!isEmployeeAccount && <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest">Employee</th>}
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-center">Days</th>
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-right">Basic Pay</th>
                <th className="px-5 py-4 text-[10px] font-black text-rose-800 uppercase tracking-widest text-right bg-rose-50/10">Deductions</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-green-900 uppercase tracking-widest text-right bg-green-50/10">Total</th>
                <th className="px-5 py-4 text-[10px] font-black text-green-800 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredPayroll.length === 0 ? (
                <tr>
                   <td colSpan={isEmployeeAccount ? 6 : 7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No payroll data matched the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-green-50/10 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-green-900">{p.month} {p.year}</span>
                      </td>
                      {!isEmployeeAccount && (
                        <td className="px-5 py-4">
                          <p className="font-bold text-green-950 leading-tight">{p.employeeName}</p>
                          <p className="text-[10px] text-gray-400 font-mono tracking-tight">{p.employeeId}</p>
                        </td>
                      )}
                      <td className="px-5 py-4 font-mono font-bold text-gray-600 text-center">
                        {p.daysWorked || 0}d
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-gray-800 text-right">
                        ₱{(p.basicSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-rose-650 text-right bg-rose-50/5">
                        ₱{(p.deductions || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-mono font-black text-green-905 text-right bg-green-50/20 text-sm">
                        ₱{p.cola.toLocaleString()}
                      </td>
                       <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setViewingRecord(p)}
                            className="p-1.5 bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="View payslip record"
                          >
                            <Eye size={13} />
                          </button>
                          {!isEmployeeAccount && (
                            <>
                              <button 
                                onClick={() => handleEditRecord(p)}
                                className="p-1.5 bg-green-50 text-green-800 hover:bg-yellow-400 hover:text-green-950 rounded-lg transition-all cursor-pointer"
                                title="Edit payroll record"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteRecord(p.id)}
                                className="p-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="Delete payroll record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-green-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-green-50 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="bg-green-900 px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <Calculator className="text-yellow-400" size={20} />
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight">
                      {editingRecord ? 'Modify Payroll Record' : 'Configure New Payroll'}
                    </h3>
                    <p className="text-[10px] text-green-200 font-bold uppercase tracking-wider">Northern Mindanao Colleges, Inc.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body & Form */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Employee */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Target NMC Staff</label>
                    {editingRecord ? (
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-green-950">
                        {editingRecord.employeeName} ({editingRecord.employeeId})
                      </div>
                    ) : (
                      <select
                        required
                        value={empId}
                        onChange={(e) => handleEmployeeChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-xs font-bold text-green-950 focus:outline-hidden focus:ring-1 focus:ring-green-800 bg-gray-50/50"
                      >
                        <option value="" disabled>Select an active employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.id} - {emp.firstName} {emp.surname} ({emp.position})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Month */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Payroll Month</label>
                    <select
                      required
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-xs font-bold text-green-950 bg-gray-50/50"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Payroll Year</label>
                    <input 
                      type="number" 
                      required
                      min={2020}
                      max={2035}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-green-950 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-black text-green-900 uppercase tracking-wider mb-3">Earnings Calculations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Functional Rate */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Daily Functional Rate (₱)</label>
                      <input 
                        type="number"
                        required
                        min={0}
                        value={functionalRate}
                        onChange={(e) => setFunctionalRate(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>

                    {/* Days Worked */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Days Worked</label>
                      <input 
                        type="number"
                        required
                        min={0}
                        max={31}
                        value={daysWorked}
                        onChange={(e) => setDaysWorked(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>

                    {/* Basic Salary computed display */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <Coins size={14} className="text-gray-400" />
                        <span>Basic Pay (Rate × Days):</span>
                      </div>
                      <span className="font-mono text-sm font-black text-green-950">
                        ₱{basicSalaryCalculated.toLocaleString()}
                      </span>
                    </div>

                    {/* Allowances */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">COLA / Basic Allowances (₱)</label>
                      <input 
                        type="number"
                        min={0}
                        value={allowances}
                        onChange={(e) => setAllowances(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>

                    {/* Gasoline allowance */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Gasoline Support (₱)</label>
                      <input 
                        type="number"
                        min={0}
                        value={gasoline}
                        onChange={(e) => setGasoline(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold font-mono text-green-950 bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider mb-3">Deductions panel</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cash Advances */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Cash Advances (₱)</label>
                      <input 
                        type="number"
                        min={0}
                        value={cashAdvance}
                        onChange={(e) => setCashAdvance(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-rose-100 focus:border-rose-300 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>

                    {/* Employee share */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Employee Share / Contributions (₱)</label>
                      <input 
                        type="number"
                        min={0}
                        value={employeeShare}
                        onChange={(e) => setEmployeeShare(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-rose-100 focus:border-rose-300 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>

                    {/* Other Deductions */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Other Deductions (₱)</label>
                      <input 
                        type="number"
                        min={0}
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-rose-100 focus:border-rose-300 rounded-xl text-xs font-bold font-mono text-rose-950 bg-rose-50/10"
                      />
                    </div>

                    {/* Total Deductions display */}
                    <div className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100 col-span-1 md:col-span-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                        <Calculator size={14} className="text-rose-400" />
                        <span>Total Deduction (Advances + Share + Other):</span>
                      </div>
                      <span className="font-mono text-sm font-black text-rose-950">
                        ₱{totalDeductionsCalculated.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COMPUTED SUMMARY FORMULA OVERLAY PANEL */}
                <div className="bg-green-950 text-white rounded-3xl p-5 shadow-inner border border-green-900 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-400">
                    <Calculator size={14} />
                    <span>Real-Time Audit Formula Output</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs font-bold pb-2 border-b border-white/5">
                    <div>
                      <p className="text-emerald-300/80 text-[10px] uppercase">Gross Earnings</p>
                      <p className="font-mono text-sm mt-0.5">₱{grossPayCalculated.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-red-300/80 text-[10px] uppercase">Total Deductions</p>
                      <p className="font-mono text-sm mt-0.5">₱{totalDeductionsCalculated.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-300/80 text-[10px] uppercase">Computed COLA</p>
                      <p className="font-mono text-[15px] font-black text-yellow-400 mt-0.5">₱{netPayCalculated.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[10px] text-green-200/70 font-medium">
                    <AlertCircle size={14} className="shrink-0 text-yellow-400" />
                    <span>Formula: COLA = (Basic Pay [Rate × Days] + Allowances + Gasoline) − (Cash Advances + Employee Share + Other Deductions)</span>
                  </div>
                </div>

                {/* Modal actions dropdown footer */}
                <div className="flex items-center justify-end gap-3 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 rounded-xl text-xs font-bold text-gray-600 uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-900 hover:bg-green-850 text-yellow-400 font-extrabold rounded-xl transition-all shadow-md text-xs uppercase"
                  >
                    <Check size={16} />
                    {editingRecord ? 'Override Record' : 'Record Payroll Payout'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYSLIP DETAIL VIEWER MODAL */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 bg-green-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg border border-green-50 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-green-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Banknote className="text-yellow-400" size={18} />
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">NMC Member Payslip</h3>
                    <p className="text-[9px] text-green-200 font-bold uppercase tracking-wider">Historical Print Receipt</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Attempt to print cleanly
                      window.print();
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
                    title="Print Payslip Screen"
                  >
                    <Printer size={16} />
                  </button>
                  <button 
                    onClick={() => setViewingRecord(null)}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-green-300 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6" id="payslip-print-section">
                {/* School Header Identity */}
                <div className="text-center pb-4 border-b border-gray-100 flex flex-col items-center">
                  <Logo className="w-14 h-14 mb-2" />
                  <h2 className="text-lg font-black text-green-950 uppercase tracking-tight">Northern Mindanao Colleges, Inc.</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">A.D. Curato St., Cabadbaran City, Agusan del Norte</p>
                  <div className="mt-3 px-3 py-1 bg-green-50 text-green-905 font-black text-[10px] uppercase rounded-full tracking-widest border border-green-150/40">
                    Official Employee Payslip
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/70 p-4 rounded-2xl border border-gray-100/50">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Employee Name</p>
                    <p className="font-extrabold text-green-950">{viewingRecord.employeeName}</p>
                    <p className="text-[10px] font-mono font-medium text-gray-400">{viewingRecord.employeeId}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pay Period</p>
                    <p className="font-extrabold text-green-950">{viewingRecord.month} {viewingRecord.year}</p>
                    <p className="text-[10px] font-mono font-medium text-gray-400">Statement Ref: {viewingRecord.id}</p>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="space-y-4">
                  {/* Earnings Section */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-green-800 tracking-wider mb-2 border-b border-green-50 pb-1">1. Gross Earnings Breakdown</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">Daily Functional Rate ({viewingRecord.daysWorked || 0} days)</span>
                        <span className="font-mono font-bold text-gray-800">₱{(viewingRecord.functionalRate || 0).toLocaleString()} / day</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">Basic Pay Salary (Rate × Days)</span>
                        <span className="font-mono font-bold text-gray-800">₱{(viewingRecord.basicSalary || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">COLA / Basic Allowances</span>
                        <span className="font-mono font-bold text-gray-800">₱{(viewingRecord.allowances || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">Gasoline Support Allocation</span>
                        <span className="font-mono font-bold text-gray-800">₱{(viewingRecord.gasoline || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold text-green-950 bg-green-50/30 px-2.5 rounded-xl border border-green-100/30">
                        <span>Total Gross Compensation</span>
                        <span className="font-mono">₱{((viewingRecord.basicSalary || 0) + (viewingRecord.allowances || 0) + (viewingRecord.gasoline || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Section */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-rose-850 tracking-wider mb-2 border-b border-rose-50 pb-1">2. Reductions & Contributions</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">Outstanding Cash Advance Reimbursements</span>
                        <span className="font-mono font-bold text-rose-650">₱{(viewingRecord.cashAdvance || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">Mandatory Employee Share Contribution</span>
                        <span className="font-mono font-bold text-rose-650">₱{(viewingRecord.employeeShare || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 font-medium">Other Specific Deductions</span>
                        <span className="font-mono font-bold text-rose-650">₱{(viewingRecord.otherDeductions || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold text-rose-950 bg-rose-50/30 px-2.5 rounded-xl border border-rose-100/30">
                        <span>Total Monthly Deductions</span>
                        <span className="font-mono text-rose-800">₱{(viewingRecord.deductions || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Box */}
                <div className="bg-green-950 text-white rounded-2xl p-4.5 border border-green-900 text-center space-y-1">
                  <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">NET PAYOUT COMPENSATIVE VALUE</p>
                  <p className="text-2xl font-black font-mono text-yellow-400">₱{(viewingRecord.cola || 0).toLocaleString()}</p>
                  <p className="text-[9px] text-green-200/70 font-medium uppercase tracking-[0.1em] mt-1.5">NORTHERN MINDANAO COLLEGES FINANCES SYSTEM</p>
                </div>

                {/* Signing Footer (For printing clarity) */}
                <div className="pt-6 border-t border-gray-150/40 grid grid-cols-2 gap-8 text-[10px] text-gray-400 font-bold uppercase mt-4">
                  <div className="border-t border-gray-200 pt-2 text-center">
                    <p className="text-green-950 font-black leading-tight">CHIEF FINANCE OFFICER</p>
                    <p className="text-[8px] tracking-wider text-gray-400 mt-0.5">Authorizing Dispatcher</p>
                  </div>
                  <div className="border-t border-gray-200 pt-2 text-center">
                    <p className="text-green-950 font-black leading-tight">EMPLOYEE SIGNATURE</p>
                    <p className="text-[8px] tracking-wider text-gray-400 mt-0.5">Acknowledgment Of Release</p>
                  </div>
                </div>
              </div>

              {/* Close Button Only */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="px-5 py-2 bg-green-900 hover:bg-green-850 text-yellow-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
