import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Employee } from '../../../../types/types';
import {
  type CreateEmployeeAttachment,
  type EmployeeDocumentLabel,
} from '../../../../services/employeeService';
import { ApiRequestError } from '../../../../utils/apiClient';
import { useCreateEmployee, useUpdateEmployee } from '../../../../hooks/useEmployees';
import { createEmployeeFormSchema } from '../../../../schemas/employee.schema';
import {
  CHECKLIST_STRUCTURE,
  EMPTY_CHECKLIST,
} from '../constants';
import {
  buildInitialAttachmentFiles,
  buildInitialEmployeeFormData,
  isPdfAttachment,
  isStoredAssetUrl,
} from '../utils';
import type {
  AttachmentCategory,
  AttachmentItem,
  ChecklistCategory,
  CreatedSuccessInfo,
  EmployeeFormData,
  InitialDocumentFile,
  ViewerAttachment,
} from '../types';

interface UseEmployeeFormParams {
  employee: Employee | null;
  onCancel: () => void;
  onSuccess: (info?: {
    employeeNumber: string;
    name: string;
    isNew: boolean;
  }) => void;
  title?: string;
  initialDocumentFile?: InitialDocumentFile | null;
}

export function useEmployeeForm({
  employee,
  onCancel,
  onSuccess,
  title,
  initialDocumentFile = null,
}: UseEmployeeFormParams) {
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  const isCreateMode =
    !employee || (title?.startsWith('New Employee Registration') ?? false);

  const initialData = useMemo(
    () => buildInitialEmployeeFormData(employee, initialDocumentFile),
    [employee, initialDocumentFile]
  );

  const initialAttachmentFilesState = useMemo(
    () => buildInitialAttachmentFiles(initialDocumentFile),
    [initialDocumentFile]
  );

  const [formData, setFormData] = useState<EmployeeFormData>(initialData);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<
    Partial<Record<ChecklistCategory, Record<string, File>>>
  >(initialAttachmentFilesState);
  const [removedDocuments, setRemovedDocuments] = useState<
    EmployeeDocumentLabel[]
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdSuccessInfo, setCreatedSuccessInfo] =
    useState<CreatedSuccessInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [viewerPopupBlocked, setViewerPopupBlocked] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checklistFileInputRef = useRef<HTMLInputElement>(null);

  const [activeChecklistPath, setActiveChecklistPath] = useState<{
    category: ChecklistCategory;
    item: string;
  } | null>(null);
  const [viewerAttachment, setViewerAttachment] =
    useState<ViewerAttachment | null>(null);
  const [showAllAttachmentsModal, setShowAllAttachmentsModal] = useState(false);

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;

  // Lock body scroll while modal is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleCopy = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldName ? null : prev));
      }, 2000);
    } catch {
      // fallback
    }
  }, []);

  const copyAllCredentialsText = useCallback(() => {
    if (!createdSuccessInfo) return '';
    const portalUrl = window.location.origin;
    return `Northern Mindanao Colleges, Inc.
Official Employee Portal Login

Employee Name: ${createdSuccessInfo.fullName}
Employee ID: ${createdSuccessInfo.employeeNumber}
Department: ${createdSuccessInfo.department}
Position: ${createdSuccessInfo.position}

Portal Login URL: ${portalUrl}
Sign-in Email: ${createdSuccessInfo.email}
Temporary Password: ${createdSuccessInfo.email}

Notice: For account security, please sign in and change your temporary password under Account Settings upon your first visit.`;
  }, [createdSuccessInfo]);

  const handleFinishSuccess = useCallback(() => {
    if (createdSuccessInfo) {
      onSuccess({
        employeeNumber: createdSuccessInfo.employeeNumber,
        name: createdSuccessInfo.fullName,
        isNew: true,
      });
    } else {
      onSuccess();
    }
  }, [createdSuccessInfo, onSuccess]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (createdSuccessInfo) {
          handleFinishSuccess();
        } else {
          onCancel();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, createdSuccessInfo, handleFinishSuccess]);

  const updateField = useCallback(
    <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleProfilePictureUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError(
          'The selected profile picture exceeds the 5 MB limit. Please select an image under 5 MB.'
        );
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (formData.profilePicture?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.profilePicture);
      }
      const previewUrl = URL.createObjectURL(file);
      setProfilePictureFile(file);
      setRemoveProfilePicture(false);
      setFormData((prev) => ({ ...prev, profilePicture: previewUrl }));
    },
    [formData.profilePicture]
  );

  const handleRemoveProfilePicture = useCallback(() => {
    if (formData.profilePicture?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.profilePicture);
    }
    setProfilePictureFile(null);
    setRemoveProfilePicture(isStoredAssetUrl(employee?.profilePicture));
    setFormData((prev) => ({ ...prev, profilePicture: '' }));
  }, [employee?.profilePicture, formData.profilePicture]);

  const handleChecklistChange = useCallback(
    (category: ChecklistCategory, item: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        checklist: {
          ...prev.checklist,
          [category]: { ...prev.checklist[category], [item]: checked },
        },
      }));
    },
    []
  );

  const handleChecklistFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeChecklistPath) {
        const { category, item } = activeChecklistPath;
        if (file.size > 5 * 1024 * 1024) {
          setSubmitError(
            'The selected attachment exceeds the 5 MB limit. Please select a document under 5 MB.'
          );
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const prev2 = formData.attachments?.[category]?.[item];
        if (prev2?.startsWith('blob:')) URL.revokeObjectURL(prev2);
        const previewUrl = URL.createObjectURL(file);
        setRemovedDocuments((prev) =>
          prev.filter((d) => !(d.categoryId === category && d.itemName === item))
        );
        setAttachmentFiles((prev) => ({
          ...prev,
          [category]: { ...(prev[category] ?? {}), [item]: file },
        }));
        setFormData((prev) => ({
          ...prev,
          checklist: {
            ...prev.checklist,
            [category]: { ...prev.checklist[category], [item]: true },
          },
          attachments: {
            ...prev.attachments,
            [category]: { ...prev.attachments[category], [item]: previewUrl },
          },
        }));
      }
      e.target.value = '';
    },
    [activeChecklistPath, formData.attachments]
  );

  const triggerChecklistUpload = useCallback(
    (category: ChecklistCategory, item: string) => {
      setActiveChecklistPath({ category, item });
      setTimeout(() => {
        checklistFileInputRef.current?.click();
      }, 0);
    },
    []
  );

  const removeAttachment = useCallback(
    (category: AttachmentCategory, item: string) => {
      const prev2 = formData.attachments?.[category]?.[item];
      if (prev2?.startsWith('blob:')) URL.revokeObjectURL(prev2);
      const originalStoredUrl = employee?.attachments?.[category]?.[item];
      if (isStoredAssetUrl(originalStoredUrl)) {
        setRemovedDocuments((prev) => {
          if (
            prev.some((d) => d.categoryId === category && d.itemName === item)
          )
            return prev;
          return [...prev, { categoryId: category, itemName: item }];
        });
      }
      setAttachmentFiles((prev) => {
        const next = { ...(prev[category] ?? {}) };
        delete next[item];
        return { ...prev, [category]: next };
      });
      setFormData((prev) => {
        const nextCat: Record<string, string> = {
          ...(prev.attachments[category] ?? {}),
        };
        delete nextCat[item];
        return {
          ...prev,
          attachments: { ...prev.attachments, [category]: nextCat },
        };
      });
    },
    [employee?.attachments, formData.attachments]
  );

  const allAttachments: AttachmentItem[] = useMemo(() => {
    const result: AttachmentItem[] = [];
    if (!formData.attachments) return result;
    CHECKLIST_STRUCTURE.forEach((cat) => {
      cat.items.forEach((item) => {
        const data = formData.attachments?.[cat.id]?.[item];
        const file = attachmentFiles[cat.id as ChecklistCategory]?.[item];
        if (data)
          result.push({
            categoryId: cat.id,
            item,
            name: file?.name ? `${item} (${file.name})` : item,
            data,
            file,
          });
      });
    });
    return result;
  }, [attachmentFiles, formData.attachments]);

  const handleToggleAllChecklist = useCallback((checked: boolean) => {
    setFormData((prev) => {
      const next = { ...EMPTY_CHECKLIST, ...prev.checklist };
      CHECKLIST_STRUCTURE.forEach((cat) => {
        cat.items.forEach((item) => {
          next[cat.id] = { ...next[cat.id], [item]: checked };
        });
      });
      return { ...prev, checklist: next };
    });
  }, []);

  const handleToggleCategoryChecklist = useCallback(
    (categoryId: ChecklistCategory, checked: boolean) => {
      setFormData((prev) => {
        const next = { ...EMPTY_CHECKLIST, ...prev.checklist };
        const catObj = CHECKLIST_STRUCTURE.find((c) => c.id === categoryId);
        if (catObj)
          catObj.items.forEach((item) => {
            next[categoryId] = { ...next[categoryId], [item]: checked };
          });
        return { ...prev, checklist: next };
      });
    },
    []
  );

  const isCategoryFullyChecked = useCallback(
    (categoryId: ChecklistCategory) => {
      const catObj = CHECKLIST_STRUCTURE.find((c) => c.id === categoryId);
      if (!catObj) return false;
      return catObj.items.every(
        (item) => formData.checklist[categoryId]?.[item] || false
      );
    },
    [formData.checklist]
  );

  const checklistStats = useMemo(() => {
    let total = 0;
    let checked = 0;
    CHECKLIST_STRUCTURE.forEach((cat) => {
      cat.items.forEach((item) => {
        total++;
        if (formData.checklist?.[cat.id]?.[item]) checked++;
      });
    });
    return { total, checked };
  }, [formData.checklist]);

  const isAllChecked =
    checklistStats.total > 0 && checklistStats.checked === checklistStats.total;

  const handleResetConfirm = useCallback(() => {
    setFormData(initialData);
    setProfilePictureFile(null);
    setRemoveProfilePicture(false);
    setAttachmentFiles({});
    setRemovedDocuments([]);
    setSubmitError(null);
    setShowResetConfirm(false);
  }, [initialData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      const parsed = createEmployeeFormSchema.safeParse({
        employeeNumber: formData.id,
        surname: formData.surname,
        firstName: formData.firstName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        sex: formData.sex,
        maritalStatus: formData.maritalStatus,
        religion: formData.religion,
        homeAddress: formData.homeAddress,
        contactNumber: formData.contactNumber,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        employmentDate: formData.employmentDate,
        serviceDuration: formData.serviceDuration,
        status: formData.status,
        educationLevel: formData.educationLevel,
        bachelorsDegree: formData.bachelorsDegree,
        mastersStatus: formData.mastersStatus,
        mastersDegreeName: formData.mastersDegreeName,
        doctorateStatus: formData.doctorateStatus,
        functionalRate: formData.functionalRate,
        gasoline: formData.gasoline,
        cashAdvance: formData.cashAdvance,
        employeeShare: formData.employeeShare,
        checklist: formData.checklist,
      });

      if (!parsed.success) {
        const issues = parsed.error.issues as Array<{ message: string }>;
        setSubmitError(issues.map((i) => i.message).join(', '));
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const attachments: CreateEmployeeAttachment[] = [];
      (Object.keys(attachmentFiles) as ChecklistCategory[]).forEach(
        (categoryId) => {
          const categoryFiles = attachmentFiles[categoryId] ?? {};
          Object.entries(categoryFiles).forEach(([itemName, file]) => {
            attachments.push({ categoryId, itemName, file });
          });
        }
      );

      const replacementKeys = new Set(
        attachments.map((a) => `${a.categoryId}::${a.itemName}`)
      );
      const documentsToRemove = removedDocuments.filter(
        (doc) => !replacementKeys.has(`${doc.categoryId}::${doc.itemName}`)
      );

      try {
        if (isCreateMode) {
          await createEmployee.mutateAsync({
            payload: parsed.data,
            profilePicture: profilePictureFile,
            attachments,
          });
          setCreatedSuccessInfo({
            employeeNumber: parsed.data.employeeNumber,
            fullName: `${parsed.data.firstName} ${parsed.data.surname}`,
            email: parsed.data.email,
            department: parsed.data.department,
            position: parsed.data.position,
            profilePicture: formData.profilePicture,
          });
        } else {
          await updateEmployee.mutateAsync({
            employeeNumber: parsed.data.employeeNumber,
            payload: parsed.data,
            profilePicture: profilePictureFile,
            attachments,
            removeProfilePicture: removeProfilePicture && !profilePictureFile,
            removedDocuments: documentsToRemove,
          });
          onSuccess({
            employeeNumber: parsed.data.employeeNumber,
            name: `${parsed.data.firstName} ${parsed.data.surname}`,
            isNew: false,
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof ApiRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : isCreateMode
                ? 'Failed to create employee record.'
                : 'Failed to update employee record.';
        setSubmitError(message);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [
      attachmentFiles,
      createEmployee,
      formData,
      isCreateMode,
      onSuccess,
      profilePictureFile,
      removeProfilePicture,
      removedDocuments,
      updateEmployee,
    ]
  );

  return {
    formData,
    setFormData,
    updateField,
    isCreateMode,
    isSubmitting,
    submitError,
    setSubmitError,
    scrollContainerRef,
    fileInputRef,
    checklistFileInputRef,
    profilePictureFile,
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
    // Helpers
    isPdfAttachment,
  };
}
