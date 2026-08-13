import React, { useState } from 'react';
import { UserPlus, Search, Settings, AlertCircle, Loader2, Trash2, X } from 'lucide-react';
import { useApplicantsQuery, useCreateApplicant, useDeleteApplicant, useUpdateApplicant } from '../../hooks/useApplicants';
import { applicantFormSchema } from '../../schemas/applicant.schema';
import { ApiRequestError } from '../../utils/apiClient';
import { Logo } from '../../assets/common/Logo.tsx';
import { ApplicantStatus, DEPARTMENTS, type Applicant } from '../../types/types';
import { motion } from 'motion/react';

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

function statusBadgeClass(status: ApplicantStatus) {
  switch (status) {
    case ApplicantStatus.APPLIED:
      return 'bg-blue-50 text-blue-600';
    case ApplicantStatus.INTERVIEWING:
      return 'bg-amber-50 text-amber-600';
    case ApplicantStatus.OFFERED:
      return 'bg-emerald-50 text-emerald-600';
    default:
      return 'bg-rose-50 text-rose-600';
  }
}

export const TalentAcquisition: React.FC = () => {
  const applicantsQuery = useApplicantsQuery();
  const createApplicant = useCreateApplicant();
  const updateApplicant = useUpdateApplicant();
  const deleteApplicant = useDeleteApplicant();

  const applicants = applicantsQuery.data ?? [];
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

  const stats = {
    applied: applicants.filter((applicant) => applicant.status === ApplicantStatus.APPLIED).length,
    interviewing: applicants.filter((applicant) => applicant.status === ApplicantStatus.INTERVIEWING).length,
    offered: applicants.filter((applicant) => applicant.status === ApplicantStatus.OFFERED).length,
    rejected: applicants.filter((applicant) => applicant.status === ApplicantStatus.REJECTED).length,
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const haystack = `${applicant.name} ${applicant.email} ${applicant.position} ${applicant.department ?? ''}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || applicant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      setFormError(parsed.error.issues.map((issue) => issue.message).join(', '));
      return;
    }

    try {
      if (reviewing) {
        await updateApplicant.mutateAsync({ id: reviewing.id, payload: parsed.data });
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
      `Delete applicant ${reviewing.name} (${reviewing.position})? This cannot be undone.`,
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

  const isSaving = createApplicant.isPending || updateApplicant.isPending || deleteApplicant.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-lg relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-800 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search applicants by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#F1F4F9] border-none rounded-xl outline-none focus:ring-2 focus:ring-green-800/20 text-sm font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">System Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black text-emerald-600">Healthy</span>
            </div>
          </div>
          <button type="button" className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Logo className="w-16 h-16" />
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Talent Acquisition</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 font-medium">Hiring pipeline for incoming applicants.</p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#111827] rounded-full shadow-sm">
                <UserPlus size={12} className="text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">HR TALENT</span>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-8 py-4 bg-green-900 text-yellow-400 font-bold rounded-2xl shadow-xl hover:bg-green-800 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest"
        >
          <UserPlus size={20} />
          New Applicant
        </button>
      </header>

      {listError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-800 text-xs">
          <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Could not load applicants:</span> {listError}
          </div>
          <button
            type="button"
            onClick={() => void applicantsQuery.refetch()}
            className="text-[10px] font-black uppercase tracking-wider text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-12 py-6 border-b border-gray-100">
        {[
          { label: 'All', count: applicants.length, value: 'All' },
          { label: 'Applied', count: stats.applied, value: ApplicantStatus.APPLIED },
          { label: 'Interviewing', count: stats.interviewing, value: ApplicantStatus.INTERVIEWING },
          { label: 'Offered', count: stats.offered, value: ApplicantStatus.OFFERED },
          { label: 'Rejected', count: stats.rejected, value: ApplicantStatus.REJECTED },
        ].map((pipeline) => (
          <button
            key={pipeline.value}
            type="button"
            onClick={() => setStatusFilter(pipeline.value)}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
              statusFilter === pipeline.value ? 'text-green-900' : 'text-slate-400 group-hover:text-slate-900'
            }`}>
              {pipeline.label}
            </span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
              statusFilter === pipeline.value ? 'bg-green-900 text-yellow-400' : 'bg-[#E8EDF5] text-slate-600 group-hover:bg-slate-900 group-hover:text-white'
            }`}>
              {pipeline.count}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {listLoading && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-3 text-green-900">
            <Loader2 size={32} className="animate-spin" />
            <p className="font-black uppercase text-xs tracking-[0.3em]">Loading applicants...</p>
          </div>
        )}

        {!listLoading && filteredApplicants.map((applicant) => (
          <motion.div
            key={applicant.id}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-400">
                {applicant.name[0]}
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadgeClass(applicant.status)}`}>
                {applicant.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{applicant.name}</h3>
            <p className="text-sm font-medium text-slate-500 mb-4">{applicant.position}</p>
            <div className="space-y-2 mb-6">
              <p className="text-xs text-slate-400 flex justify-between">Applied: <span className="text-slate-600 font-bold">{applicant.appliedDate}</span></p>
              <p className="text-xs text-slate-400 flex justify-between">Email: <span className="text-slate-600 font-bold">{applicant.email}</span></p>
              {applicant.department ? (
                <p className="text-xs text-slate-400 flex justify-between">Department: <span className="text-slate-600 font-bold">{applicant.department}</span></p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => openReview(applicant)}
              className="w-full py-3 bg-slate-50 hover:bg-green-900 hover:text-yellow-400 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
            >
              Review Profile
            </button>
          </motion.div>
        ))}

        {!listLoading && filteredApplicants.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <UserPlus size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">No active applicants in the pipeline.</p>
          </div>
        )}
      </div>

      {(isCreateOpen || reviewing) && (
        <div className="fixed inset-0 bg-green-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl relative border-4 border-yellow-400 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-green-900 uppercase tracking-tighter">
                  {reviewing ? 'Review Applicant' : 'New Applicant'}
                </h3>
                <p className="text-gray-500 text-sm font-medium mt-1">
                  {reviewing ? 'Update pipeline status and applicant details' : 'Add a candidate to the hiring pipeline'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-green-900 hover:bg-gray-50 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-800 text-xs">
                  <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Full Name</label>
                <input
                  required
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Phone</label>
                  <input
                    required
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Position Applied</label>
                <input
                  required
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Department</label>
                  <select
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="">None</option>
                    {DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Status</label>
                  <select
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ApplicantStatus })}
                  >
                    {Object.values(ApplicantStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Applied Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={form.appliedDate}
                    onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Resume URL</label>
                  <input
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950"
                    value={form.resumeUrl}
                    onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-2 block">Notes</label>
                <textarea
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-green-950 h-24"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Interview notes, remarks..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                {reviewing && (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isSaving}
                    className="px-5 py-4 bg-rose-50 text-red-700 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-colors uppercase text-xs tracking-widest disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteApplicant.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModals}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-green-900 text-yellow-400 font-black rounded-2xl hover:bg-green-800 transition-all active:scale-95 uppercase text-xs tracking-widest disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {createApplicant.isPending || updateApplicant.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                  {createApplicant.isPending || updateApplicant.isPending
                    ? 'Saving...'
                    : reviewing
                      ? 'Save Changes'
                      : 'Add Applicant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
