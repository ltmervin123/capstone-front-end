import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, Loader2, RotateCcw, Save, TrendingUp, User, X } from 'lucide-react';
import { AiExtractionBanner } from './employee/components/AiExtractionBanner';
import { AllAttachmentsModal } from './employee/components/AllAttachmentsModal';
import { AttachmentViewerModal } from './employee/components/AttachmentViewerModal';
import { CompensationSection } from './employee/components/CompensationSection';
import { ContactInformationSection } from './employee/components/ContactInformationSection';
import { EducationalAttainmentSection } from './employee/components/EducationalAttainmentSection';
import { EmploymentDetailsSection } from './employee/components/EmploymentDetailsSection';
import { Form201ChecklistSection } from './employee/components/Form201ChecklistSection';
import { FormErrorBanner } from './employee/components/FormErrorBanner';
import { PersonalIdentificationSection } from './employee/components/PersonalIdentificationSection';
import { PromotionHistorySection } from './employee/components/PromotionHistorySection';
import { RegistrationSuccessModal } from './employee/components/RegistrationSuccessModal';
import { ResetConfirmModal } from './employee/components/ResetConfirmModal';
import { useEmployeeForm } from './employee/hooks/useEmployeeForm';
import { getInitialChecklistItem } from './employee/utils';
import type { EmployeeFormProps } from './employee/types';

export type { EmployeeFormProps };

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onCancel,
  onSuccess,
  title,
  isReadOnly = false,
  initialDocumentFile = null,
  onPromote,
}) => {
  const {
    formData,
    updateField,
    isCreateMode,
    isSubmitting,
    submitError,
    setSubmitError,
    scrollContainerRef,
    fileInputRef,
    checklistFileInputRef,
    handleProfilePictureUpload,
    handleRemoveProfilePicture,
    attachmentFiles,
    allAttachments,
    handleChecklistChange,
    handleChecklistFileUpload,
    triggerChecklistUpload,
    removeAttachment,
    handleToggleAllChecklist,
    handleToggleCategoryChecklist,
    isCategoryFullyChecked,
    checklistStats,
    isAllChecked,
    handleSubmit,
    // Success Modal
    createdSuccessInfo,
    handleFinishSuccess,
    showPassword,
    setShowPassword,
    copiedField,
    handleCopy,
    copyAllCredentialsText,
    // Reset Modal
    showResetConfirm,
    setShowResetConfirm,
    handleResetConfirm,
    // Document Viewer
    viewerAttachment,
    setViewerAttachment,
    viewerPopupBlocked,
    setViewerPopupBlocked,
    // All Attachments Modal
    showAllAttachmentsModal,
    setShowAllAttachmentsModal,
    isPdfAttachment,
  } = useEmployeeForm({
    employee,
    onCancel,
    onSuccess,
    title,
    initialDocumentFile,
  });

  // Resolve modal heading
  const modalTitle =
    title ||
    (isReadOnly
      ? 'View Employee Profile'
      : isCreateMode
        ? 'New Employee Registration'
        : 'Edit Employee Profile');

  const modalSubtitle = isReadOnly
    ? `${employee?.surname ?? ''}, ${employee?.firstName ?? ''} · ${employee?.id ?? ''}`
    : isCreateMode
      ? 'Fill in the fields below to register a new employee'
      : `Editing record for ${employee?.surname ?? ''}, ${employee?.firstName ?? ''}`;

  const HeaderIcon = isReadOnly ? Eye : User;
  const headerIconBg = isReadOnly
    ? 'bg-blue-50 text-blue-800'
    : 'bg-emerald-50 text-emerald-800';

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          createdSuccessInfo
            ? 'registrationSuccessTitle'
            : 'employeeFormModalTitle'
        }
        onClick={createdSuccessInfo ? handleFinishSuccess : onCancel}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md !m-0"
      >
        {createdSuccessInfo ? (
          <RegistrationSuccessModal
            createdSuccessInfo={createdSuccessInfo}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((prev) => !prev)}
            copiedField={copiedField}
            onCopy={handleCopy}
            copyAllCredentialsText={copyAllCredentialsText}
            onFinish={handleFinishSuccess}
          />
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-white rounded-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${headerIconBg}`}>
                  <HeaderIcon size={18} />
                </div>
                <div>
                  <h3
                    id="employeeFormModalTitle"
                    className="font-bold text-green-950 text-base"
                  >
                    {modalTitle}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {modalSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {employee && onPromote && (
                  <button
                    type="button"
                    onClick={() => onPromote(employee)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Promote this employee"
                  >
                    <TrendingUp size={13} />
                    <span className="hidden sm:inline">Promote Employee</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div
                ref={scrollContainerRef}
                className="p-6 overflow-y-auto space-y-8 flex-1 min-h-0"
              >
                {initialDocumentFile && (
                  <AiExtractionBanner
                    initialDocumentFile={initialDocumentFile}
                    onPreview={() => {
                      const item = getInitialChecklistItem(
                        initialDocumentFile.documentType
                      );
                      const data = formData.attachments?.personalInfo?.[item];
                      if (data) {
                        setViewerAttachment({
                          name: `${item} (${initialDocumentFile.file.name})`,
                          data,
                          isPdf: true,
                        });
                      }
                    }}
                  />
                )}

                <FormErrorBanner
                  error={submitError}
                  onDismiss={() => setSubmitError(null)}
                />

                <PersonalIdentificationSection
                  formData={formData}
                  isReadOnly={isReadOnly}
                  fileInputRef={fileInputRef}
                  onPhotoUpload={handleProfilePictureUpload}
                  onRemovePhoto={handleRemoveProfilePicture}
                  updateField={updateField}
                />

                <ContactInformationSection
                  formData={formData}
                  isReadOnly={isReadOnly}
                  updateField={updateField}
                />

                <EmploymentDetailsSection
                  formData={formData}
                  isReadOnly={isReadOnly}
                  updateField={updateField}
                />

                {employee && (
                  <PromotionHistorySection
                    employeeNumber={employee.id}
                    employeeName={`${employee.firstName} ${employee.surname}`}
                    onPromote={onPromote ? () => onPromote(employee) : undefined}
                  />
                )}

                <CompensationSection
                  formData={formData}
                  isReadOnly={isReadOnly}
                  updateField={updateField}
                />

                <EducationalAttainmentSection
                  formData={formData}
                  isReadOnly={isReadOnly}
                  updateField={updateField}
                />

                <Form201ChecklistSection
                  formData={formData}
                  isReadOnly={isReadOnly}
                  checklistStats={checklistStats}
                  isAllChecked={isAllChecked}
                  totalAttachments={allAttachments.length}
                  onToggleAll={handleToggleAllChecklist}
                  onToggleCategory={handleToggleCategoryChecklist}
                  isCategoryFullyChecked={isCategoryFullyChecked}
                  onChecklistChange={handleChecklistChange}
                  onViewAttachment={(categoryId, item) => {
                    const data = formData.attachments?.[categoryId]?.[item];
                    const file = attachmentFiles[categoryId]?.[item];
                    const isPdf =
                      file?.type === 'application/pdf' ||
                      file?.name.toLowerCase().endsWith('.pdf') ||
                      (data ? isPdfAttachment(data, item) : false);

                    if (data) {
                      setViewerAttachment({
                        name: file?.name ? `${item} (${file.name})` : item,
                        data,
                        isPdf,
                      });
                    }
                  }}
                  onUploadClick={triggerChecklistUpload}
                  onRemoveAttachment={removeAttachment}
                  onOpenAllAttachments={() => setShowAllAttachmentsModal(true)}
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex flex-col-reverse sm:flex-row gap-2.5 justify-end shrink-0">
                {isReadOnly ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      Reset Fields
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Saving…</span>
                        </>
                      ) : (
                        <>
                          <Save size={13} />
                          <span>
                            {isCreateMode
                              ? 'Create Employee Record'
                              : 'Save Changes'}
                          </span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      <ResetConfirmModal
        isOpen={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleResetConfirm}
      />

      <AttachmentViewerModal
        viewerAttachment={viewerAttachment}
        onClose={() => setViewerAttachment(null)}
        popupBlocked={viewerPopupBlocked}
        onSetPopupBlocked={setViewerPopupBlocked}
      />

      <AllAttachmentsModal
        isOpen={showAllAttachmentsModal}
        onClose={() => setShowAllAttachmentsModal(false)}
        allAttachments={allAttachments}
        onSelectAttachment={(att) => {
          const isPdf =
            att.file?.type === 'application/pdf' ||
            att.file?.name.toLowerCase().endsWith('.pdf') ||
            isPdfAttachment(att.data, att.name);
          setViewerAttachment({
            name: att.name,
            data: att.data,
            isPdf,
          });
          setShowAllAttachmentsModal(false);
        }}
      />

      {/* Hidden checklist file input */}
      <input
        type="file"
        ref={checklistFileInputRef}
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleChecklistFileUpload}
      />
    </>,
    document.body
  );
};
