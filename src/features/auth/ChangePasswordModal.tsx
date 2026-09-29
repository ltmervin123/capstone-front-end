import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useChangePassword } from '../../hooks/useAuth';
import { changePasswordFormSchema } from '../../schemas/changePassword.schema';
import { ApiRequestError } from '../../utils/apiClient';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = changePasswordFormSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the password fields.');
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        return;
      }

      setError('Unable to change password right now. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden"
      >
        <div className="bg-green-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-xl">
              <KeyRound size={18} className="text-green-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-yellow-400 uppercase tracking-tight">Change Password</h2>
              <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mt-0.5">Account security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-green-300 hover:text-white transition-colors"
            aria-label="Close change password"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-green-800 mb-2">Current password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 opacity-50" size={16} />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 p-1 rounded-lg hover:bg-green-50"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-green-800 mb-2">New password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 opacity-50" size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 p-1 rounded-lg hover:bg-green-50"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-green-800 mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-100">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="w-full py-3 bg-green-900 text-yellow-400 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg hover:bg-green-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {changePassword.isPending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
