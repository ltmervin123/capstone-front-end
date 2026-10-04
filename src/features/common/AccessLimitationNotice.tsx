import React from 'react';

export const AccessLimitationNotice: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-red-100 rounded-[30px] shadow-sm max-w-xl mx-auto my-12 animate-in fade-in duration-300">
      <div className="h-16 w-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-6 border border-red-100/50">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">Access Rule Limitation</h3>
      <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest animate-pulse">NMC-HR Security Layer</p>
      <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-4 max-w-sm">
        Your account access rules limit you from viewing this sub-system. Please reach out to an Administrator to adjust your allowed access features.
      </p>
    </div>
  );
};
