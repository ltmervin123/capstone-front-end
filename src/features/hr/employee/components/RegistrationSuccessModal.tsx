import React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { CreatedSuccessInfo } from '../types';

interface RegistrationSuccessModalProps {
  createdSuccessInfo: CreatedSuccessInfo;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
  copyAllCredentialsText: () => string;
  onFinish: () => void;
}

export const RegistrationSuccessModal: React.FC<
  RegistrationSuccessModalProps
> = ({
  createdSuccessInfo,
  showPassword,
  onToggleShowPassword,
  copiedField,
  onCopy,
  copyAllCredentialsText,
  onFinish,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3
              id="registrationSuccessTitle"
              className="font-bold text-green-950 text-base"
            >
              Employee Registration Successful
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Profile recorded and portal access credentials generated
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
        {/* Celebration Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm ring-4 ring-emerald-100 shrink-0">
            <CheckCircle2 size={28} />
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h4 className="font-extrabold text-base text-emerald-950">
              New Employee Successfully Registered!
            </h4>
            <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
              The record for{' '}
              <span className="font-bold text-emerald-950">
                {createdSuccessInfo.fullName}
              </span>{' '}
              has been saved to the directory. Provide the temporary login
              credentials below to the employee.
            </p>
          </div>
        </div>

        {/* Employee Summary Card */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-4">
          {createdSuccessInfo.profilePicture ? (
            <img
              src={createdSuccessInfo.profilePicture}
              alt=""
              className="w-13 h-13 rounded-2xl object-cover shadow-xs border border-stone-200 shrink-0"
            />
          ) : (
            <div className="w-13 h-13 rounded-2xl bg-green-900 text-amber-300 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {createdSuccessInfo.fullName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="font-bold text-sm text-green-950 truncate">
                {createdSuccessInfo.fullName}
              </h5>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-100 text-green-900 border border-green-200">
                {createdSuccessInfo.employeeNumber}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 font-medium truncate">
              {createdSuccessInfo.position} · {createdSuccessInfo.department}
            </p>
          </div>
        </div>

        {/* Credentials Card */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 text-white overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-amber-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-stone-200">
                Generated Portal Login Credentials
              </span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold rounded-full">
              Active Login
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Sign-in Email */}
            <div className="bg-stone-800/70 rounded-xl p-3 border border-stone-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Sign-in Email (Username)
                </span>
                <span className="text-xs font-semibold text-stone-100 truncate block mt-0.5 select-all font-mono">
                  {createdSuccessInfo.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  void onCopy(createdSuccessInfo.email, 'email')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                title="Copy email"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Default Password */}
            <div className="bg-stone-800/70 rounded-xl p-3 border border-stone-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Temporary Default Password
                  </span>
                  <button
                    type="button"
                    onClick={onToggleShowPassword}
                    className="text-stone-400 hover:text-stone-200 transition-colors p-0.5 cursor-pointer"
                    title={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <span className="text-xs font-semibold text-stone-100 truncate block mt-0.5 select-all font-mono">
                  {showPassword
                    ? createdSuccessInfo.email
                    : '••••••••••••••••'}
                </span>
                <p className="text-[10px] text-stone-400 mt-1">
                  Default password is set to the employee's email.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  void onCopy(createdSuccessInfo.email, 'password')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                title="Copy password"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Portal Link */}
            <div className="bg-stone-800/70 rounded-xl p-3 border border-stone-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Portal Login URL
                </span>
                <span className="text-xs font-semibold text-stone-100 truncate block mt-0.5 select-all font-mono">
                  {window.location.origin}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  void onCopy(window.location.origin, 'url')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                title="Copy URL"
              >
                {copiedField === 'url' ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Copy Full Credentials Packet Button */}
            <button
              type="button"
              onClick={() => void onCopy(copyAllCredentialsText(), 'all')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {copiedField === 'all' ? (
                <>
                  <Check size={14} className="text-stone-950" />
                  <span>Credentials Packet Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Full Welcome &amp; Credentials Details</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Guidance Callout */}
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <AlertCircle
            size={16}
            className="text-amber-700 shrink-0 mt-0.5"
          />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Security Guidance: </span>
            Please advise{' '}
            <span className="font-semibold">
              {createdSuccessInfo.fullName}
            </span>{' '}
            to sign in and immediately update their temporary password
            under Account Settings for compliance with school policy.
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-4 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <Check size={14} />
          <span>Done &amp; View Directory</span>
        </button>
      </div>
    </div>
  );
};
