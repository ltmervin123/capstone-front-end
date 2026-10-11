import React from 'react';
import { ClipboardCheck, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { CHECKLIST_STRUCTURE } from '../constants';
import type {
  AttachmentCategory,
  ChecklistCategory,
  EmployeeFormData,
} from '../types';

interface Form201ChecklistSectionProps {
  formData: EmployeeFormData;
  isReadOnly: boolean;
  checklistStats: { total: number; checked: number };
  isAllChecked: boolean;
  totalAttachments: number;
  onToggleAll: (checked: boolean) => void;
  onToggleCategory: (category: ChecklistCategory, checked: boolean) => void;
  isCategoryFullyChecked: (category: ChecklistCategory) => boolean;
  onChecklistChange: (
    category: ChecklistCategory,
    item: string,
    checked: boolean
  ) => void;
  onViewAttachment: (category: ChecklistCategory, item: string) => void;
  onUploadClick: (category: ChecklistCategory, item: string) => void;
  onRemoveAttachment: (category: AttachmentCategory, item: string) => void;
  onOpenAllAttachments: () => void;
}

export const Form201ChecklistSection: React.FC<
  Form201ChecklistSectionProps
> = ({
  formData,
  isReadOnly,
  checklistStats,
  isAllChecked,
  totalAttachments,
  onToggleAll,
  onToggleCategory,
  isCategoryFullyChecked,
  onChecklistChange,
  onViewAttachment,
  onUploadClick,
  onRemoveAttachment,
  onOpenAllAttachments,
}) => {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-emerald-700 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
              Form 201 Checklist
            </h4>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">
              Employee Personnel File — {checklistStats.checked}/
              {checklistStats.total} items confirmed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalAttachments > 0 && (
            <button
              type="button"
              onClick={onOpenAllAttachments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <FileText size={13} />
              View Files ({totalAttachments})
            </button>
          )}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onToggleAll(!isAllChecked)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isAllChecked}
                readOnly
                className="h-3.5 w-3.5 cursor-pointer accent-green-900 rounded pointer-events-none"
              />
              {isAllChecked ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Checklist Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHECKLIST_STRUCTURE.map((category) => {
          const isCatChecked = isCategoryFullyChecked(category.id);
          return (
            <div
              key={category.id}
              className="bg-stone-50/60 p-4 rounded-xl border border-stone-200/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-bold text-green-950 uppercase tracking-wide">
                  {category.title}
                </h5>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      onToggleCategory(category.id, !isCatChecked)
                    }
                    className="text-[10px] font-semibold text-emerald-800 hover:text-green-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wide transition-colors cursor-pointer border border-emerald-200/60"
                  >
                    {isCatChecked ? 'Deselect' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {category.items.map((item) => {
                  const hasAttachment =
                    !!formData.attachments?.[category.id]?.[item];
                  const isChecked =
                    formData.checklist?.[category.id]?.[item] || false;
                  return (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white transition-all group/item"
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 rounded border-stone-300 text-green-900 accent-green-900 cursor-pointer shrink-0"
                          checked={isChecked}
                          onChange={(e) =>
                            onChecklistChange(
                              category.id,
                              item,
                              e.target.checked
                            )
                          }
                          disabled={isReadOnly}
                        />
                        <span
                          className={`text-xs font-medium leading-snug ${isChecked ? 'text-green-900' : 'text-stone-600'}`}
                        >
                          {item}
                        </span>
                      </label>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasAttachment && (
                          <button
                            type="button"
                            onClick={() =>
                              onViewAttachment(category.id, item)
                            }
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors cursor-pointer"
                            title="View document"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onUploadClick(category.id, item)
                              }
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                hasAttachment
                                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200/60 hover:bg-emerald-100'
                                  : 'text-stone-500 bg-white border-stone-200/80 hover:text-emerald-800 hover:border-emerald-300'
                              }`}
                              title={
                                hasAttachment
                                  ? 'Replace file'
                                  : 'Attach file'
                              }
                            >
                              <Upload size={12} />
                            </button>
                            {hasAttachment && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveAttachment(category.id, item)
                                }
                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-lg transition-colors cursor-pointer"
                                title="Remove attachment"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        )}
                        {isReadOnly && !hasAttachment && (
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide bg-stone-100 rounded px-2 py-0.5">
                            Not filed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
