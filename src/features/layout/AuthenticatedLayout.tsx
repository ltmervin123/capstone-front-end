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

  const isEmployeeAccount = !!currentUser?.employeeId || currentUser?.role === Role.EMPLOYEE;
  const feedbackQuery = useFeedbackQuery({
    enabled: isInitialized && currentUser?.role === Role.EMPLOYEE,
    refetchInterval: currentUser?.role === Role.EMPLOYEE ? 15000 : false,
  });
  const unreadFeedbackCount = (feedbackQuery.data ?? []).filter((item) => item.hasUnreadNotification).length;

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
          onClick={() => setIsFeedbackModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-green-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-green-900 cursor-pointer"
          title={unreadFeedbackCount > 0 ? 'You have a new HR / Admin update' : 'Send feedback or inquiries to HR'}
        >
          <span className="relative">
            <MessageSquare size={16} className="text-green-900" />
            {unreadFeedbackCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-black leading-4 text-center">
                {unreadFeedbackCount}
              </span>
            )}
          </span>
          <span className="hidden sm:inline">Send Feedback</span>
          {unreadFeedbackCount > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-green-900 text-yellow-400 text-[9px] font-black uppercase tracking-wider">
              New update
            </span>
          )}
        </button>
      )}

      {/* Global Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
