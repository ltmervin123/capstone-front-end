import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs !m-0"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200/60 shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Reset All Form Fields?
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  This will revert all fields and attachments to their initial
                  values.
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-600 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60 leading-relaxed">
              Are you sure you want to discard your changes? Any unsaved edits
              and newly uploaded documents will be lost.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Yes, Reset Form
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
