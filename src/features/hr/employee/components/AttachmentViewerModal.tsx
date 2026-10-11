import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Eye, X } from 'lucide-react';
import {
  isMetadataOnlyAttachment,
  isPdfAttachment,
  parseMetadataLabel,
} from '../utils';
import type { ViewerAttachment } from '../types';

interface AttachmentViewerModalProps {
  viewerAttachment: ViewerAttachment | null;
  onClose: () => void;
  popupBlocked: boolean;
  onSetPopupBlocked: (blocked: boolean) => void;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  viewerAttachment,
  onClose,
  popupBlocked,
  onSetPopupBlocked,
}) => {
  return (
    <AnimatePresence>
      {viewerAttachment && (
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
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-green-950 text-sm">
                    Document Viewer
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium truncate max-w-md">
                    {viewerAttachment.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close viewer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-6 bg-stone-50 flex flex-col items-center justify-center overflow-auto min-h-0">
              {isMetadataOnlyAttachment(viewerAttachment.data) ? (
                <div className="max-w-lg text-center space-y-3 p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
                  <AlertCircle className="mx-auto text-stone-400" size={28} />
                  <p className="text-sm font-bold text-green-950">
                    File content was not stored
                  </p>
                  <p className="text-xs text-stone-500 font-medium leading-relaxed">
                    {parseMetadataLabel(viewerAttachment.data)}
                  </p>
                </div>
              ) : isPdfAttachment(
                  viewerAttachment.data,
                  viewerAttachment.name,
                  viewerAttachment.isPdf
                ) ? (
                <div className="w-full h-full flex flex-col gap-3">
                  <iframe
                    src={viewerAttachment.data}
                    title={viewerAttachment.name}
                    className="w-full flex-1 rounded-xl border border-stone-200 bg-white"
                  />
                  <div className="text-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open(
                          viewerAttachment.data,
                          '_blank'
                        );
                        if (!win) {
                          onSetPopupBlocked(true);
                        } else {
                          onSetPopupBlocked(false);
                        }
                      }}
                      className="text-xs font-semibold text-emerald-800 hover:underline transition-colors"
                    >
                      Open in new tab →
                    </button>
                    {popupBlocked && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg mt-1 inline-block">
                        Pop-up was blocked by browser. Please allow pop-ups for
                        this site or right-click to open.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                  <img
                    src={viewerAttachment.data}
                    alt={viewerAttachment.name}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-stone-100"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
