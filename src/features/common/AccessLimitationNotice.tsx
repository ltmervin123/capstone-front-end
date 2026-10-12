import React from 'react';
import { useLogout } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';

interface AccessLimitationNoticeProps {
  title?: string;
  message?: string;
  showSignOut?: boolean;
}

export const AccessLimitationNotice: React.FC<AccessLimitationNoticeProps> = ({
  title = 'Access Rule Limitation',
  message = 'Your account access rules limit you from viewing this sub-system. Please reach out to an Administrator to adjust your allowed access features.',
  showSignOut = false,
}) => {
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logoutMutation.mutate();
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-red-100 rounded-[30px] shadow-sm max-w-xl mx-auto my-12 animate-in fade-in duration-300">
      <div className="h-16 w-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-6 border border-red-100/50">
        <ShieldAlert size={32} />
      </div>
      <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight">{title}</h3>
      <p className="text-xs text-stone-400 font-bold uppercase mt-1 tracking-widest">NMC-HR Security Layer</p>
      <p className="text-xs text-stone-600 font-semibold leading-relaxed mt-4 max-w-sm">
        {message}
      </p>
      {showSignOut && (
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      )}
    </div>
  );
};
