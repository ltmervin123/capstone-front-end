import React from 'react';
import { UserPlus, Search, Settings, Filter } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Logo } from '../../assets/common/Logo.tsx';
import { ApplicantStatus } from '../../types/types';
import { motion } from 'motion/react';

export const TalentAcquisition: React.FC = () => {
  const applicants = storageService.getApplicants();
  
  const stats = {
    applied: applicants.filter(a => a.status === ApplicantStatus.APPLIED).length,
    interviewing: applicants.filter(a => a.status === ApplicantStatus.INTERVIEWING).length,
    offered: applicants.filter(a => a.status === ApplicantStatus.OFFERED).length,
    rejected: applicants.filter(a => a.status === ApplicantStatus.REJECTED).length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Search Bar (Mimicking image top bar) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-lg relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-800 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Quick search employees, tasks, docs..." 
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
           <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
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
              <p className="text-slate-500 font-medium">Pipeline management for the world's best talent.</p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#111827] rounded-full shadow-sm">
                <UserPlus size={12} className="text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">HR TALENT</span>
              </div>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-[#111827] text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <UserPlus size={20} />
          New Applicant
        </button>
      </header>

      {/* Pipeline Indicators (Mimicking image) */}
      <div className="flex flex-wrap items-center gap-12 py-6 border-b border-gray-100">
        {[
          { label: 'Applied', count: stats.applied },
          { label: 'Interviewing', count: stats.interviewing },
          { label: 'Offered', count: stats.offered },
          { label: 'Rejected', count: stats.rejected },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-3 group cursor-pointer">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">{p.label}</span>
            <div className="w-7 h-7 bg-[#E8EDF5] rounded-full flex items-center justify-center text-[11px] font-black text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all">
              {p.count}
            </div>
          </div>
        ))}
      </div>

      {/* Structured Content (Applicant Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {applicants.length > 0 ? (
          applicants.map((applicant) => (
            <motion.div 
              key={applicant.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-400">
                  {applicant.name[0]}
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  applicant.status === ApplicantStatus.APPLIED ? 'bg-blue-50 text-blue-600' :
                  applicant.status === ApplicantStatus.INTERVIEWING ? 'bg-amber-50 text-amber-600' :
                  applicant.status === ApplicantStatus.OFFERED ? 'bg-emerald-50 text-emerald-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {applicant.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{applicant.name}</h3>
              <p className="text-sm font-medium text-slate-500 mb-4">{applicant.position}</p>
              <div className="space-y-2 mb-6">
                <p className="text-xs text-slate-400 flex justify-between">Applied: <span className="text-slate-600 font-bold">{applicant.appliedDate}</span></p>
                <p className="text-xs text-slate-400 flex justify-between">Email: <span className="text-slate-600 font-bold">{applicant.email}</span></p>
              </div>
              <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
                Review Profile
              </button>
            </motion.div>
          ))
        ) : (
           <div className="col-span-full py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <UserPlus size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold">No active applicants in the pipeline.</p>
           </div>
        )}
      </div>
    </div>
  );
};
