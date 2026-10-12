import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  Building2,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Logo } from '../../assets/common/Logo';
import { useLogin } from '../../hooks/useAuth';
import { loginSchema } from './login.schema';
import { ApiRequestError } from '../../utils/apiClient';
import { ROUTE_MANIFEST } from '../../routes/manifest';
import { canAccessRoute, getDefaultRouteForUser } from '../../routes/landingPolicy';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const loginMutation = useLogin();
  const prefersReducedMotion = useReducedMotion();
  const modalCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Close help modal on Escape key
  useEffect(() => {
    if (!isHelpModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHelpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    modalCloseBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpModalOpen]);

  if (isInitialized && currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid login credentials.');
      return;
    }

    try {
      const authenticatedUser = await loginMutation.mutateAsync(parsed.data);
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      const state = location.state as { from?: { pathname?: string } } | null;
      const fromPath = state?.from?.pathname;

      let destination = getDefaultRouteForUser(authenticatedUser);

      if (fromPath && fromPath !== '/' && fromPath !== '/login') {
        const matchingRoute = ROUTE_MANIFEST.find(
          (item) => item.path === fromPath || fromPath.startsWith(`${item.path}/`)
        );

        if (matchingRoute && canAccessRoute(authenticatedUser, matchingRoute)) {
          destination = fromPath;
        }
      }

      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        return;
      }

      setError(
        'Unable to sign in right now. Please verify your credentials and try again.'
      );
    }
  };

  const transitionConfig = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="min-h-[100dvh] w-full bg-[#fdfcf0] text-stone-900 flex flex-col items-center p-4 sm:p-6 py-6 sm:py-10 selection:bg-amber-200 selection:text-emerald-950 overflow-y-auto">
      <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col items-center">
        {/* Institutional Branding */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white p-2 shadow-sm border border-stone-200/90 mb-2.5 flex items-center justify-center shrink-0">
            <Logo className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base sm:text-lg font-black text-[#1e4d2b] tracking-tight uppercase leading-snug">
            Northern Mindanao Colleges
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-widest mt-0.5">
            Personnel Information System
          </p>
        </div>

        {/* Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionConfig}
          className="w-full bg-white p-5 sm:p-8 rounded-2xl shadow-xl shadow-stone-900/5 border border-stone-200/90"
        >
          <div className="mb-5 sm:mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#12351f] tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              Enter your institutional username or email and password.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5" noValidate>
            {/* Username Field */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold uppercase tracking-wider text-[#1e4d2b] mb-1.5"
              >
                Username or email
              </label>
              <div className="relative">
                <UserIcon
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800/70 pointer-events-none"
                  size={17}
                  aria-hidden="true"
                />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loginMutation.isPending}
                  aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error-alert' : undefined}
                  placeholder="Enter username or email"
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white text-stone-900 placeholder:text-stone-500 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] focus:border-[#1e4d2b] transition-all shadow-xs disabled:bg-stone-100 disabled:cursor-not-allowed caret-[#1e4d2b]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1e4d2b]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800/70 pointer-events-none"
                  size={17}
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error-alert' : undefined}
                  placeholder="Enter your password"
                  className="w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 bg-white text-stone-900 placeholder:text-stone-500 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] focus:border-[#1e4d2b] transition-all shadow-xs disabled:bg-stone-100 disabled:cursor-not-allowed caret-[#1e4d2b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 min-w-[42px] min-h-[42px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center text-stone-600 hover:text-[#1e4d2b] transition-colors rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4d2b]"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Announcement */}
            <AnimatePresence>
              {error && (
                <motion.div
                  id="login-error-alert"
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={transitionConfig}
                  className="flex items-start gap-3 p-3 sm:p-3.5 bg-red-50 text-red-900 rounded-xl text-sm font-medium border border-red-200 shadow-xs"
                >
                  <AlertCircle
                    className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <span className="font-bold block text-red-950 text-xs sm:text-sm">
                      Authentication Failed
                    </span>
                    <span className="text-xs text-red-800 leading-relaxed">
                      {error}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 sm:py-3.5 px-4 bg-[#1e4d2b] hover:bg-[#163a20] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-emerald-950/25 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4d2b] focus-visible:ring-offset-2 flex items-center justify-center gap-2 group mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Authenticating credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Portal</span>
                  <ArrowRight
                    size={17}
                    className="text-amber-400 group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Institutional Account Assistance Dialog */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            aria-describedby="help-modal-desc"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={transitionConfig}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 z-10 overflow-hidden"
            >
              <div className="flex items-start justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1e4d2b]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3
                      id="help-modal-title"
                      className="text-lg font-bold text-[#12351f]"
                    >
                      Account Access Assistance
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      NMC-HR Institutional Security Protocol
                    </p>
                  </div>
                </div>
                <button
                  ref={modalCloseBtnRef}
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  aria-label="Close dialog"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4d2b]"
                >
                  <X size={20} />
                </button>
              </div>

              <div
                id="help-modal-desc"
                className="py-5 space-y-4 text-sm text-stone-700 leading-relaxed"
              >
                <p>
                  For security and compliance with personnel data protection
                  standards, NMC employee and faculty accounts are provisioned
                  and reset directly by the{' '}
                  <strong className="text-emerald-950 font-semibold">
                    Human Resources & Information Systems Office
                  </strong>
                  .
                </p>

                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2
                      size={18}
                      className="text-emerald-800 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="block font-bold text-xs uppercase tracking-wide text-stone-900">
                        In-Person Verification
                      </span>
                      <span className="text-xs text-stone-600">
                        NMC Administration Building, HR Records Section, 2nd
                        Floor
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail
                      size={18}
                      className="text-emerald-800 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="block font-bold text-xs uppercase tracking-wide text-stone-900">
                        Email Support
                      </span>
                      <span className="text-xs text-stone-600">
                        hr-support@normi.edu.ph
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone
                      size={18}
                      className="text-emerald-800 shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="block font-bold text-xs uppercase tracking-wide text-stone-900">
                        Internal Trunk Line
                      </span>
                      <span className="text-xs text-stone-600">
                        Extension 104 (HR Desk) • 8:00 AM – 5:00 PM
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-500 bg-amber-50/80 p-3 rounded-lg border border-amber-200/60 text-amber-950">
                  <strong>Note:</strong> Please prepare your official NMC
                  Faculty/Employee ID or government-issued identification when
                  requesting credential re-issuance.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="px-5 py-2.5 bg-[#1e4d2b] hover:bg-[#163a20] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4d2b]"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
