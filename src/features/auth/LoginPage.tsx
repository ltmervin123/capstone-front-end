import React, { useState } from 'react';
import { Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Logo } from '../../assets/common/Logo';
import { useLogin } from '../../hooks/useAuth';
import { loginSchema } from './login.schema';
import { ApiRequestError } from '../../utils/apiClient';

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
  const loginMutation = useLogin();

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
      await loginMutation.mutateAsync(parsed.data);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      const state = location.state as { from?: { pathname?: string } } | null;
      const fromPath = state?.from?.pathname || '/';
      navigate(fromPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        return;
      }

      setError('Unable to sign in right now. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf0] flex flex-col items-center justify-center p-6 relative overflow-hidden text-green-950">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-100 rounded-full blur-[100px] opacity-30" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8 group">
          <Logo className="w-32 h-32 mb-6" />
          <h1 className="text-5xl font-black tracking-tighter text-green-900 uppercase text-center">NMC-HR</h1>
          <p className="text-xs font-black text-green-700 uppercase tracking-[0.3em] mt-2 bg-yellow-400 px-4 py-1 rounded-full">Personnel System</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-[#e5e7eb]">
          <h2 className="text-2xl font-bold mb-6 text-center">Log in</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-green-800 mb-2">Username or email</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 opacity-50" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all placeholder:text-green-300"
                  placeholder="Username or email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-green-800 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 opacity-50" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all placeholder:text-green-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-905 transition-colors p-1 rounded-lg cursor-pointer hover:bg-green-50/50"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`
                w-full py-4 bg-green-900 text-yellow-400 rounded-xl font-bold text-lg shadow-xl shadow-green-900/20 
                hover:bg-green-800 hover:scale-[1.02] active:scale-[0.98] transition-all
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : 'Log in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
            <button type="button" className="text-sm font-bold text-green-700 hover:text-green-900 transition-colors text-center">
              Forgot password?
            </button>
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest leading-relaxed">
              Sign in with your database account. Contact an administrator if you need access.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-green-800 font-medium opacity-60 italic">
            "Excellence in HR Information Management"
          </p>
        </div>
      </motion.div>
    </div>
  );
};
