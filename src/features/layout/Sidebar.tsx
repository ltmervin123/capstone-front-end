import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  X, 
  KeyRound, 
  ChevronDown,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../../assets/common/Logo';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { getSidebarRoutes } from '../../routes/landingPolicy';
import type { RouteItem } from '../../routes/manifest';
import { Role } from '../../types/types';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Memoize route calculation
  const menuItems = useMemo(() => {
    return user ? getSidebarRoutes(user) : [];
  }, [user]);

  // Route active evaluation
  const isRouteActive = useCallback((path: string, exact: boolean = false) => {
    if (exact || path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }, [location.pathname]);

  // Auto-expand accordion when a child route is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems?.some((sub) => location.pathname === sub.path)) {
        setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname, menuItems]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.id, user?.profilePicture]);

  // Handle mobile drawer keyboard accessibility & scroll lock
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        mobileToggleRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  if (!user) return null;

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/login');
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatRoleName = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'Administrator';
      case Role.HR:
        return 'HR Officer';
      case Role.EMPLOYEE:
        return 'Employee';
      default:
        return role;
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-[#0c2415] border-b border-emerald-900/50 px-4 flex items-center justify-between shadow-md">
        <button
          ref={mobileToggleRef}
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-emerald-900/70 text-amber-300 hover:bg-emerald-800 hover:text-amber-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c2415] focus-visible:outline-hidden cursor-pointer"
          aria-label={isMobileOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          aria-expanded={isMobileOpen}
          aria-controls="primary-sidebar"
        >
          {isMobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-2.5 rounded-lg p-1 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden cursor-pointer"
          aria-label="NMC-HR Home"
        >
          <Logo className="w-8 h-8" />
          <span className="font-extrabold tracking-tight text-white text-base">
            NMC<span className="text-amber-400">-HR</span>
          </span>
        </button>

        <div className="w-[44px]" aria-hidden="true" />
      </header>

      {/* Backdrop overlay for mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40 cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Navigation */}
      <aside
        id="primary-sidebar"
        aria-label="Main Navigation"
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#0c2415] text-emerald-50 flex flex-col border-r border-emerald-900/60 shadow-2xl transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 lg:z-30 lg:shadow-none ${className}
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900/50 bg-[#081a0f] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('/')}
            className="group flex items-center gap-3.5 text-left rounded-xl p-1.5 -m-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081a0f] focus-visible:outline-hidden cursor-pointer"
            aria-label="NMC-HR Personnel Hub, return to home"
          >
            <div className="relative p-1 rounded-xl bg-white/5 border border-white/10 group-hover:border-amber-400/50 transition-colors">
              <Logo className="w-10 h-10" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white uppercase leading-none group-hover:text-amber-300 transition-colors">
                NMC<span className="text-amber-400">-HR</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-bold mt-1">
                Personnel Hub
              </div>
            </div>
          </button>

          {/* Close button for mobile inside drawer */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden cursor-pointer"
            aria-label="Close navigation sidebar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav 
          aria-label="Primary"
          className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800/60 scrollbar-track-transparent"
        >
          {menuItems.map((item: RouteItem) => {
            const hasSub = !!item.subItems && item.subItems.length > 0;
            const isParentActive = isRouteActive(item.path, item.path === '/dashboard');
            const isExpanded = !!expandedGroups[item.id];
            const Icon = item.icon;

            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    aria-current={isParentActive ? 'page' : undefined}
                    className={`
                      flex-1 min-h-[44px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer text-left
                      focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0c2415] focus-visible:outline-hidden
                      ${isParentActive
                        ? 'bg-amber-400 text-emerald-950 font-bold shadow-md shadow-amber-950/20'
                        : 'text-emerald-100 hover:bg-emerald-900/60 hover:text-white'}
                    `}
                  >
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className={`shrink-0 transition-colors ${
                        isParentActive 
                          ? 'text-emerald-950' 
                          : 'text-amber-300/80 group-hover:text-amber-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>

                  {/* Sub-item disclosure toggle */}
                  {hasSub && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} sub-items`}
                      className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden cursor-pointer"
                    >
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* Collapsible Sub-Items */}
                {hasSub && (
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden pl-6 pr-1 space-y-1"
                      >
                        {item.subItems!.map((sub) => {
                          const isSubActive = location.pathname === sub.path;
                          const SubIcon = sub.icon;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleNavClick(sub.path)}
                              aria-current={isSubActive ? 'page' : undefined}
                              className={`
                                w-full min-h-[40px] flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group cursor-pointer text-left
                                focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden
                                ${isSubActive
                                  ? 'bg-amber-400/20 text-amber-300 font-bold border-l border-amber-400'
                                  : 'text-emerald-200/90 hover:bg-emerald-900/50 hover:text-white'}
                              `}
                            >
                              <SubIcon
                                size={15}
                                aria-hidden="true"
                                className={isSubActive ? 'text-amber-300' : 'text-emerald-400/80 group-hover:text-emerald-300'}
                              />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Card & Administrative Actions Footer */}
        <div className="p-4 border-t border-emerald-900/50 bg-[#081a0f] shrink-0 space-y-3">
          {/* User Profile Summary */}
          <div className="flex items-center gap-3 p-2.5 bg-emerald-950/90 border border-emerald-900/50 rounded-xl">
            {user.role === Role.EMPLOYEE && user.profilePicture && !avatarFailed ? (
              <img
                src={user.profilePicture}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full bg-amber-400 text-emerald-950 font-black flex items-center justify-center text-base shrink-0 shadow-xs"
                aria-hidden="true"
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate" title={user.username}>
                {user.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.role === Role.ADMIN ? (
                  <ShieldCheck size={13} className="text-amber-400 shrink-0" aria-hidden="true" />
                ) : (
                  <UserCheck size={13} className="text-emerald-400 shrink-0" aria-hidden="true" />
                )}
                <span className="text-[11px] text-amber-300/90 font-bold uppercase tracking-wider truncate">
                  {formatRoleName(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 hover:text-amber-200 border border-emerald-800/60 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden cursor-pointer"
              title="Change Account Password"
            >
              <KeyRound size={15} aria-hidden="true" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut size={15} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};
