import React from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PayrollConfirmDialogProps {
  dialog: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null;
  onClose: () => void;
}

export const PayrollConfirmDialog: React.FC<PayrollConfirmDialogProps> = ({
  dialog,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {dialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-md border border-stone-200/80 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  dialog.confirmVariant === 'danger'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {dialog.confirmVariant === 'danger' ? (
                  <Trash2 size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>
              <div>
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-bold text-green-950 tracking-tight"
                >
                  {dialog.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {dialog.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-hidden"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = dialog.onConfirm;
                  onClose();
                  action();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs focus-visible:ring-2 focus-visible:outline-hidden ${
                  dialog.confirmVariant === 'danger'
                    ? 'bg-rose-700 hover:bg-rose-800 text-white focus-visible:ring-rose-700'
                    : 'bg-green-900 hover:bg-green-800 text-white focus-visible:ring-green-800'
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
