import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-gray-100 rounded-[30px] shadow-sm max-w-xl mx-auto my-12 animate-in fade-in duration-300">
      <div className="h-16 w-16 rounded-3xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-6 border border-yellow-100">
        <span className="text-3xl font-black">404</span>
      </div>
      <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">Page Not Found</h3>
      <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">NMC-HR System Route</p>
      <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-4 max-w-sm">
        The requested path does not exist in the NMC-HR portal or may have moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-green-900 hover:bg-green-800 text-yellow-300 font-bold text-xs uppercase tracking-wider rounded-2xl shadow transition-colors"
      >
        <Home size={15} />
        Return to Home
      </Link>
    </div>
  );
};
