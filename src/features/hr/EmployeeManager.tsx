import React, { useState, useRef } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Printer, X, Eye, Users, History, Activity, Download, Upload, AlertCircle, ArrowRight, Loader2, Fingerprint } from 'lucide-react';
import { type Employee, DEPARTMENTS } from '../../types/types';
import { storageService } from '../../services/storageService';
import { ApiRequestError } from '../../utils/apiClient';
import { useEmployeesQuery } from '../../hooks/useEmployees';
import { EmployeeForm } from './EmployeeForm';
import { Logo } from '../../assets/common/Logo.tsx';
import { motion, AnimatePresence } from 'motion/react';

export const EmployeeManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formTitle, setFormTitle] = useState<string | undefined>(undefined);
  const [formReadOnly, setFormReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'logs'>('directory');

  // Choice modal & file parse states
  const [addModeModalOpen, setAddModeModalOpen] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRefForPds = useRef<HTMLInputElement>(null);
  
  // Directory state (API-backed via TanStack Query)
  const employeesQuery = useEmployeesQuery();
  const employees = employeesQuery.data ?? [];
  const listLoading = employeesQuery.isPending;
  const listError =
    employeesQuery.error instanceof ApiRequestError
      ? employeesQuery.error.message
      : employeesQuery.error instanceof Error
        ? employeesQuery.error.message
        : employeesQuery.error
          ? 'Failed to load employees.'
          : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Unified Logs state (still local until audit API is wired)
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterUser, setLogFilterUser] = useState('All');
  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.surname} ${emp.id}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const allLogs = storageService.getLogs();
  const logInitiators = Array.from(new Set(allLogs.map(l => l.username)));
  
  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesUser = logFilterUser === 'All' || log.username === logFilterUser;
    return matchesSearch && matchesUser;
  });

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `system_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormTitle('Edit Employee Profile');
    setFormReadOnly(false);
    setView('form');
  };

  const handleViewOnly = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormTitle('View Employee Profile (Read Only)');
    setFormReadOnly(true);
    setView('form');
  };

  const handleAddNew = () => {
    setParseError(null);
    setAddModeModalOpen(true);
  };

  const openEmptyRegistrationForm = () => {
    setSelectedEmployee(null);
    setFormTitle('Add Employee Registration');
    setFormReadOnly(false);
    setView('form');
    setAddModeModalOpen(false);
  };

  const handleFileSelectAndParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    setParseLoading(true);
    setParseError(null);

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File is too large. Please select a document smaller than 10MB.");
      }

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/parse-pds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type || 'application/pdf'
        })
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || "Failed to analyze document format.");
      }

      const parsed = await response.json();
      
      const nextId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;

      const draftedEmp: Employee = {
        id: nextId,
        surname: parsed.surname || '',
        firstName: parsed.firstName || '',
        middleName: parsed.middleName || '',
        dateOfBirth: parsed.dateOfBirth || '',
        sex: (parsed.sex === 'Male' || parsed.sex === 'Female' || parsed.sex === 'Other') ? parsed.sex : 'Male',
        maritalStatus: parsed.maritalStatus || 'Single',
        religion: parsed.religion || '',
        homeAddress: parsed.homeAddress || '',
        contactNumber: parsed.contactNumber || '',
        email: parsed.email || '',
        position: parsed.position || '',
        department: parsed.department || '',
        serviceDuration: parsed.serviceDuration || '',
        employmentDate: parsed.employmentDate || '',
        bachelorsDegree: parsed.bachelorsDegree || '',
        mastersStatus: parsed.mastersStatus || 'Ongoing',
        doctorateStatus: parsed.doctorateStatus || 'Ongoing',
        mastersDegreeName: parsed.mastersDegreeName || '',
        educationLevel: parsed.educationLevel || '',
        status: 'Active',
        checklist: {
          personalInfo: {},
          educational: {},
          employment: {},
          government: {},
          training: {},
          administrative: {},
        },
        attachments: {
          personalInfo: {},
          educational: {},
          employment: {},
          government: {},
          training: {},
          administrative: {},
        },
        functionalRate: 1500,
        gasoline: 1000,
        cashAdvance: 0,
        employeeShare: 1200,
        updatedAt: Date.now()
      };

      setSelectedEmployee(draftedEmp);
      setFormTitle('Add Employee Registration (AI-Imported Draft)');
      setFormReadOnly(false);
      setView('form');
      setAddModeModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Could not successfully parse this document. Please check the file contents.';
      setParseError(message);
    } finally {
      setParseLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setView('list');
    setSelectedEmployee(null);
    setFormTitle(undefined);
    setFormReadOnly(false);
  };

  const handleDelete = () => {
    window.alert('Delete employee API is not wired yet.');
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Logo className="w-12 h-12" />
                <div>
                  <h1 className="text-3xl font-black text-green-950 uppercase tracking-tighter">Employee Manager</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-700 font-bold uppercase text-[11px] tracking-[0.2em]">Personnel & Operations Hub</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900 rounded-full shadow-sm">
                      <Users size={12} className="text-yellow-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter">HR DEPT</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-6 py-3 bg-green-900 text-yellow-400 font-black rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={20} />
                  Add Employee
                </button>
              </div>
            </div>

            {/* Sub-header Tab Bar */}
            <div className="flex border-b border-gray-100 gap-6 mt-4">
              <button 
                onClick={() => setActiveTab('directory')}
                className={`pb-3 text-sm font-black uppercase tracking-tight transition-all relative cursor-pointer ${
                  activeTab === 'directory' ? 'text-green-950 font-black' : 'text-gray-400 hover:text-green-800'
                }`}
              >
                Employee Registry ({employees.length})
                {activeTab === 'directory' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`pb-3 text-sm font-black uppercase tracking-tight transition-all relative cursor-pointer ${
                  activeTab === 'logs' ? 'text-green-950 font-black' : 'text-gray-400 hover:text-green-800'
                }`}
              >
                System Audit Logs ({allLogs.length})
                {activeTab === 'logs' && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
                )}
              </button>
            </div>

            {activeTab === 'directory' ? (
              <>
                {listError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-800 text-xs">
                    <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold">Could not load employees:</span> {listError}
                    </div>
                    <button
                      type="button"
                      onClick={() => void employeesQuery.refetch()}
                      className="text-[10px] font-black uppercase tracking-wider text-red-700 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="bg-white p-5 rounded-[40px] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search by name, ID or position..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-950"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto md:min-w-[400px]">
                    <Filter className="text-green-800" size={20} />
                    <select 
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="flex-1 bg-gray-50 border-none rounded-[24px] py-4 px-6 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-900 cursor-pointer"
                    >
                      <option value="All">All Departments</option>
                      {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-32 bg-gray-50 border-none rounded-[24px] py-4 px-6 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-900 cursor-pointer"
                    >
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-green-900 text-yellow-400">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Employee</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Department</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Service</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Degree</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Commands</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {listLoading && (
                          <tr>
                            <td colSpan={6} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-3 text-green-900">
                                <Loader2 size={32} className="animate-spin" />
                                <p className="font-black uppercase text-xs tracking-[0.3em]">Loading employees...</p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {!listLoading && filteredEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-yellow-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                {emp.profilePicture ? (
                                  <img src={emp.profilePicture} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-inner" />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center font-black text-green-900 shadow-inner text-xs animate-in zoom-in-95 duration-200">
                                    {emp.firstName[0]}{emp.surname[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="font-black text-green-950 leading-none">{emp.surname}, {emp.firstName}</p>
                                  <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wider">{emp.id} • {emp.position}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-bold text-green-800">{emp.department}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                                emp.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                emp.status === 'Retired' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[11px] font-black text-green-900">{emp.serviceDuration || 'N/A'}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-tighter">{emp.bachelorsDegree || 'N/A'}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-150">
                                <button 
                                  onClick={() => handleViewOnly(emp)}
                                  className="p-2.5 text-blue-900 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-blue-50 transition-colors cursor-pointer" title="View Profile (Read Only)"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => handleEdit(emp)}
                                  className="p-2.5 text-green-900 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-green-50 transition-colors cursor-pointer" title="Edit Profile"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={handleDelete}
                                  className="p-2.5 text-red-600 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-red-50 transition-colors cursor-pointer" title="Delete Record"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button className="p-2.5 text-gray-600 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors cursor-pointer" title="Print File">
                                  <Printer size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!listLoading && filteredEmployees.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-3 opacity-30">
                                <Search size={48} className="text-green-900" />
                                <p className="font-black uppercase text-xs tracking-[0.3em] text-green-950">No Employee Records Found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-[40px] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search audit trail by initiator, action or details..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[24px] outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-950"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto md:min-w-[400px]">
                    <Filter className="text-green-800" size={20} />
                    <select 
                      value={logFilterUser}
                      onChange={(e) => setLogFilterUser(e.target.value)}
                      className="flex-1 bg-gray-50 border-none rounded-[24px] py-4 px-6 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-green-900 cursor-pointer"
                    >
                      <option value="All">All Initiators</option>
                      {logInitiators.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button 
                      onClick={handleExportLogs}
                      className="flex items-center gap-2 bg-green-900 text-yellow-400 px-6 py-4 rounded-[24px] font-black uppercase text-[11px] tracking-wider hover:bg-green-850 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <Download size={15} />
                      Export Audit Logs
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-green-900 text-yellow-400">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Initiator</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">Event Action / Payload</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">System Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-yellow-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <p className="font-mono text-xs font-black text-green-900">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs">
                                  {log.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-green-950">{log.username}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div>
                                <p className="font-black text-xs text-green-900 uppercase tracking-tight">{log.action}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 leading-normal max-w-lg">{log.details || 'General operation log.'}</p>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                                <Activity size={10} className="animate-pulse text-green-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-3 opacity-30">
                                <History size={48} className="text-green-900" />
                                <p className="font-black uppercase text-xs tracking-[0.3em] text-green-950">No Log Entries Found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EmployeeForm 
              employee={selectedEmployee} 
              onCancel={() => setView('list')} 
              onSuccess={handleFormSuccess}
              title={formTitle}
              isReadOnly={formReadOnly}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice Modal: PDS upload vs Manual Input */}
      <AnimatePresence>
        {addModeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!parseLoading) setAddModeModalOpen(false);
              }}
              className="absolute inset-0 bg-green-950/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-green-900 px-8 py-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400 rounded-xl text-green-950">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Select Registration Path</h3>
                    <p className="text-[10px] text-green-200 uppercase tracking-widest font-bold mt-0.5">NMC Human Resource Registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!parseLoading) setAddModeModalOpen(false);
                  }}
                  disabled={parseLoading}
                  className="p-1.5 text-green-200 hover:text-white hover:bg-green-800/50 rounded-lg transition-colors disabled:opacity-30"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                {parseError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100/50 text-red-800 text-xs animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Extraction Interrupted:</span> {parseError}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Choice A: Import PDS */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border rounded-[30px] p-6 transition-all duration-300 relative group flex flex-col justify-between ${
                      isDragging 
                        ? 'border-yellow-400 bg-yellow-50/40 scale-[1.02]' 
                        : 'border-green-100/60 hover:border-green-300 bg-green-50/20 hover:bg-green-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-800 font-bold shadow-inner">
                          <Fingerprint size={24} />
                        </div>
                        <span className="px-2.5 py-0.5 bg-yellow-400 text-green-950 text-[9px] font-black uppercase rounded-full tracking-wider shadow-sm">PDS Document</span>
                      </div>
                      <h4 className="font-black text-green-950 text-sm uppercase tracking-tight">Import PDS</h4>
                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mt-2.5">
                        Drop or attach any Page 1 of Personal Data Sheet (PDS/CS Form 212), updated Resume, or Bio-Data. The document parser will extract the fields into the employee profile form.
                      </p>
                    </div>

                    <div className="mt-6">
                      <input
                        type="file"
                        ref={fileInputRefForPds}
                        onChange={handleFileSelectAndParse}
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={parseLoading}
                      />

                      {parseLoading ? (
                        <div className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-dashed border-green-200">
                          <Loader2 size={24} className="text-green-900 animate-spin" />
                          <p className="text-[10px] font-black uppercase text-green-900 tracking-wider mt-2.5 animate-pulse text-center">
                            Reading document ... extracting fields ...
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRefForPds.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-green-900 hover:bg-green-800 text-yellow-400 font-black rounded-2xl shadow-md group-hover:shadow-lg transition-all text-xs uppercase tracking-wider cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Upload size={16} />
                          Upload PDS Document
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Choice B: Manual Input */}
                  <div className="border border-gray-150 hover:border-gray-300 rounded-[30px] p-6 bg-white hover:bg-gray-50/50 transition-all duration-300 relative group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold shadow-inner">
                          <Edit2 size={20} />
                        </div>
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-black uppercase rounded-full tracking-wider">Default</span>
                      </div>
                      <h4 className="font-black text-green-950 text-sm uppercase tracking-tight">Manual Setup</h4>
                      <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mt-2.5">
                        Input the applicant information line-by-line using our empty standard Employee Registration card. Best if you have physical records or prefer complete control.
                      </p>
                    </div>

                    <div className="mt-6 pt-5">
                      <button
                        type="button"
                        onClick={openEmptyRegistrationForm}
                        disabled={parseLoading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-white border border-gray-200 hover:border-gray-300 text-green-950 font-black rounded-2xl shadow-sm hover:shadow-md transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        Start Empty Form
                        <ArrowRight size={16} className="text-green-800 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Secure Data Extraction • Powered by gemini-3.5-flash
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
