import React from 'react';
import {
  Edit2,
  Eye,
  Filter,
  Loader2,
  Printer,
  Search,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { DEPARTMENTS, type Employee } from '../../../../types/types';

interface EmployeeDirectoryTableProps {
  employees: Employee[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterDept: string;
  onFilterDeptChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onPromote?: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  isDeleting: boolean;
  deletingEmployeeId?: string | null;
}

export const EmployeeDirectoryTable: React.FC<EmployeeDirectoryTableProps> = ({
  employees,
  loading,
  searchTerm,
  onSearchChange,
  filterDept,
  onFilterDeptChange,
  filterStatus,
  onFilterStatusChange,
  onView,
  onEdit,
  onPromote,
  onDelete,
  isDeleting,
  deletingEmployeeId,
}) => {
  const [employeeToPrint, setEmployeeToPrint] = React.useState<Employee | null>(
    null,
  );

  React.useEffect(() => {
    if (!employeeToPrint) return;

    const handleAfterPrint = () => setEmployeeToPrint(null);
    window.addEventListener('afterprint', handleAfterPrint);
    window.print();

    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [employeeToPrint]);

  const printValue = (value: string | undefined) => value?.trim() || '—';

  return (
    <>
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:min-w-[200px]">
            <Filter className="text-emerald-800 shrink-0 ml-1" size={15} />
            <label htmlFor="filterDeptSelect" className="sr-only">
              Filter by department
            </label>
            <select
              id="filterDeptSelect"
              value={filterDept}
              onChange={(e) => onFilterDeptChange(e.target.value)}
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
              onChange={(e) => onFilterStatusChange(e.target.value)}
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
              {loading && (
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

              {!loading &&
                employees.map((emp) => (
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
                          onClick={() => onView(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60 transition-colors"
                          title="View profile"
                        >
                          <Eye size={13} />
                          <span className="hidden lg:inline">View</span>
                        </button>
                        <button
                          onClick={() => onEdit(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-colors"
                          title="Edit profile"
                        >
                          <Edit2 size={13} />
                          <span className="hidden lg:inline">Edit</span>
                        </button>
                        {onPromote && (
                          <button
                            onClick={() => onPromote(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 transition-colors"
                            title="Promote employee"
                          >
                            <TrendingUp size={13} />
                            <span className="hidden xl:inline">Promote</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEmployeeToPrint(emp)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Print record"
                          aria-label={`Print record for ${emp.firstName} ${emp.surname}`}
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(emp)}
                          disabled={isDeleting}
                          className="p-1.5 text-rose-500 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete record"
                          aria-label={`Delete record for ${emp.firstName} ${emp.surname}`}
                        >
                          {isDeleting && deletingEmployeeId === emp.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && employees.length === 0 && (
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
    {employeeToPrint && (
      <article className="employee-print-root">
        <header className="employee-print-header">
          <p className="employee-print-organization">
            Northern Mindanao Colleges, Inc.
          </p>
          <p className="employee-print-address">
            A.D. Curato St., Cabadbaran City, Agusan del Norte
          </p>
          <h1>Employee Record</h1>
        </header>

        <section className="employee-print-section">
          <h2>Personal Information</h2>
          <dl className="employee-print-grid">
            <div>
              <dt>Full Name</dt>
              <dd>
                {[
                  employeeToPrint.firstName,
                  employeeToPrint.middleName,
                  employeeToPrint.surname,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </dd>
            </div>
            <div>
              <dt>Employee ID</dt>
              <dd>{printValue(employeeToPrint.id)}</dd>
            </div>
            <div>
              <dt>Date of Birth</dt>
              <dd>{printValue(employeeToPrint.dateOfBirth)}</dd>
            </div>
            <div>
              <dt>Sex</dt>
              <dd>{printValue(employeeToPrint.sex)}</dd>
            </div>
            <div>
              <dt>Marital Status</dt>
              <dd>{printValue(employeeToPrint.maritalStatus)}</dd>
            </div>
            <div>
              <dt>Religion</dt>
              <dd>{printValue(employeeToPrint.religion)}</dd>
            </div>
            <div>
              <dt>Contact Number</dt>
              <dd>{printValue(employeeToPrint.contactNumber)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{printValue(employeeToPrint.email)}</dd>
            </div>
            <div className="employee-print-full-width">
              <dt>Home Address</dt>
              <dd>{printValue(employeeToPrint.homeAddress)}</dd>
            </div>
          </dl>
        </section>

        <section className="employee-print-section">
          <h2>Employment Information</h2>
          <dl className="employee-print-grid">
            <div>
              <dt>Position</dt>
              <dd>{printValue(employeeToPrint.position)}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{printValue(employeeToPrint.department)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{printValue(employeeToPrint.status)}</dd>
            </div>
            <div>
              <dt>Employment Date</dt>
              <dd>{printValue(employeeToPrint.employmentDate)}</dd>
            </div>
            <div>
              <dt>Years of Service</dt>
              <dd>{printValue(employeeToPrint.serviceDuration)}</dd>
            </div>
            <div>
              <dt>Promotion Year</dt>
              <dd>{printValue(employeeToPrint.promotionYear)}</dd>
            </div>
          </dl>
        </section>

        <section className="employee-print-section">
          <h2>Educational Information</h2>
          <dl className="employee-print-grid">
            <div>
              <dt>Education Level</dt>
              <dd>{printValue(employeeToPrint.educationLevel)}</dd>
            </div>
            <div>
              <dt>Bachelor’s Degree</dt>
              <dd>{printValue(employeeToPrint.bachelorsDegree)}</dd>
            </div>
            <div>
              <dt>Master’s Status</dt>
              <dd>{printValue(employeeToPrint.mastersStatus)}</dd>
            </div>
            <div>
              <dt>Master’s Degree</dt>
              <dd>{printValue(employeeToPrint.mastersDegreeName)}</dd>
            </div>
            <div>
              <dt>Doctorate Status</dt>
              <dd>{printValue(employeeToPrint.doctorateStatus)}</dd>
            </div>
          </dl>
        </section>

        <footer className="employee-print-footer">
          Printed on {new Date().toLocaleDateString()}
        </footer>
      </article>
    )}
    </>
  );
};
