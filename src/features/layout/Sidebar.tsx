import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu,
  X,
  KeyRound,
} from 'lucide-react';
import { Logo } from '../../assets/common/Logo';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { getSidebarRoutes } from '../../routes/landingPolicy';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const [isOpen, setIsOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  const menuItems = getSidebarRoutes(user);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/login');
  };

  const isRouteActive = (path: string, exact: boolean = false) => {
    if (exact || path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
        lg:translate-x-0 lg:static lg:h-screen lg:shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div 
            onClick={() => handleNavClick('/')}
            className="p-6 bg-green-950 flex items-center gap-4 group cursor-pointer"
          >
            <Logo className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase leading-none">NMC-HR</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-green-400 font-black mt-1">Personnel Hub</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const active = isRouteActive(item.path, item.path === '/dashboard');
              const Icon = item.icon;

              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer
                      ${active 
                        ? 'bg-yellow-400 text-green-950 font-bold shadow-lg shadow-yellow-900/20' 
                        : 'text-green-100 hover:bg-green-800 hover:text-white'}
                    `}
                  >
                    <Icon size={20} className={active ? 'text-green-900' : 'text-yellow-500 opacity-70 group-hover:opacity-100 transition-opacity'} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                  
                  {/* Sub Items */}
                  {item.subItems && (
                    <div className="ml-6 space-y-1 mt-1 mb-2">
                      {item.subItems.map((sub) => {
                        const subActive = location.pathname === sub.path;
                        const SubIcon = sub.icon;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleNavClick(sub.path)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-xs cursor-pointer
                              ${subActive 
                                ? 'bg-yellow-400/20 text-yellow-400 font-bold' 
                                : 'text-green-300 hover:bg-green-800 hover:text-white'}
                            `}
                          >
                            <SubIcon size={14} className={subActive ? 'text-yellow-400' : 'text-yellow-500 opacity-50 group-hover:opacity-100'} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-green-800 shrink-0">
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
              onClick={() => setIsChangePasswordOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-bold bg-green-800 text-yellow-400 rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
            >
              <KeyRound size={16} />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-yellow-400 text-green-950 rounded-xl hover:bg-yellow-300 transition-colors shadow-md cursor-pointer"
            >
              <LogOut size={16} />
              Logout
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
