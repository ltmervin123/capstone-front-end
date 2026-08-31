/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { LoginPage } from './features/auth/LoginPage';
import { Sidebar } from './features/layout/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard.tsx';
import { EmployeeManager } from './features/hr/EmployeeManager.tsx';
import { AISearch } from './features/hr/AISerach.tsx';
import { Reports } from './features/hr/Reports';
import { PayrollRecords } from './features/hr/PayrollRecords';
import { LeaveRecords } from './features/hr/LeaveRecords';
import { AttendanceRecords } from './features/hr/AttendanceRecords';
import { TalentAcquisition } from './features/hr/TalentAcquisition';
import { FeedbackInbox } from './features/hr/FeedbackInbox.tsx';
import { FeedbackModal } from './assets/common/FeedbackModal.tsx';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { type User, Role } from './types/types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import { useInitializeAuth, useLogout } from './hooks/useAuth';
import { useFeedbackQuery } from './hooks/useFeedback';
import { useAuthStore } from './stores/authStore';
import { clearLegacyMockDataOnce } from './services/storageService.ts';

function getDefaultView(user: User): string {
  if (user.role === Role.EMPLOYEE) {
    const permissions = user.permissions;
    if (!permissions || permissions.attendance !== false) return 'attendance';
    if (permissions.leaves !== false) return 'leaves';
    if (permissions.payroll !== false) return 'payroll';
    return 'attendance';
  }

  if (user.role !== Role.ADMIN && user.permissions?.dashboard === false) {
    const permissions = user.permissions;
    if (permissions.employees !== false) return 'employees';
    if (permissions.attendance !== false) return 'attendance';
    if (permissions.leaves !== false) return 'leaves';
    return 'employees';
  }

  return 'dashboard';
}

export default function App() {
  useInitializeAuth();

  const currentUser = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const logoutMutation = useLogout();
  const isEmployeeAccount = !!currentUser?.employeeId || currentUser?.role === Role.EMPLOYEE;
  const feedbackQuery = useFeedbackQuery({
    enabled: isInitialized && currentUser?.role === Role.EMPLOYEE,
    refetchInterval: currentUser?.role === Role.EMPLOYEE ? 15000 : false,
  });
  const unreadFeedbackCount = (feedbackQuery.data ?? []).filter((item) => item.hasUnreadNotification).length;
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    clearLegacyMockDataOnce();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === Role.EMPLOYEE && activeView === 'dashboard') {
      setActiveView(getDefaultView(currentUser));
    }
  }, [currentUser, activeView]);

  const handleLogout = () => {
    logoutMutation.mutate();
    setActiveView('dashboard');
  };

  const handleLoginSuccess = () => {
    const user = useAuthStore.getState().user;
    setActiveView(user ? getDefaultView(user) : 'dashboard');
  };

  if (!isInitialized) return null;

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const Unauthorized = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-red-100 rounded-[30px] shadow-sm max-w-xl mx-auto my-12 animate-in fade-in duration-300">
      <div className="h-16 w-16 rounded-3xl bg-red-50 text-red-650 flex items-center justify-center mb-6 border border-red-100/50">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">Access Rule Limitation</h3>
      <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest animate-pulse">NMC-HR Security Layer</p>
      <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-4 max-w-sm">
        Your account access rules limit you from viewing this sub-system. Please reach out to an Administrator to adjust your allowed access features.
      </p>
    </div>
  );

  const renderContent = () => {
    if (currentUser.role === Role.EMPLOYEE && activeView === 'dashboard') {
      return <Unauthorized />;
    }

    // Check permissions
    if (currentUser.role !== Role.ADMIN) {
      const p = currentUser.permissions;
      if (p) {
        if (activeView === 'dashboard' && p.dashboard === false) return <Unauthorized />;
        if (activeView === 'employees' && p.employees === false) return <Unauthorized />;
        if (activeView === 'ai-search' && p.aiSearch === false) return <Unauthorized />;
        if ((activeView === 'reports' || activeView === 'employment-report' || activeView === 'promotion-report') && p.reports === false) return <Unauthorized />;
        if (activeView === 'payroll' && p.payroll === false) return <Unauthorized />;
        if (activeView === 'leaves' && p.leaves === false) return <Unauthorized />;
        if (activeView === 'attendance' && p.attendance === false) return <Unauthorized />;
        if (activeView === 'talent-acquisition' && p.talentAcquisition === false) return <Unauthorized />;
        if (activeView === 'administration') return <Unauthorized />;
      }
    }

    switch (activeView) {
      // HR Views
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'employees':
        return <EmployeeManager />;
      case 'add-employee':
        return <EmployeeManager />; // Fallback for any remaining links
      case 'ai-search':
        return <AISearch />;
      case 'reports':
        return <Reports />;
      case 'employment-report':
        return <Reports initialType="Employment Report" />;
      case 'promotion-report':
        return <Reports initialType="Promotion Report" />;
      case 'payroll':
        return <PayrollRecords />;
      case 'leaves':
        return <LeaveRecords />;
      case 'attendance':
        return <AttendanceRecords />;
      case 'talent-acquisition':
        return <TalentAcquisition />;
      case 'feedback':
        return <FeedbackInbox />;
      
      // Admin Views
      case 'administration':
        return <AdminDashboard />;
      
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fdfcf0] text-green-950 font-sans selection:bg-yellow-200 selection:text-green-900">
      <Sidebar 
        user={currentUser} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto pt-20 px-4 pb-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Feedback Trigger Button ONLY for Employee Accounts (like Juan Dela Cruz) */}
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
}
