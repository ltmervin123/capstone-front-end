import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  LogOut, 
  LayoutDashboard, 
  // Settings,
  ShieldCheck,
  // History,
  Menu,
  X,
  Banknote,
  CalendarDays,
  Clock,
  Search,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Role } from "../../types/types";
import type { User } from '../../types/types';
import { Logo } from '../../assets/common/Logo';

interface SidebarProps {
  user: User;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, onLogout }) => {
  const [isOpen, setIsOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const hrMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Manager', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'payroll', label: 'Payroll', icon: Banknote },
    { id: 'leaves', label: 'Leave Records', icon: CalendarDays },
    { id: 'talent-acquisition', label: 'Talent Acquisition', icon: UserPlus },
    { id: 'feedback', label: 'Feedback Inbox', icon: MessageSquare },
    { id: 'ai-search', label: 'AI Search', icon: Search },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3,
      subItems: [
        { id: 'employment-report', label: 'Employment Report', icon: ArrowUpRight },
        { id: 'promotion-report', label: 'Promotion Report', icon: TrendingUp },
      ]
    },
  ];

  const adminMenuItems = [
    { id: 'administration', label: 'Administration', icon: ShieldCheck },
  ];

  const rawMenuItems = user.role === Role.ADMIN ? [hrMenuItems[0], ...adminMenuItems, ...hrMenuItems.slice(1)] : hrMenuItems;

  const isEmployeeAccount = !!user.employeeId || user.role === Role.EMPLOYEE;

  const menuItems = rawMenuItems.filter(item => {
    // Employee accounts (e.g. Juan Dela Cruz) should NOT see Feedback Inbox in sidebar
    if (item.id === 'feedback' && isEmployeeAccount) return false;
    if (item.id === 'dashboard' && user.role === Role.EMPLOYEE) return false;

    if (user.role === Role.ADMIN) return true;
    if (item.id === 'administration') return false; // Non-admins never get administration
    
    const p = user.permissions;
    if (!p) return true; // fallback to show if no permissions object is present at all

    if (item.id === 'dashboard') return p.dashboard !== false;
    if (item.id === 'employees') return p.employees !== false;
    if (item.id === 'attendance') return p.attendance !== false;
    if (item.id === 'payroll') return p.payroll !== false;
    if (item.id === 'leaves') return p.leaves !== false;
    if (item.id === 'talent-acquisition') return p.talentAcquisition !== false;
    if (item.id === 'ai-search') return p.aiSearch !== false;
    if (item.id === 'reports') return p.reports !== false;
    if (item.id === 'feedback') return p.feedback !== false;
    
    return true;
  });

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-green-800 text-yellow-400 rounded-xl shadow-lg hover:bg-green-700 transition-colors focus:outline-none"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Backdrop overlay for mobile/tablet */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity animate-in fade-in duration-200"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-green-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 bg-green-950 flex items-center gap-4 group cursor-pointer">
            <Logo className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase leading-none">NMC-HR</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-green-400 font-black mt-1">Personnel Hub</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${activeView === item.id 
                      ? 'bg-yellow-400 text-green-950 font-bold shadow-lg shadow-yellow-900/20' 
                      : 'text-green-100 hover:bg-green-800 hover:text-white'}
                  `}
                >
                  <item.icon size={20} className={activeView === item.id ? 'text-green-900' : 'text-yellow-500 opacity-70 group-hover:opacity-100 transition-opacity'} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
                
                {/* Sub Items */}
                {(item as any).subItems && (
                  <div className="ml-6 space-y-1 mt-1 mb-2">
                    {(item as any).subItems.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.id)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-xs
                          ${activeView === sub.id 
                            ? 'bg-yellow-400/20 text-yellow-400 font-bold' 
                            : 'text-green-300 hover:bg-green-800 hover:text-white'}
                        `}
                      >
                        <sub.icon size={14} className={activeView === sub.id ? 'text-yellow-400' : 'text-yellow-500 opacity-50 group-hover:opacity-100'} />
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-green-800">
            <div className="flex items-center gap-3 p-3 bg-green-800/50 rounded-xl mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-green-950 text-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user.username}</p>
                <p className="text-[10px] text-yellow-400 uppercase font-bold tracking-tighter opacity-80">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-yellow-400 text-green-950 rounded-xl hover:bg-yellow-300 transition-colors shadow-md"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
