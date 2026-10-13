import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, Users } from 'lucide-react';
import { Role, type Employee } from '../../types/types';
import { ApiRequestError } from '../../utils/apiClient';
import { useCurrentUser } from '../../hooks/useAuth';
import { useDeleteEmployee, useEmployeesQuery } from '../../hooks/useEmployees';
import { EmployeeForm } from './EmployeeForm';
import { AddEmployeeChoiceModal } from './employee/components/AddEmployeeChoiceModal';
import { AuditTrailTable } from './employee/components/AuditTrailTable';
import { DeleteEmployeeModal } from './employee/components/DeleteEmployeeModal';
import { EmployeeDirectoryTable } from './employee/components/EmployeeDirectoryTable';
import { EmployeeManagerHeader } from './employee/components/EmployeeManagerHeader';
import { PromoteEmployeeModal } from './employee/components/PromoteEmployeeModal';
import { ToastContainer } from './employee/components/ToastContainer';
import { storageService } from '../../services/storageService';
import { useAuditTrail } from './employee/hooks/useAuditTrail';
import { useDocumentImport } from './employee/hooks/useDocumentImport';
import { useEmployeeDirectory } from './employee/hooks/useEmployeeDirectory';
import { useToastNotifications } from './employee/hooks/useToastNotifications';
import type { EmployeePromotionRecord } from '../../types/types';
import type { EmployeeTabType, InitialDocumentFile } from './employee/types';

export const EmployeeManager: React.FC = () => {
  const currentUser = useCurrentUser();
  const canViewAuditLogs = currentUser?.role === Role.ADMIN;

  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [promotingEmployee, setPromotingEmployee] = useState<Employee | null>(
    null
  );
  const [initialDocumentFile, setInitialDocumentFile] =
    useState<InitialDocumentFile | null>(null);
  const [formTitle, setFormTitle] = useState<string | undefined>(undefined);
  const [formReadOnly, setFormReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<EmployeeTabType>('directory');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );

  const { toasts, showToast, removeToast } = useToastNotifications();

  // Directory query & delete mutation
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

  // Directory filtering hook
  const {
    searchTerm,
    setSearchTerm,
    filterDept,
    setFilterDept,
    filterStatus,
    setFilterStatus,
    filteredEmployees,
  } = useEmployeeDirectory(employees);

  // Audit trail hook
  const {
    allLogs,
    logInitiators,
    logSearchQuery,
    setLogSearchQuery,
    logFilterUser,
    setLogFilterUser,
    filteredLogs,
    handleExportLogs,
  } = useAuditTrail();

  // Document import hook
  const {
    addModeModalOpen,
    openImportModal,
    closeImportModal,
    parseLoading,
    parseError,
    isDragging,
    fileInputRefForPds,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelectAndParse,
  } = useDocumentImport({
    currentUser,
    onDraftReady: (draftedEmp, initialDoc) => {
      setSelectedEmployee(draftedEmp);
      setInitialDocumentFile(initialDoc);
      setFormTitle('New Employee Registration (AI-Imported Draft)');
      setFormReadOnly(false);
      setFormOpen(true);
    },
  });

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

  const openEmptyRegistrationForm = () => {
    setSelectedEmployee(null);
    setInitialDocumentFile(null);
    setFormTitle('New Employee Registration');
    setFormReadOnly(false);
    setFormOpen(true);
    closeImportModal();
  };

  const handleFormSuccess = (info?: {
    employeeNumber: string;
    name: string;
    isNew: boolean;
  }) => {
    setFormOpen(false);
    setSelectedEmployee(null);
    setInitialDocumentFile(null);
    setFormTitle(undefined);
    setFormReadOnly(false);

    if (info) {
      if (info.isNew) {
        showToast({
          type: 'success',
          title: 'Employee Registered',
          message: `${info.name} (${info.employeeNumber}) has been added to the directory.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Profile Updated',
          message: `Saved profile updates for ${info.name} (${info.employeeNumber}).`,
        });
      }
    }
  };

  const handlePromotionSuccess = (promo: EmployeePromotionRecord) => {
    setPromotingEmployee(null);
    const actionDesc = promo.isApproved
      ? 'Promoted employee'
      : 'Submitted promotion recommendation';
    const empName = promo.fullName || promo.employeeNumber;
    const detailDesc = `${promo.employeeNumber} — ${empName} to ${promo.newPosition}`;
    storageService.addLog(
      currentUser?.username ?? 'System',
      actionDesc,
      detailDesc
    );

    if (promo.isApproved) {
      showToast({
        type: 'success',
        title: 'Employee Promoted',
        message: `${empName} (${promo.employeeNumber}) was promoted to ${promo.newPosition}.`,
      });
    } else {
      showToast({
        type: 'success',
        title: 'Promotion Submitted',
        message: `Promotion recommendation for ${empName} was submitted for review.`,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    const empId = employeeToDelete.id;
    const empName = `${employeeToDelete.surname}, ${employeeToDelete.firstName}`;

    try {
      await deleteEmployee.mutateAsync(empId);
      setEmployeeToDelete(null);
      showToast({
        type: 'success',
        title: 'Employee Record Removed',
        message: `${empName} (${empId}) was removed from the directory.`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete employee.';
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message,
      });
    }
  };

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
      {/* Employee Form Modal Overlay */}
      <AnimatePresence>
        {formOpen && (
          <EmployeeForm
            employee={selectedEmployee}
            onCancel={() => {
              setFormOpen(false);
              setSelectedEmployee(null);
              setInitialDocumentFile(null);
              setFormTitle(undefined);
              setFormReadOnly(false);
            }}
            onSuccess={handleFormSuccess}
            title={formTitle}
            isReadOnly={formReadOnly}
            initialDocumentFile={initialDocumentFile}
            onPromote={(emp) => {
              setFormOpen(false);
              setPromotingEmployee(emp);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <EmployeeManagerHeader onAddNew={openImportModal} />

      {/* Error Alert */}
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

      {/* Tab Controls & Content */}
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

          {/* Pill Tab Switcher */}
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

        {/* Directory Tab */}
        {(activeTab === 'directory' || !canViewAuditLogs) && (
          <EmployeeDirectoryTable
            employees={filteredEmployees}
            loading={listLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterDept={filterDept}
            onFilterDeptChange={setFilterDept}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            onView={handleViewOnly}
            onEdit={handleEdit}
            onPromote={(emp) => setPromotingEmployee(emp)}
            onDelete={(emp) => setEmployeeToDelete(emp)}
            isDeleting={deleteEmployee.isPending}
            deletingEmployeeId={
              deleteEmployee.isPending ? deleteEmployee.variables : null
            }
          />
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'logs' && canViewAuditLogs && (
          <AuditTrailTable
            logs={filteredLogs}
            logSearchQuery={logSearchQuery}
            onSearchChange={setLogSearchQuery}
            logFilterUser={logFilterUser}
            onFilterUserChange={setLogFilterUser}
            logInitiators={logInitiators}
            onExportLogs={handleExportLogs}
          />
        )}
      </section>

      {/* Promote Employee Modal */}
      <PromoteEmployeeModal
        employee={promotingEmployee}
        isOpen={Boolean(promotingEmployee)}
        onClose={() => setPromotingEmployee(null)}
        onSuccess={handlePromotionSuccess}
      />

      {/* Choice Modal (AI vs. Manual) */}
      <AddEmployeeChoiceModal
        isOpen={addModeModalOpen}
        onClose={closeImportModal}
        onSelectManual={openEmptyRegistrationForm}
        parseLoading={parseLoading}
        parseError={parseError}
        isDragging={isDragging}
        fileInputRef={fileInputRefForPds}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileSelect={handleFileSelectAndParse}
      />

      {/* Delete Employee Confirmation Modal */}
      <DeleteEmployeeModal
        employeeToDelete={employeeToDelete}
        isDeleting={deleteEmployee.isPending}
        onCancel={() => setEmployeeToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
