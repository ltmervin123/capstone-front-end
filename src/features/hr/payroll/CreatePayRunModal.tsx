import React, { useState } from 'react';
import { Calendar, X, AlertCircle, Loader2, Check } from 'lucide-react';
import { CutoffType } from '../../../types/types';
import type { CreatePayrollRunPayload } from '../../../services/payrollService';
import { motion, AnimatePresence } from 'motion/react';

interface CreatePayRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayrollRunPayload) => void;
  isPending: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CreatePayRunModal: React.FC<CreatePayRunModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();

  const [newRunName, setNewRunName] = useState(
    `${MONTH_NAMES[currentMonthIdx]} ${currentYear} - Monthly`
  );
  const [newRunCutoff, setNewRunCutoff] = useState<CutoffType>(CutoffType.MONTHLY);
  const [newRunStartDate, setNewRunStartDate] = useState(
    new Date(currentYear, currentMonthIdx, 1).toISOString().slice(0, 10)
  );
  const [newRunEndDate, setNewRunEndDate] = useState(
    new Date(currentYear, currentMonthIdx + 1, 0).toISOString().slice(0, 10)
  );

  const handleCutoffTypeChange = (type: CutoffType) => {
    setNewRunCutoff(type);
    const d = new Date(newRunStartDate);
    const y = d.getFullYear();
    const m = d.getMonth();

    if (type === CutoffType.MONTHLY) {
      setNewRunName(`${MONTH_NAMES[m]} ${y} - Monthly`);
      setNewRunStartDate(new Date(y, m, 1).toISOString().slice(0, 10));
      setNewRunEndDate(new Date(y, m + 1, 0).toISOString().slice(0, 10));
    } else if (type === CutoffType.FIRST_HALF) {
      setNewRunName(`${MONTH_NAMES[m]} ${y} - 1st Cutoff`);
      setNewRunStartDate(new Date(y, m, 1).toISOString().slice(0, 10));
      setNewRunEndDate(new Date(y, m, 15).toISOString().slice(0, 10));
    } else if (type === CutoffType.SECOND_HALF) {
      setNewRunName(`${MONTH_NAMES[m]} ${y} - 2nd Cutoff`);
      setNewRunStartDate(new Date(y, m, 16).toISOString().slice(0, 10));
      setNewRunEndDate(new Date(y, m + 1, 0).toISOString().slice(0, 10));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: newRunName,
      cutoffType: newRunCutoff,
      startDate: newRunStartDate,
      endDate: newRunEndDate,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-run-title"
          className="fixed inset-0 bg-green-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-lg border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col my-8 relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3
                    id="create-run-title"
                    className="font-bold text-lg text-green-950 tracking-tight"
                  >
                    Open New Pay Period
                  </h3>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    Northern Mindanao Colleges, Inc. • Pay Period Setup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="space-y-0">
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-run-name"
                    className="text-xs font-bold text-stone-700"
                  >
                    Pay Period Name
                  </label>
                  <input
                    id="new-run-name"
                    type="text"
                    required
                    value={newRunName}
                    onChange={(e) => setNewRunName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-700 block">
                    Cutoff Cycle Preset
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCutoffTypeChange(CutoffType.MONTHLY)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                        newRunCutoff === CutoffType.MONTHLY
                          ? 'bg-green-900 text-amber-300 border-green-900 shadow-xs'
                          : 'border-stone-200/80 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      Full Month (1st–End)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCutoffTypeChange(CutoffType.FIRST_HALF)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                        newRunCutoff === CutoffType.FIRST_HALF
                          ? 'bg-green-900 text-amber-300 border-green-900 shadow-xs'
                          : 'border-stone-200/80 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      1st Half (1st–15th)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCutoffTypeChange(CutoffType.SECOND_HALF)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                        newRunCutoff === CutoffType.SECOND_HALF
                          ? 'bg-green-900 text-amber-300 border-green-900 shadow-xs'
                          : 'border-stone-200/80 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      2nd Half (16th–End)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRunCutoff(CutoffType.CUSTOM)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden ${
                        newRunCutoff === CutoffType.CUSTOM
                          ? 'bg-green-900 text-amber-300 border-green-900 shadow-xs'
                          : 'border-stone-200/80 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      Custom Dates
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="new-run-start-date"
                      className="text-xs font-bold text-stone-700"
                    >
                      Start Date
                    </label>
                    <input
                      id="new-run-start-date"
                      type="date"
                      required
                      value={newRunStartDate}
                      onChange={(e) => setNewRunStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="new-run-end-date"
                      className="text-xs font-bold text-stone-700"
                    >
                      End Date
                    </label>
                    <input
                      id="new-run-end-date"
                      type="date"
                      required
                      value={newRunEndDate}
                      onChange={(e) => setNewRunEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                  <AlertCircle size={16} className="shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    New pay runs begin in <strong>Draft</strong> status. Once created, you can Lock Attendance and run the automated calculation engine.
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:px-6 bg-stone-50/80 border-t border-stone-200/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white border border-stone-200/80 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-900 hover:bg-green-800 text-white font-semibold rounded-xl transition-all shadow-xs text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:outline-hidden disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={16} className="text-amber-300" />
                  )}
                  Initialize Pay Period
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
