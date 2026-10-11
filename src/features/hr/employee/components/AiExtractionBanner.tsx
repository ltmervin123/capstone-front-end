import React from 'react';
import { Eye, FileText } from 'lucide-react';
import type { InitialDocumentFile } from '../types';

interface AiExtractionBannerProps {
  initialDocumentFile: InitialDocumentFile;
  onPreview: () => void;
}

export const AiExtractionBanner: React.FC<AiExtractionBannerProps> = ({
  initialDocumentFile,
  onPreview,
}) => {
  return (
    <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
          <FileText size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-emerald-950">
              AI-Extracted Profile Draft
            </span>
            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
              {initialDocumentFile.documentType}
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/90 mt-0.5">
            Pre-filled from{' '}
            <span className="font-semibold">
              {initialDocumentFile.file.name}
            </span>
            . Review the extracted fields below and make any needed
            adjustments.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
      >
        <Eye size={13} />
        <span>Preview Uploaded Document</span>
      </button>
    </div>
  );
};
