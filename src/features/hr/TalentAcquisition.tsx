import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus,
  Search,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Briefcase,
  Users,
  UserCheck,
  Award,
  Calendar,
  Mail,
  Building2,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  useApplicantsQuery,
  useCreateApplicant,
  useDeleteApplicant,
  useUpdateApplicant,
} from '../../hooks/useApplicants';
import { applicantFormSchema } from '../../schemas/applicant.schema';
import { ApiRequestError } from '../../utils/apiClient';
import { Logo } from '../../assets/common/Logo';
import {
  ApplicantStatus,
  DEPARTMENTS,
  type Applicant,
} from '../../types/types';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  status: ApplicantStatus.APPLIED,
  appliedDate: new Date().toISOString().slice(0, 10),
  resumeUrl: '',
  notes: '',
};

const inputCls =
  'w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100';
const labelCls = 'block text-xs font-bold text-stone-700 mb-1.5';

function statusBadgeClass(status: ApplicantStatus) {
  switch (status) {
    case ApplicantStatus.APPLIED:
      return 'bg-blue-100 text-blue-800';
    case ApplicantStatus.INTERVIEWING:
      return 'bg-amber-100 text-amber-900';
    case ApplicantStatus.OFFERED:
      return 'bg-emerald-100 text-emerald-800';
    case ApplicantStatus.HIRED:
      return 'bg-green-100 text-green-900 font-bold';
    case ApplicantStatus.REJECTED:
    default:
      return 'bg-rose-100 text-rose-800';
  }
}

function statusDisplayLabel(status: ApplicantStatus) {
  if (status === ApplicantStatus.HIRED) return 'Hired';
  return status;
}

export const TalentAcquisition: React.FC = () => {
  const applicantsQuery = useApplicantsQuery();
  const createApplicant = useCreateApplicant();
  const updateApplicant = useUpdateApplicant();
  const deleteApplicant = useDeleteApplicant();

  const rawApplicants = applicantsQuery.data;
  const applicants = useMemo(() => rawApplicants ?? [], [rawApplicants]);
  const listLoading = applicantsQuery.isPending;
  const listError =
    applicantsQuery.error instanceof ApiRequestError
      ? applicantsQuery.error.message
      : applicantsQuery.error instanceof Error
        ? applicantsQuery.error.message
        : applicantsQuery.error
          ? 'Failed to load applicants.'
          : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Applicant | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Memoized pipeline counts
  const stats = useMemo(
    () => ({
      applied: applicants.filter(
        (a) => a.status === ApplicantStatus.APPLIED
      ).length,
      interviewing: applicants.filter(
        (a) => a.status === ApplicantStatus.INTERVIEWING
      ).length,
      offered: applicants.filter(
        (a) => a.status === ApplicantStatus.OFFERED
      ).length,
      hired: applicants.filter(
        (a) => a.status === ApplicantStatus.HIRED
      ).length,
      rejected: applicants.filter(
        (a) => a.status === ApplicantStatus.REJECTED
      ).length,
    }),
    [applicants]
  );

  // Filtered applicants based on search query and status filter
  const filteredApplicants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return applicants.filter((applicant) => {
      const matchesSearch =
        !term ||
        applicant.name.toLowerCase().includes(term) ||
        applicant.email.toLowerCase().includes(term) ||
        applicant.position.toLowerCase().includes(term) ||
        (applicant.department &&
          applicant.department.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === 'All' || applicant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchTerm, statusFilter]);

  // KPI stat cards mirroring Dashboard.tsx overview architecture (data display only)
  const statCards = useMemo(
    () => [
      {
        label: 'Total Applicants',
        subtitle: 'All talent candidates',
        value: applicants.length,
        icon: Users,
        iconBg: 'bg-emerald-50 text-emerald-800',
      },
      {
        label: 'Initial Screening',
        subtitle: 'Applications received',
        value: stats.applied,
        icon: FileText,
        iconBg: 'bg-blue-50 text-blue-800',
      },
      {
        label: 'Interviewing',
        subtitle: 'Active evaluations',
        value: stats.interviewing,
        icon: UserCheck,
        iconBg: 'bg-amber-50 text-amber-900',
      },
      {
        label: 'Offers Extended',
        subtitle: 'Pending acceptance',
        value: stats.offered,
        icon: Award,
        iconBg: 'bg-purple-50 text-purple-800',
      },
      {
        label: 'Successfully Hired',
        subtitle: 'Onboarded personnel',
        value: stats.hired,
        icon: Briefcase,
        iconBg: 'bg-green-50 text-green-800',
      },
    ],
    [applicants.length, stats]
  );

  const pipelineTabs = useMemo(
    () => [
      { label: 'All Applicants', count: applicants.length, value: 'All' },
      { label: 'Applied', count: stats.applied, value: ApplicantStatus.APPLIED },
      {
        label: 'Interviewing',
        count: stats.interviewing,
        value: ApplicantStatus.INTERVIEWING,
      },
      { label: 'Offered', count: stats.offered, value: ApplicantStatus.OFFERED },
      { label: 'Hired', count: stats.hired, value: ApplicantStatus.HIRED },
      {
        label: 'Rejected',
        count: stats.rejected,
        value: ApplicantStatus.REJECTED,
      },
    ],
    [applicants.length, stats]
  );

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      appliedDate: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openReview = (applicant: Applicant) => {
    setForm({
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      position: applicant.position,
      department: applicant.department ?? '',
      status: applicant.status,
      appliedDate: applicant.appliedDate,
      resumeUrl: applicant.resumeUrl ?? '',
      notes: applicant.notes ?? '',
    });
    setFormError(null);
    setReviewing(applicant);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setReviewing(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = applicantFormSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(
        parsed.error.issues.map((issue) => issue.message).join(', ')
      );
      return;
    }

    try {
      if (reviewing) {
        await updateApplicant.mutateAsync({
          id: reviewing.id,
          payload: parsed.data,
        });
      } else {
        await createApplicant.mutateAsync(parsed.data);
      }
      closeModals();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : reviewing
              ? 'Failed to update applicant.'
              : 'Failed to create applicant.';
      setFormError(message);
    }
  };

  const handleDelete = async () => {
    if (!reviewing) return;

    const confirmed = window.confirm(
      `Delete applicant ${reviewing.name} (${reviewing.position})? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteApplicant.mutateAsync(reviewing.id);
      closeModals();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete applicant.';
      setFormError(message);
    }
  };

  const isSaving =
    createApplicant.isPending ||
    updateApplicant.isPending ||
    deleteApplicant.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* =====================================================================
          PAGE HEADER (Mirrors Dashboard.tsx layout & typography)
          ===================================================================== */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <Logo className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950 tracking-tight">
              Talent Acquisition
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold text-emerald-800">
                Human Resources Information System
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 hidden sm:inline-block" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-900 text-white rounded-full shadow-xs">
                <Users size={12} className="text-amber-300" />
                <span className="text-[11px] font-bold tracking-wide">
                  Recruitment Office
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
          >
            <UserPlus size={15} />
            <span>New Applicant</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          ERROR ALERT NOTIFICATION
          ===================================================================== */}
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
                Unable to load recruitment records at this time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => void applicantsQuery.refetch()}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry Loading</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          KPI OVERVIEW CARDS (Display data only)
          ===================================================================== */}
      <section
        aria-label="Recruitment pipeline metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center"
          >
            <div className={`p-3 rounded-xl ${stat.iconBg} mb-3`}>
              <stat.icon size={22} />
            </div>
            <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
              {stat.value}
            </h2>
            <p className="text-sm font-bold text-stone-800 mt-2">
              {stat.label}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
          </div>
        ))}
      </section>

      {/* =====================================================================
          OPERATIONS & PIPELINE CONTROLS
          ===================================================================== */}
      <section
        aria-label="Applicant pipeline management"
        className="space-y-6"
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200/80 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-950 tracking-tight flex items-center gap-2">
              <Briefcase size={22} className="text-amber-500" />
              Applicant Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Track candidate progression across screening, interview rounds,
              job offers, and final hiring decisions.
            </p>
          </div>

          {/* Segmented Pill Tabs Switcher (Mirrors Dashboard.tsx tablist) */}
          <div
            role="tablist"
            aria-label="Filter applicants by hiring stage"
            className="flex items-center gap-1 bg-stone-100 border border-stone-200/80 rounded-2xl p-1 overflow-x-auto max-w-full shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pipelineTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-green-900 text-amber-300 shadow-xs'
                      : 'text-stone-600 hover:text-green-950 hover:bg-stone-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-amber-400 text-green-950'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Counter Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={16}
            />
            <input
              id="search-applicants"
              type="text"
              aria-label="Search applicants"
              placeholder="Search by name, email, position, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-green-950 focus:bg-white focus:border-green-800 outline-none transition-all placeholder:text-stone-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-sm"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 self-end sm:self-auto">
            <span>Showing</span>
            <span className="font-bold text-green-950 tabular-nums">
              {filteredApplicants.length}
            </span>
            <span>of {applicants.length} candidates</span>
          </div>
        </div>

        {/* Applicant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {listLoading && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-green-800" />
              <span className="text-sm font-medium text-stone-600">
                Loading applicant pipeline...
              </span>
            </div>
          )}

          {!listLoading &&
            filteredApplicants.map((applicant) => (
              <div
                key={applicant.id}
                className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold text-lg flex items-center justify-center shrink-0">
                      {applicant.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadgeClass(
                        applicant.status
                      )}`}
                    >
                      {statusDisplayLabel(applicant.status)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-green-950 truncate">
                    {applicant.name}
                  </h3>
                  <p className="text-xs font-medium text-stone-500 mt-0.5 truncate">
                    {applicant.position}
                  </p>

                  <div className="space-y-2 my-4 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                        <Calendar size={13} className="text-stone-400" />
                        Applied
                      </span>
                      <span className="font-semibold text-stone-800 tabular-nums">
                        {applicant.appliedDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                        <Mail size={13} className="text-stone-400" />
                        Email
                      </span>
                      <span
                        className="font-semibold text-stone-800 truncate max-w-[180px]"
                        title={applicant.email}
                      >
                        {applicant.email}
                      </span>
                    </div>
                    {applicant.department && (
                      <div className="flex items-center justify-between text-stone-600">
                        <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                          <Building2 size={13} className="text-stone-400" />
                          Department
                        </span>
                        <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                          {applicant.department}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => openReview(applicant)}
                    className="w-full py-2.5 bg-stone-50 hover:bg-green-900 hover:text-white text-green-950 text-xs font-bold rounded-xl transition-all border border-stone-200/80 hover:border-green-900 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                  >
                    <span>Review Profile</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}

          {!listLoading && filteredApplicants.length === 0 && (
            <div className="col-span-full py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200/80 p-8 shadow-xs">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-3 text-stone-400">
                <Users size={28} />
              </div>
              <h3 className="text-sm font-bold text-green-950">
                No applicants found
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                {searchTerm
                  ? 'No candidates matched your search criteria. Try adjusting keywords.'
                  : 'There are currently no applicant profiles matching this pipeline filter.'}
              </p>
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-green-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Search Filter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus size={14} />
                  <span>Add First Applicant</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          ACCESSIBLE MODAL DIALOG (Mirrors EmployeeForm & FeedbackModal standards)
          ===================================================================== */}
      {typeof document !== 'undefined' &&
        (isCreateOpen || reviewing) &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicantModalTitle"
            onClick={closeModals}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-white rounded-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3
                      id="applicantModalTitle"
                      className="font-bold text-green-950 text-base"
                    >
                      {reviewing
                        ? 'Review Applicant Profile'
                        : 'New Applicant Registration'}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {reviewing
                        ? 'Update candidate information and recruitment stage'
                        : 'Enter candidate details into the hiring pipeline'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModals}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {formError && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs"
                    >
                      <AlertCircle
                        size={16}
                        className="shrink-0 text-red-600 mt-0.5"
                      />
                      <span className="font-semibold">{formError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="applicant-name" className={labelCls}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="applicant-name"
                      required
                      className={inputCls}
                      placeholder="e.g. Maria Santos"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="applicant-email" className={labelCls}>
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="applicant-email"
                        type="email"
                        required
                        className={inputCls}
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="applicant-phone" className={labelCls}>
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="applicant-phone"
                        required
                        className={inputCls}
                        placeholder="09xx xxx xxxx"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="applicant-position" className={labelCls}>
                      Position Applied <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="applicant-position"
                      required
                      className={inputCls}
                      placeholder="e.g. Assistant Professor I"
                      value={form.position}
                      onChange={(e) =>
                        setForm({ ...form, position: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="applicant-department"
                        className={labelCls}
                      >
                        Department
                      </label>
                      <select
                        id="applicant-department"
                        className={inputCls}
                        value={form.department}
                        onChange={(e) =>
                          setForm({ ...form, department: e.target.value })
                        }
                      >
                        <option value="">None / Unassigned</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="applicant-status" className={labelCls}>
                        Pipeline Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="applicant-status"
                        className={inputCls}
                        value={form.status}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            status: e.target.value as ApplicantStatus,
                          })
                        }
                      >
                        {Object.values(ApplicantStatus).map((st) => (
                          <option key={st} value={st}>
                            {statusDisplayLabel(st)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="applicant-appliedDate"
                        className={labelCls}
                      >
                        Application Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="applicant-appliedDate"
                        type="date"
                        required
                        className={inputCls}
                        value={form.appliedDate}
                        onChange={(e) =>
                          setForm({ ...form, appliedDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="applicant-resumeUrl" className={labelCls}>
                        Resume URL{' '}
                        <span className="text-stone-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="applicant-resumeUrl"
                        className={inputCls}
                        value={form.resumeUrl}
                        onChange={(e) =>
                          setForm({ ...form, resumeUrl: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="applicant-notes" className={labelCls}>
                      Interview Notes &amp; Remarks{' '}
                      <span className="text-stone-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="applicant-notes"
                      className={`${inputCls} h-24 resize-none`}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="Candidate qualifications, interview impressions, next steps..."
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3 shrink-0">
                  {reviewing ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deleteApplicant.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      <span>Delete</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeModals}
                      disabled={isSaving}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-900 hover:bg-green-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
                    >
                      {createApplicant.isPending ||
                      updateApplicant.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      <span>
                        {createApplicant.isPending || updateApplicant.isPending
                          ? 'Saving...'
                          : reviewing
                            ? 'Save Changes'
                            : 'Create Candidate'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
