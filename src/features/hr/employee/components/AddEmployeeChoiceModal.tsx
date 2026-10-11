import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Edit2,
  Fingerprint,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

interface AddEmployeeChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  parseLoading: boolean;
  parseError: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AddEmployeeChoiceModal: React.FC<AddEmployeeChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectManual,
  parseLoading,
  parseError,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="addModeModalTitle"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200/80 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl text-green-900">
                  <Upload size={18} />
                </div>
                <div>
                  <h3
                    id="addModeModalTitle"
                    className="text-sm font-bold text-green-950"
                  >
                    Choose Registration Method
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    NMC Human Resource Registry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={parseLoading}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Error State */}
              {parseError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100 text-red-800 text-xs"
                >
                  <AlertCircle
                    size={16}
                    className="shrink-0 text-red-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold">
                      Document parsing failed:{' '}
                    </span>
                    {parseError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Import PDS */}
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between gap-5 ${
                    isDragging
                      ? 'border-amber-400 bg-amber-50/40 scale-[1.01]'
                      : 'border-stone-200/80 hover:border-emerald-300 bg-stone-50/30 hover:bg-emerald-50/20'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-800">
                        <Fingerprint size={22} />
                      </div>
                      <span className="px-2 py-0.5 bg-amber-400 text-green-950 text-[9px] font-bold uppercase rounded-full tracking-wider">
                        PDF Document
                      </span>
                    </div>
                    <h4 className="font-bold text-green-950 text-sm">
                      Upload Document (AI)
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-2">
                      Upload a Personal Data Sheet (CS Form 212), résumé, or
                      bio-data (PDF only). The AI will validate the document and
                      pre-fill the employee registration form automatically.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onFileSelect}
                      accept="application/pdf"
                      className="hidden"
                      disabled={parseLoading}
                    />

                    {parseLoading ? (
                      <div className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-dashed border-stone-200">
                        <Loader2
                          size={22}
                          className="text-green-900 animate-spin"
                        />
                        <p className="text-[10px] font-semibold text-stone-600 mt-2 text-center">
                          Analyzing PDF &amp; extracting employee profile…
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-green-900 hover:bg-green-800 text-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                      >
                        <Upload size={14} />
                        Upload PDF Document
                      </button>
                    )}
                  </div>
                </div>

                {/* Option B: Manual Entry */}
                <div className="border border-stone-200/80 hover:border-stone-300 rounded-2xl p-5 bg-white hover:bg-stone-50/50 transition-all duration-200 flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Edit2 size={18} />
                      </div>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[9px] font-bold uppercase rounded-full tracking-wider">
                        Manual
                      </span>
                    </div>
                    <h4 className="font-bold text-green-950 text-sm">
                      Enter Manually
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-2">
                      Fill out the standard employee registration form line by
                      line. Best for physical records or when you prefer full
                      control.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onSelectManual}
                    disabled={parseLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-stone-200 hover:border-stone-300 text-green-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    Start Empty Form
                    <ArrowRight size={14} className="text-green-800" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
