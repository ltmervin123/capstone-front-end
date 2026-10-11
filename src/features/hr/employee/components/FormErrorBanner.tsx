import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface FormErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

export const FormErrorBanner: React.FC<FormErrorBannerProps> = ({
  error,
  onDismiss,
}) => {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="flex items-start justify-between gap-3 p-4 bg-rose-50/90 text-rose-900 rounded-2xl text-xs font-medium border border-rose-200 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
          <AlertCircle size={16} />
        </div>
        <div>
          <h4 className="font-bold text-rose-950 text-xs">
            Unable to Save Employee Record
          </h4>
          <p className="text-rose-800/90 mt-0.5 leading-relaxed font-normal">
            {error}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss error"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
};
