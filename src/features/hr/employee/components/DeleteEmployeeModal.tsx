import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { Employee } from '../../../../types/types';

interface DeleteEmployeeModalProps {
  employeeToDelete: Employee | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
  employeeToDelete,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  return createPortal(
    <AnimatePresence>
      {employeeToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteEmployeeModalTitle"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDeleting && onCancel()}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200/60 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="deleteEmployeeModalTitle"
                  className="font-bold text-base text-stone-900"
                >
                  Remove Employee Record?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {/* Employee Summary Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
              {employeeToDelete.profilePicture ? (
                <img
                  src={employeeToDelete.profilePicture}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover shadow-xs shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center font-bold text-green-900 text-sm shrink-0">
                  {employeeToDelete.firstName[0]}
                  {employeeToDelete.surname[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-green-950 truncate">
                  {employeeToDelete.surname}, {employeeToDelete.firstName}
                </p>
                <p className="text-xs text-stone-500 truncate mt-0.5">
                  {employeeToDelete.id} · {employeeToDelete.department} ·{' '}
                  {employeeToDelete.position}
                </p>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200/60 rounded-xl text-xs text-rose-900 leading-relaxed">
              <span className="font-bold">Permanent removal: </span>
              This will delete the employee profile, associated checklist
              documents, and permanently revoke login access to the portal.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
