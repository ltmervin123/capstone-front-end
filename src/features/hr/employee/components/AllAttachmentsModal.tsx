import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ClipboardCheck, Eye, X } from 'lucide-react';
import { CHECKLIST_STRUCTURE } from '../constants';
import { isPdfAttachment } from '../utils';
import type { AttachmentItem } from '../types';

interface AllAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAttachments: AttachmentItem[];
  onSelectAttachment: (att: AttachmentItem) => void;
}

export const AllAttachmentsModal: React.FC<AllAttachmentsModalProps> = ({
  isOpen,
  onClose,
  allAttachments,
  onSelectAttachment,
}) => {
  const totalAttachments = allAttachments.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md !m-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden border border-stone-200/80 max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <ClipboardCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-green-950 text-sm">
                    Personnel File Portfolio
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {totalAttachments} attached document
                    {totalAttachments !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close file list"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {allAttachments.map((att, i) => {
                const catObj = CHECKLIST_STRUCTURE.find(
                  (c) => c.id === att.categoryId
                );
                const catLabel = catObj?.title.split('.')[0] ?? 'Doc';
                const isPdf =
                  att.file?.type === 'application/pdf' ||
                  att.file?.name.toLowerCase().endsWith('.pdf') ||
                  isPdfAttachment(att.data, att.name);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200/60 rounded-xl hover:bg-white transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200/60 shrink-0">
                        {catLabel}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-950 truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {isPdf ? 'PDF Document' : 'Image File'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAttachment(att)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
