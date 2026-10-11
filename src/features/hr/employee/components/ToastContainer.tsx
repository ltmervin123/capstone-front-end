import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 text-white border-emerald-800/80 shadow-emerald-950/20'
                : toast.type === 'error'
                  ? 'bg-rose-950/95 text-white border-rose-800/80 shadow-rose-950/20'
                  : 'bg-stone-900/95 text-white border-stone-800/80 shadow-stone-950/20'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : toast.type === 'error'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-stone-500/20 text-stone-300'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : toast.type === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold leading-tight">
                {toast.title}
              </h4>
              <p className="text-[11px] text-stone-300 font-normal mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
