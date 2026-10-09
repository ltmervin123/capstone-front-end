import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { FeedbackModal } from '../../assets/common/FeedbackModal';
import { useAuthStore } from '../../stores/authStore';
import { useFeedbackQuery } from '../../hooks/useFeedback';
import { Role } from '../../types/types';

export const AuthenticatedLayout: React.FC = () => {
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const isEmployeeAccount =
    !!currentUser?.employeeId || currentUser?.role === Role.EMPLOYEE;
  const feedbackQuery = useFeedbackQuery({
    enabled: isInitialized && currentUser?.role === Role.EMPLOYEE,
    refetchInterval: currentUser?.role === Role.EMPLOYEE ? 15000 : false,
  });
  const unreadFeedbackCount = (feedbackQuery.data ?? []).filter(
    (item) => item.hasUnreadNotification
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfcf0] text-green-950 font-sans selection:bg-yellow-200 selection:text-green-900">
      <Sidebar />

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto pt-20 px-4 pb-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Feedback Trigger Button ONLY for Employee Accounts */}
      {isEmployeeAccount && (
        <button
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
          aria-label="Send feedback or inquiries to HR"
          aria-haspopup="dialog"
          aria-expanded={isFeedbackModalOpen}
          className="group fixed bottom-6 right-6 z-40 flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 bg-green-900 hover:bg-green-800 text-white rounded-2xl shadow-xl shadow-green-950/25 hover:shadow-2xl hover:shadow-green-950/35 border border-green-800/90 hover:border-emerald-700/80 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
          title={
            unreadFeedbackCount > 0
              ? `${unreadFeedbackCount} unread HR update${unreadFeedbackCount > 1 ? 's' : ''}`
              : 'Send feedback or inquiries to HR'
          }
        >
          <span className="relative flex items-center justify-center p-1.5 rounded-xl bg-green-800/90 group-hover:bg-green-700 text-amber-300 transition-colors">
            <MessageSquare size={17} />
            {unreadFeedbackCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-green-900" />
              </span>
            )}
          </span>
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-white">
            Send Feedback
          </span>
          {unreadFeedbackCount > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-amber-400 text-green-950 text-[10px] font-black uppercase tracking-wider shadow-2xs">
              {unreadFeedbackCount} {unreadFeedbackCount === 1 ? 'update' : 'updates'}
            </span>
          )}
        </button>
      )}

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
