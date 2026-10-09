import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Printer,
  X,
  Eye,
  Users,
  History,
  Activity,
  Download,
  Upload,
  AlertCircle,
  ArrowRight,
  Loader2,
  Fingerprint,
  RefreshCw,
} from 'lucide-react';
import { EmployeeForm } from './EmployeeForm';
import { type Employee, DEPARTMENTS, Role } from '../../types/types';
import { storageService } from '../../services/storageService';
import { ApiRequestError } from '../../utils/apiClient';
import { useEmployeesQuery, useDeleteEmployee } from '../../hooks/useEmployees';
import { useCurrentUser } from '../../hooks/useAuth';
import { Logo } from '../../assets/common/Logo.tsx';
import { motion, AnimatePresence } from 'motion/react';

export const EmployeeManager: React.FC = () => {
  const currentUser = useCurrentUser();
  const canViewAuditLogs = currentUser?.role === Role.ADMIN;
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
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
  const deleteEmployee = useDeleteEmployee();
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

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = `${emp.firstName} ${emp.surname} ${emp.id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const allLogs = storageService.getLogs();
  const logInitiators = Array.from(new Set(allLogs.map((l) => l.username)));

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.username.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesUser =
      logFilterUser === 'All' || log.username === logFilterUser;
    return matchesSearch && matchesUser;
  });

  const handleExportLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(allLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `system_audit_logs_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormTitle('Edit Employee Profile');
    setFormReadOnly(false);
    setFormOpen(true);
  };

  const handleViewOnly = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormTitle('View Employee Profile');
    setFormReadOnly(true);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setParseError(null);
    setAddModeModalOpen(true);
  };

  const openEmptyRegistrationForm = () => {
    setSelectedEmployee(null);
    setFormTitle('New Employee Registration');
    setFormReadOnly(false);
    setFormOpen(true);
    setAddModeModalOpen(false);
  };

  const handleFileSelectAndParse = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        throw new Error(
          'File is too large. Please select a document smaller than 10MB.'
        );
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
          mimeType: file.type || 'application/pdf',
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(
          errPayload.error || 'Failed to analyze document format.'
        );
      }

      const parsed = await response.json();

      const nextId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;

      const draftedEmp: Employee = {
        id: nextId,
        surname: parsed.surname || '',
        firstName: parsed.firstName || '',
        middleName: parsed.middleName || '',
        dateOfBirth: parsed.dateOfBirth || '',
        sex:
          parsed.sex === 'Male' ||
          parsed.sex === 'Female' ||
          parsed.sex === 'Other'
            ? parsed.sex
            : 'Male',
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
        updatedAt: Date.now(),
      };

      setSelectedEmployee(draftedEmp);
      setFormTitle('New Employee Registration (AI-Imported Draft)');
      setFormReadOnly(false);
      setFormOpen(true);
      setAddModeModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : 'Could not parse this document. Please check the file and try again.';
      setParseError(message);
    } finally {
      setParseLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedEmployee(null);
    setFormTitle(undefined);
    setFormReadOnly(false);
  };

  const handleDelete = async (emp: Employee) => {
    const confirmed = window.confirm(
      `Remove ${emp.surname}, ${emp.firstName} (${emp.id}) and all their records? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteEmployee.mutateAsync(emp.id);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete employee.';
      window.alert(message);
    }
  };

  // Tab definitions — mirrors AdminDashboard's adminTabs pattern
  const employeeTabs = [
    {
      id: 'directory' as const,
      label: 'Employee Directory',
      count: employees.length,
    },
    { id: 'logs' as const, label: 'Audit Trail', count: allLogs.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ===================================================================== */}
      {/* EMPLOYEE FORM MODAL OVERLAY                                           */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {formOpen && (
          <EmployeeForm
            employee={selectedEmployee}
            onCancel={() => {
              setFormOpen(false);
              setSelectedEmployee(null);
              setFormTitle(undefined);
              setFormReadOnly(false);
            }}
            onSuccess={handleFormSuccess}
            title={formTitle}
            isReadOnly={formReadOnly}
          />
        )}
      </AnimatePresence>
      {/* ================================================================= */}
      {/* SECTION 1: HEADER                                                  */}
      {/* ================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              Employee Manager
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Personnel &amp; Operations Hub
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <Users size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  HR Department
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
          >
            <Plus size={15} />
            <span>Add Employee</span>
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* SECTION 2: ERROR ALERT                                             */}
      {/* ================================================================= */}
      {listError && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-red-200 shadow-xs text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-red-50 text-red-700 rounded-lg shrink-0 mt-0.5">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="font-bold text-red-900">{listError}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Please check your network connection and try again.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => void employeesQuery.refetch()}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SECTION 3: TAB CONTROLS & CONTENT                                  */}
      {/* ================================================================= */}
      <section aria-label="Employee management controls" className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <Users size={22} className="text-amber-500" />
              {activeTab === 'directory'
                ? 'Personnel Directory'
                : 'System Audit Trail'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              {activeTab === 'directory'
                ? 'Browse, search, and manage all employee profiles and records.'
                : 'Review a chronological log of all system actions performed by staff.'}
            </p>
          </div>

          {/* Pill Tab Switcher — mirrors AdminDashboard's tablist */}
          {canViewAuditLogs && (
            <div
              role="tablist"
              aria-label="Switch between employee views"
              className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {employeeTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-green-900 text-amber-300 shadow-xs'
                        : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-amber-400 text-green-950'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* DIRECTORY TAB                                                    */}
        {/* =============================================================== */}
        {(activeTab === 'directory' || !canViewAuditLogs) && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by name or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:min-w-[200px]">
                  <Filter
                    className="text-emerald-800 shrink-0 ml-1"
                    size={15}
                  />
                  <label htmlFor="filterDeptSelect" className="sr-only">
                    Filter by department
                  </label>
                  <select
                    id="filterDeptSelect"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none cursor-pointer transition-all"
                  >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:min-w-[160px]">
                  <label htmlFor="filterStatusSelect" className="sr-only">
                    Filter by status
                  </label>
                  <select
                    id="filterStatusSelect"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none cursor-pointer transition-all"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200/80">
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Employee
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Department
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Years of Service
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Education
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider text-right"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {listLoading && (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-green-900">
                            <Loader2
                              size={26}
                              className="animate-spin text-green-800"
                            />
                            <p className="text-xs font-medium text-stone-600">
                              Loading employees...
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!listLoading &&
                      filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="hover:bg-stone-50/60 transition-colors group"
                        >
                          {/* Employee name & ID */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {emp.profilePicture ? (
                                <img
                                  src={emp.profilePicture}
                                  alt=""
                                  className="w-9 h-9 rounded-xl object-cover shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center font-bold text-green-900 text-xs shrink-0">
                                  {emp.firstName[0]}
                                  {emp.surname[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-green-950 truncate">
                                  {emp.surname}, {emp.firstName}
                                </p>
                                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                  {emp.id} · {emp.position}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-green-900">
                              {emp.department}
                            </span>
                          </td>

                          {/* Status badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                emp.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                  : emp.status === 'Retired'
                                    ? 'bg-orange-50 text-orange-800 border-orange-200/60'
                                    : 'bg-rose-50 text-rose-800 border-rose-200/60'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.status === 'Active'
                                    ? 'bg-emerald-500'
                                    : emp.status === 'Retired'
                                      ? 'bg-orange-500'
                                      : 'bg-rose-500'
                                }`}
                              />
                              {emp.status}
                            </span>
                          </td>

                          {/* Years of Service */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-semibold text-stone-700">
                              {emp.serviceDuration || '—'}
                            </span>
                          </td>

                          {/* Education */}
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                              {emp.bachelorsDegree || 'Not specified'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewOnly(emp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60 transition-colors"
                                title="View profile"
                              >
                                <Eye size={13} />
                                <span className="hidden lg:inline">View</span>
                              </button>
                              <button
                                onClick={() => handleEdit(emp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-colors"
                                title="Edit profile"
                              >
                                <Edit2 size={13} />
                                <span className="hidden lg:inline">Edit</span>
                              </button>
                              <button
                                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                                title="Print record"
                              >
                                <Printer size={14} />
                              </button>
                              <button
                                onClick={() => void handleDelete(emp)}
                                disabled={deleteEmployee.isPending}
                                className="p-1.5 text-rose-500 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete record"
                                aria-label={`Delete record for ${emp.firstName} ${emp.surname}`}
                              >
                                {deleteEmployee.isPending &&
                                deleteEmployee.variables === emp.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {!listLoading && filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-stone-400">
                            <Search size={32} className="text-stone-300" />
                            <p className="font-bold text-sm text-stone-700">
                              No employees found
                            </p>
                            <p className="text-xs text-stone-500">
                              Try adjusting your search or filter criteria.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* AUDIT TRAIL TAB (admin only)                                     */}
        {/* =============================================================== */}
        {activeTab === 'logs' && canViewAuditLogs && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search audit trail by staff member, action, or details..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
                />
                {logSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[220px]">
                <Filter className="text-emerald-800 shrink-0 ml-1" size={15} />
                <label htmlFor="logFilterUserSelect" className="sr-only">
                  Filter by staff member
                </label>
                <select
                  id="logFilterUserSelect"
                  value={logFilterUser}
                  onChange={(e) => setLogFilterUser(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200/80 rounded-xl py-2 px-3 text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 outline-none cursor-pointer transition-all"
                >
                  <option value="All">All Staff Members</option>
                  {logInitiators.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportLogs}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                <Download size={14} />
                Export Logs
              </button>
            </div>

            {/* Audit Trail Table */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200/80">
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Date &amp; Time
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Staff Member
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider"
                      >
                        Activity &amp; Details
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3.5 text-xs font-bold text-stone-600 uppercase tracking-wider text-right"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-stone-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-mono text-xs font-semibold text-green-950">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-green-100 text-green-900 flex items-center justify-center font-bold text-xs shrink-0">
                              {log.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-xs text-green-950">
                              {log.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-xs text-green-950">
                              {log.action}
                            </p>
                            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed max-w-xl">
                              {log.details ||
                                'Standard system activity logged.'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-800 rounded-full border border-green-200/60">
                            <Activity size={11} className="text-emerald-700" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                              Logged
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-stone-400">
                            <History size={32} className="text-stone-300" />
                            <p className="font-bold text-sm text-stone-700">
                              No audit records found
                            </p>
                            <p className="text-xs text-stone-500">
                              No events matched your search query.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* MODAL: Registration Path Selection (PDS import vs. manual entry)      */}
      {/* ===================================================================== */}
      {createPortal(
        <AnimatePresence>
          {addModeModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="addModeModalTitle"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!parseLoading) setAddModeModalOpen(false);
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200/80 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl text-green-900">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3
                      id="addModeModalTitle"
                      className="text-sm font-bold text-green-950"
                    >
                      Choose Registration Method
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      NMC Human Resource Registry
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!parseLoading) setAddModeModalOpen(false);
                  }}
                  disabled={parseLoading}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-30"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Error State */}
                {parseError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100 text-red-800 text-xs"
                  >
                    <AlertCircle
                      size={16}
                      className="shrink-0 text-red-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold">
                        Document parsing failed:{' '}
                      </span>
                      {parseError}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Import PDS */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between gap-5 ${
                      isDragging
                        ? 'border-amber-400 bg-amber-50/40 scale-[1.01]'
                        : 'border-stone-200/80 hover:border-emerald-300 bg-stone-50/30 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-800">
                          <Fingerprint size={22} />
                        </div>
                        <span className="px-2 py-0.5 bg-amber-400 text-green-950 text-[9px] font-bold uppercase rounded-full tracking-wider">
                          PDS Document
                        </span>
                      </div>
                      <h4 className="font-bold text-green-950 text-sm">
                        Import from PDS
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-2">
                        Upload a Personal Data Sheet (CS Form 212), résumé, or
                        bio-data. Fields are automatically extracted into the
                        registration form.
                      </p>
                    </div>

                    <div>
                      <input
                        type="file"
                        ref={fileInputRefForPds}
                        onChange={handleFileSelectAndParse}
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={parseLoading}
                      />

                      {parseLoading ? (
                        <div className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-dashed border-stone-200">
                          <Loader2
                            size={22}
                            className="text-green-900 animate-spin"
                          />
                          <p className="text-[10px] font-semibold text-stone-600 mt-2 text-center">
                            Reading document and extracting fields…
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRefForPds.current?.click()}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-green-900 hover:bg-green-800 text-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                        >
                          <Upload size={14} />
                          Upload PDS Document
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Option B: Manual Entry */}
                  <div className="border border-stone-200/80 hover:border-stone-300 rounded-2xl p-5 bg-white hover:bg-stone-50/50 transition-all duration-200 flex flex-col justify-between gap-5">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                          <Edit2 size={18} />
                        </div>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[9px] font-bold uppercase rounded-full tracking-wider">
                          Manual
                        </span>
                      </div>
                      <h4 className="font-bold text-green-950 text-sm">
                        Enter Manually
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-2">
                        Fill out the standard employee registration form line by
                        line. Best for physical records or when you prefer full
                        control.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openEmptyRegistrationForm}
                      disabled={parseLoading}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-stone-200 hover:border-stone-300 text-green-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      Start Empty Form
                      <ArrowRight size={14} className="text-green-800" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-100 text-center">
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                  Secure Document Extraction · Powered by Gemini
                </p>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
