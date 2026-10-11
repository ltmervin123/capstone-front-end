import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Save,
  X,
  RotateCcw,
  User,
  Briefcase,
  MapPin,
  GraduationCap,
  ClipboardCheck,
  Camera,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Coins,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Copy,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { DEPARTMENTS, type Employee } from '../../types/types';
import {
  type CreateEmployeeAttachment,
  type EmployeeDocumentLabel,
} from '../../services/employeeService';
import { ApiRequestError } from '../../utils/apiClient';
import { useCreateEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { createEmployeeFormSchema } from '../../schemas/employee.schema';
import { AnimatePresence, motion } from 'motion/react';

type ChecklistCategory = keyof NonNullable<Employee['checklist']>;
type AttachmentCategory = keyof NonNullable<Employee['attachments']>;

const EMPTY_CHECKLIST: NonNullable<Employee['checklist']> = {
  personalInfo: {},
  educational: {},
  employment: {},
  government: {},
  training: {},
  administrative: {},
};
const EMPTY_ATTACHMENTS: NonNullable<Employee['attachments']> = {
  personalInfo: {},
  educational: {},
  employment: {},
  government: {},
  training: {},
  administrative: {},
};

type EmployeeFormData = Omit<
  Employee,
  'updatedAt' | 'checklist' | 'attachments'
> & {
  checklist: NonNullable<Employee['checklist']>;
  attachments: NonNullable<Employee['attachments']>;
};

export interface EmployeeFormProps {
  employee: Employee | null;
  onCancel: () => void;
  onSuccess: (info?: {
    employeeNumber: string;
    name: string;
    isNew: boolean;
  }) => void;
  title?: string;
  isReadOnly?: boolean;
  initialDocumentFile?: {
    file: File;
    documentType: 'PDS' | 'RESUME' | 'CV' | 'BIODATA';
  } | null;
}

function isMetadataOnlyAttachment(value: string | undefined): boolean {
  return !!value && value.startsWith('meta:');
}
function isStoredAssetUrl(value: string | undefined): boolean {
  return (
    !!value &&
    (value.startsWith('/api/assets/') ||
      value.startsWith('http://') ||
      value.startsWith('https://'))
  );
}
function isPdfAttachment(
  value: string,
  name: string,
  isPdfHint?: boolean
): boolean {
  if (isPdfHint === true) return true;
  if (isPdfHint === false) return false;
  const lowerName = name.toLowerCase();
  const lowerValue = value.toLowerCase();
  if (value.startsWith('data:application/pdf')) return true;
  if (lowerName.endsWith('.pdf') || lowerValue.includes('.pdf')) return true;
  if (
    isStoredAssetUrl(value) &&
    (lowerValue.includes('.pdf') || lowerName.endsWith('.pdf'))
  )
    return true;
  if (value.startsWith('blob:')) {
    if (
      lowerName.includes('personal data sheet') ||
      lowerName.includes('bio data') ||
      lowerName.includes('resume') ||
      lowerName.includes('curriculum vitae') ||
      lowerName.includes('transcript of records') ||
      lowerName.includes('diploma') ||
      lowerName.includes('certificate') ||
      lowerName.includes('clearance') ||
      lowerName.includes('contract')
    ) {
      return true;
    }
  }
  return false;
}
function parseMetadataLabel(value: string): string {
  const raw = value.replace(/^meta:/, '');
  const [fileName, mimeType, size] = raw.split('|');
  const sizeLabel = size
    ? `${Math.round(Number(size) / 1024)} KB`
    : 'unknown size';
  return `${fileName || 'file'} (${mimeType || 'unknown type'}, ${sizeLabel}) — metadata only`;
}

// ─── Shared input & label tokens matching AdminDashboard style ────────────────
const inputCls =
  'w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold text-green-950 focus:bg-white focus:border-green-800 focus:ring-1 focus:ring-green-800 outline-none transition-all placeholder:text-stone-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-100';
const labelCls = 'block text-xs font-bold text-stone-700 mb-1.5';
const sectionHeadingCls =
  'flex items-center gap-2 pb-3 border-b border-stone-100 mb-4';

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onCancel,
  onSuccess,
  title,
  isReadOnly = false,
  initialDocumentFile = null,
}) => {
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isCreateMode =
    !employee || (title?.startsWith('New Employee Registration') ?? false);

  const initialCategoryItem =
    initialDocumentFile?.documentType === 'RESUME' ||
    initialDocumentFile?.documentType === 'CV'
      ? 'Updated Resume or Curriculum Vitae'
      : 'Personal Data Sheet / Bio Data';

  const initialChecklist = {
    ...EMPTY_CHECKLIST,
    ...(employee?.checklist ?? {}),
    ...(initialDocumentFile
      ? {
          personalInfo: {
            ...(employee?.checklist?.personalInfo ?? {}),
            [initialCategoryItem]: true,
          },
        }
      : {}),
  };

  const initialAttachments = {
    ...EMPTY_ATTACHMENTS,
    ...(employee?.attachments ?? {}),
    ...(initialDocumentFile
      ? {
          personalInfo: {
            ...(employee?.attachments?.personalInfo ?? {}),
            [initialCategoryItem]: URL.createObjectURL(
              initialDocumentFile.file
            ),
          },
        }
      : {}),
  };

  const initialAttachmentFilesState: Partial<
    Record<ChecklistCategory, Record<string, File>>
  > = initialDocumentFile
    ? {
        personalInfo: {
          [initialCategoryItem]: initialDocumentFile.file,
        },
      }
    : {};

  const initialData: EmployeeFormData = {
    id: employee?.id || '',
    surname: employee?.surname || '',
    firstName: employee?.firstName || '',
    middleName: employee?.middleName || '',
    dateOfBirth: employee?.dateOfBirth || '',
    sex: employee?.sex || 'Male',
    maritalStatus: employee?.maritalStatus || 'Single',
    religion: employee?.religion || '',
    homeAddress: employee?.homeAddress || '',
    contactNumber: employee?.contactNumber || '',
    email: employee?.email || '',
    position: employee?.position || '',
    department: employee?.department || '',
    serviceDuration: employee?.serviceDuration || '',
    employmentDate: employee?.employmentDate || '',
    bachelorsDegree: employee?.bachelorsDegree || '',
    mastersStatus: employee?.mastersStatus || 'Ongoing',
    doctorateStatus: employee?.doctorateStatus || 'Ongoing',
    mastersDegreeName: employee?.mastersDegreeName || '',
    educationLevel: employee?.educationLevel || '',
    status: employee?.status || 'Active',
    profilePicture: employee?.profilePicture || '',
    functionalRate:
      employee?.functionalRate !== undefined ? employee.functionalRate : 1500,
    gasoline: employee?.gasoline !== undefined ? employee.gasoline : 1000,
    cashAdvance: employee?.cashAdvance !== undefined ? employee.cashAdvance : 0,
    employeeShare:
      employee?.employeeShare !== undefined ? employee.employeeShare : 1200,
    checklist: initialChecklist,
    attachments: initialAttachments,
  };

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [createdSuccessInfo, setCreatedSuccessInfo] = useState<{
    employeeNumber: string;
    fullName: string;
    email: string;
    department: string;
    position: string;
    profilePicture?: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [viewerPopupBlocked, setViewerPopupBlocked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const checklistFileInputRef = useRef<HTMLInputElement>(null);
  const [activeChecklistPath, setActiveChecklistPath] = useState<{
    category: ChecklistCategory;
    item: string;
  } | null>(null);
  const [viewerAttachment, setViewerAttachment] = useState<{
    name: string;
    data: string;
    isPdf?: boolean;
  } | null>(null);
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

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldName ? null : prev));
      }, 2000);
    } catch {
      // fallback
    }
  };

  const copyAllCredentialsText = () => {
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
  };

  const handleFinishSuccess = () => {
    if (createdSuccessInfo) {
      onSuccess({
        employeeNumber: createdSuccessInfo.employeeNumber,
        name: createdSuccessInfo.fullName,
        isNew: true,
      });
    } else {
      onSuccess();
    }
  };

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
  }, [onCancel, createdSuccessInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setSubmitError(parsed.error.issues.map((i) => i.message).join(', '));
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
    } catch (error) {
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
  };

  const handleChecklistChange = (
    category: ChecklistCategory,
    item: string,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [category]: { ...prev.checklist[category], [item]: checked },
      },
    }));
  };

  const handleProfilePictureUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(
        'The selected profile picture exceeds the 5 MB limit. Please select an image under 5 MB.'
      );
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (formData.profilePicture?.startsWith('blob:'))
      URL.revokeObjectURL(formData.profilePicture);
    const previewUrl = URL.createObjectURL(file);
    setProfilePictureFile(file);
    setRemoveProfilePicture(false);
    setFormData((prev) => ({ ...prev, profilePicture: previewUrl }));
  };

  const handleChecklistFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
  };

  const triggerChecklistUpload = (
    category: ChecklistCategory,
    item: string
  ) => {
    setActiveChecklistPath({ category, item });
    setTimeout(() => {
      checklistFileInputRef.current?.click();
    }, 0);
  };

  const removeAttachment = (category: AttachmentCategory, item: string) => {
    const prev2 = formData.attachments?.[category]?.[item];
    if (prev2?.startsWith('blob:')) URL.revokeObjectURL(prev2);
    const originalStoredUrl = employee?.attachments?.[category]?.[item];
    if (isStoredAssetUrl(originalStoredUrl)) {
      setRemovedDocuments((prev) => {
        if (prev.some((d) => d.categoryId === category && d.itemName === item))
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
  };

  const checklistStructure = [
    {
      id: 'personalInfo' as const,
      title: 'A. Personal Information',
      items: [
        'Personal Data Sheet / Bio Data',
        'Updated Resume or Curriculum Vitae',
        'Birth Certificate (PSA Copy)',
        'Marriage Certificate (if applicable)',
        'Valid Government IDs',
        '2x2 or Passport Size ID Picture',
        'Emergency Contact Information',
      ],
    },
    {
      id: 'educational' as const,
      title: 'B. Educational Credentials',
      items: [
        'Diploma (College)',
        'Transcript of Records (TOR)',
        "Master's Degree Diploma / TOR (if applicable)",
        'Doctorate Degree Documents (if applicable)',
        'Professional License (PRC)',
        'Board Rating (if applicable)',
      ],
    },
    {
      id: 'employment' as const,
      title: 'C. Employment Documents',
      items: [
        'Application Letter',
        'Appointment Paper / Employment Contract',
        'Job Description',
        'Oath of Office (if applicable)',
        'Service Record',
      ],
    },
    {
      id: 'government' as const,
      title: 'D. Government Requirements',
      items: [
        'SSS Number / SSS ID',
        'PhilHealth Number / ID',
        'Pag-IBIG Number / MDF',
        'TIN / BIR Form',
        'NBI Clearance',
        'Police Clearance',
        'Medical Certificate / Health Clearance',
      ],
    },
    {
      id: 'training' as const,
      title: 'E. Training & Development',
      items: [
        'Certificates of Training',
        'Seminar Certificates',
        'Workshop Participation Certificates',
      ],
    },
    {
      id: 'administrative' as const,
      title: 'F. Administrative & Performance',
      items: [
        'Performance Evaluation Reports',
        'Promotion or Salary Adjustment Documents',
        'Commendations / Awards',
        'Disciplinary Records (if any)',
      ],
    },
  ];

  const getAllAttachments = () => {
    const result: Array<{
      categoryId: string;
      item: string;
      name: string;
      data: string;
      file?: File;
    }> = [];
    if (!formData.attachments) return result;
    checklistStructure.forEach((cat) => {
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
  };

  const allAttachments = getAllAttachments();
  const totalAttachments = allAttachments.length;

  const handleToggleAllChecklist = (checked: boolean) => {
    setFormData((prev) => {
      const next = { ...EMPTY_CHECKLIST, ...prev.checklist };
      checklistStructure.forEach((cat) => {
        cat.items.forEach((item) => {
          next[cat.id] = { ...next[cat.id], [item]: checked };
        });
      });
      return { ...prev, checklist: next };
    });
  };

  const handleToggleCategoryChecklist = (
    categoryId: ChecklistCategory,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const next = { ...EMPTY_CHECKLIST, ...prev.checklist };
      const catObj = checklistStructure.find((c) => c.id === categoryId);
      if (catObj)
        catObj.items.forEach((item) => {
          next[categoryId] = { ...next[categoryId], [item]: checked };
        });
      return { ...prev, checklist: next };
    });
  };

  const isCategoryFullyChecked = (categoryId: ChecklistCategory) => {
    const catObj = checklistStructure.find((c) => c.id === categoryId);
    if (!catObj) return false;
    return catObj.items.every(
      (item) => formData.checklist[categoryId]?.[item] || false
    );
  };

  const getChecklistStats = () => {
    let total = 0;
    let checked = 0;
    checklistStructure.forEach((cat) => {
      cat.items.forEach((item) => {
        total++;
        if (formData.checklist?.[cat.id]?.[item]) checked++;
      });
    });
    return { total, checked };
  };

  const { total: totalItems, checked: checkedItems } = getChecklistStats();
  const isAllChecked = totalItems > 0 && checkedItems === totalItems;

  const handleClear = () => {
    setShowResetConfirm(true);
  };

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

  // ─── Icon for the modal header ─────────────────────────────────────────────
  const HeaderIcon = isReadOnly ? Eye : isCreateMode ? User : User;
  const headerIconBg = isReadOnly
    ? 'bg-blue-50 text-blue-800'
    : 'bg-emerald-50 text-emerald-800';

  return createPortal(
    <>
      {/* ====================================================================
          MAIN EMPLOYEE FORM MODAL
          ==================================================================== */}
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
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3
                    id="registrationSuccessTitle"
                    className="font-bold text-green-950 text-base"
                  >
                    Employee Registration Successful
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Profile recorded and portal access credentials generated
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFinishSuccess}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
              {/* Celebration Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white rounded-2xl border border-emerald-200/80 shadow-xs">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm ring-4 ring-emerald-100 shrink-0">
                  <CheckCircle2 size={28} />
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h4 className="font-extrabold text-base text-emerald-950">
                    New Employee Successfully Registered!
                  </h4>
                  <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                    The record for{' '}
                    <span className="font-bold text-emerald-950">
                      {createdSuccessInfo.fullName}
                    </span>{' '}
                    has been saved to the directory. Provide the temporary login
                    credentials below to the employee.
                  </p>
                </div>
              </div>

              {/* Employee Summary Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-4">
                {createdSuccessInfo.profilePicture ? (
                  <img
                    src={createdSuccessInfo.profilePicture}
                    alt=""
                    className="w-13 h-13 rounded-2xl object-cover shadow-xs border border-stone-200 shrink-0"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-green-900 text-amber-300 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    {createdSuccessInfo.fullName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="font-bold text-sm text-green-950 truncate">
                      {createdSuccessInfo.fullName}
                    </h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-100 text-green-900 border border-green-200">
                      {createdSuccessInfo.employeeNumber}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 font-medium truncate">
                    {createdSuccessInfo.position} ·{' '}
                    {createdSuccessInfo.department}
                  </p>
                </div>
              </div>

              {/* Credentials Card */}
              <div className="bg-stone-900 rounded-2xl border border-stone-800 text-white overflow-hidden shadow-lg">
                <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-200">
                      Generated Portal Login Credentials
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold rounded-full">
                    Active Login
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Sign-in Email */}
                  <div className="bg-stone-800/70 rounded-xl p-3 border border-stone-700/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Sign-in Email (Username)
                      </span>
                      <span className="text-xs font-semibold text-stone-100 truncate block mt-0.5 select-all font-mono">
                        {createdSuccessInfo.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(createdSuccessInfo.email, 'email')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Default Password */}
                  <div className="bg-stone-800/70 rounded-xl p-3 border border-stone-700/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          Temporary Default Password
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="text-stone-400 hover:text-stone-200 transition-colors p-0.5 cursor-pointer"
                          title={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-stone-100 truncate block mt-0.5 select-all font-mono">
                        {showPassword
                          ? createdSuccessInfo.email
                          : '••••••••••••••••'}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">
                        Default password is set to the employee's email.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(createdSuccessInfo.email, 'password')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Portal Link */}
                  <div className="bg-stone-800/70 rounded-xl p-3 border border-stone-700/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Portal Login URL
                      </span>
                      <span className="text-xs font-semibold text-stone-100 truncate block mt-0.5 select-all font-mono">
                        {window.location.origin}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(window.location.origin, 'url')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                      title="Copy URL"
                    >
                      {copiedField === 'url' ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Copy Full Credentials Packet Button */}
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopy(copyAllCredentialsText(), 'all')
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {copiedField === 'all' ? (
                      <>
                        <Check size={14} className="text-stone-950" />
                        <span>Credentials Packet Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Full Welcome &amp; Credentials Details</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Guidance Callout */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                <AlertCircle
                  size={16}
                  className="text-amber-700 shrink-0 mt-0.5"
                />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Security Guidance: </span>
                  Please advise{' '}
                  <span className="font-semibold">
                    {createdSuccessInfo.fullName}
                  </span>{' '}
                  to sign in and immediately update their temporary password
                  under Account Settings for compliance with school policy.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleFinishSuccess}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Check size={14} />
                <span>Done &amp; View Directory</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-white rounded-2xl border border-stone-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* ── Modal Header ──────────────────────────────────────────────── */}
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
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Scrollable Form Body ──────────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div
                ref={scrollContainerRef}
                className="p-6 overflow-y-auto space-y-8 flex-1 min-h-0"
              >
                {/* AI Extraction Review Banner */}
                {initialDocumentFile && (
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
                          . Review the extracted fields below and make any
                          needed adjustments.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const item =
                          initialDocumentFile.documentType === 'RESUME' ||
                          initialDocumentFile.documentType === 'CV'
                            ? 'Updated Resume or Curriculum Vitae'
                            : 'Personal Data Sheet / Bio Data';
                        const data = formData.attachments?.personalInfo?.[item];
                        if (data) {
                          setViewerAttachment({
                            name: `${item} (${initialDocumentFile.file.name})`,
                            data,
                            isPdf: true,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      <Eye size={13} />
                      <span>Preview Uploaded Document</span>
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {submitError && (
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
                          {submitError}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                      aria-label="Dismiss error"
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                )}

                {/* ── SECTION 1: Personal Identification ──────────────────── */}
                <section className="space-y-5">
                  <div className={sectionHeadingCls}>
                    <User size={16} className="text-emerald-700 shrink-0" />
                    <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
                      Personal Identification
                    </h4>
                  </div>

                  {/* Profile photo + identity fields */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Photo upload */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <label className={labelCls}>Employee Photo</label>
                      <div
                        className={`relative group w-28 h-28 rounded-2xl overflow-hidden bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center transition-all ${
                          isReadOnly
                            ? 'cursor-not-allowed opacity-75'
                            : 'cursor-pointer hover:border-green-700'
                        }`}
                        onClick={() => {
                          if (!isReadOnly) fileInputRef.current?.click();
                        }}
                      >
                        {formData.profilePicture ? (
                          <>
                            <img
                              src={formData.profilePicture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                            {!isReadOnly && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="text-white" size={24} />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Camera
                              className="text-stone-300 group-hover:text-emerald-600 transition-colors"
                              size={32}
                            />
                            <span className="text-[9px] font-bold text-stone-400 uppercase mt-1.5">
                              {isReadOnly ? 'No photo' : 'Upload'}
                            </span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        disabled={isReadOnly}
                        onChange={handleProfilePictureUpload}
                      />
                      {formData.profilePicture && !isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.profilePicture?.startsWith('blob:'))
                              URL.revokeObjectURL(formData.profilePicture);
                            setProfilePictureFile(null);
                            setRemoveProfilePicture(
                              isStoredAssetUrl(employee?.profilePicture)
                            );
                            setFormData((p) => ({ ...p, profilePicture: '' }));
                          }}
                          className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>

                    {/* Identity fields */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Employee ID</label>
                          <input
                            type="text"
                            required
                            disabled={isReadOnly}
                            value={formData.id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                id: e.target.value.toUpperCase(),
                              })
                            }
                            className={inputCls}
                            placeholder="EMP-000"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Employment Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value as Employee['status'],
                              })
                            }
                            className={inputCls}
                            disabled={isReadOnly}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Retired">Retired</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Surname</label>
                          <input
                            type="text"
                            required
                            value={formData.surname}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                surname: e.target.value,
                              })
                            }
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>First Name</label>
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                firstName: e.target.value,
                              })
                            }
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Middle Name</label>
                          <input
                            type="text"
                            value={formData.middleName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                middleName: e.target.value,
                              })
                            }
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Biographical grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Sex</label>
                      <select
                        value={formData.sex}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sex: e.target.value as Employee['sex'],
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Marital Status</label>
                      <select
                        value={formData.maritalStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maritalStatus: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Religion</label>
                      <input
                        type="text"
                        value={formData.religion}
                        onChange={(e) =>
                          setFormData({ ...formData, religion: e.target.value })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. Catholic"
                      />
                    </div>
                  </div>
                </section>

                {/* ── SECTION 2: Contact Information ───────────────────────── */}
                <section className="space-y-4">
                  <div className={sectionHeadingCls}>
                    <MapPin size={16} className="text-emerald-700 shrink-0" />
                    <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
                      Contact Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className={labelCls}>Home Address</label>
                      <input
                        type="text"
                        required
                        value={formData.homeAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            homeAddress: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="House No., Street, Barangay, City"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Contact Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactNumber: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="09xx xxx xxxx"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </section>

                {/* ── SECTION 3: Employment Details ─────────────────────────── */}
                <section className="space-y-4">
                  <div className={sectionHeadingCls}>
                    <Briefcase
                      size={16}
                      className="text-emerald-700 shrink-0"
                    />
                    <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
                      Employment Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Position / Job Title</label>
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className={inputCls}
                        required
                        disabled={isReadOnly}
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Date of Employment</label>
                      <input
                        type="date"
                        required
                        value={formData.employmentDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employmentDate: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Years of Service</label>
                      <input
                        type="text"
                        value={formData.serviceDuration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceDuration: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. 5 years"
                      />
                    </div>
                  </div>
                </section>

                {/* ── SECTION 4: Compensation ────────────────────────────────── */}
                <section className="space-y-4">
                  <div className={sectionHeadingCls}>
                    <Coins size={16} className="text-emerald-700 shrink-0" />
                    <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
                      Compensation Settings
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelCls}>
                        Daily Functional Rate (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.functionalRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            functionalRate: Number(e.target.value),
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="1500"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Gasoline Allowance (₱)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.gasoline}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gasoline: Number(e.target.value),
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Cash Advance (₱)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.cashAdvance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cashAdvance: Number(e.target.value),
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Employee Share (₱)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.employeeShare}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employeeShare: Number(e.target.value),
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="1200"
                      />
                    </div>
                  </div>
                </section>

                {/* ── SECTION 5: Educational Attainment ─────────────────────── */}
                <section className="space-y-4">
                  <div className={sectionHeadingCls}>
                    <GraduationCap
                      size={16}
                      className="text-emerald-700 shrink-0"
                    />
                    <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
                      Educational Attainment
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Education Level</label>
                      <select
                        value={formData.educationLevel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            educationLevel: e.target.value,
                          })
                        }
                        className={inputCls}
                        required
                        disabled={isReadOnly}
                      >
                        <option value="">Select Level</option>
                        <option value="Elementary">Elementary</option>
                        <option value="High School">High School</option>
                        <option value="Senior High School">
                          Senior High School
                        </option>
                        <option value="College">College</option>
                        <option value="Post Graduate">Post Graduate</option>
                        <option value="Vocational">Vocational</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Bachelor's Degree</label>
                      <select
                        value={formData.bachelorsDegree}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bachelorsDegree: e.target.value,
                          })
                        }
                        className={inputCls}
                        required
                        disabled={isReadOnly}
                      >
                        <option value="">Select Degree</option>
                        <option value="BEED">BEED</option>
                        <option value="BSCRIM">BSCRIM</option>
                        <option value="BSIT">BSIT</option>
                        <option value="BSBA MM">BSBA MM</option>
                        <option value="BSBA HRDM">BSBA HRDM</option>
                        <option value="BSBA FINANCE">BSBA FINANCE</option>
                        <option value="BS NURSING">BS NURSING</option>
                        <option value="BS COMPUTER SCIENCE">
                          BS COMPUTER SCIENCE
                        </option>
                        <option value="BS HRM">BS HRM</option>
                        <option value="BPEd">BPEd</option>
                        <option value="AB GUIDANCE COUNSELOR">
                          AB GUIDANCE COUNSELOR
                        </option>
                        <option value="AB POL. SCI">AB POL. SCI</option>
                        <option value="BSED ENGLISH">BSED ENGLISH</option>
                        <option value="BSED FILIPINO">BSED FILIPINO</option>
                        <option value="BSED MATHEMATICS">
                          BSED MATHEMATICS
                        </option>
                        <option value="BS PSYCHOLOGY">BS PSYCHOLOGY</option>
                        <option value="AB PSYCHOLOGY">AB PSYCHOLOGY</option>
                        <option value="BS BIOLOGY">BS BIOLOGY</option>
                        <option value="BS ACCOUNTANCY">BS ACCOUNTANCY</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Master's Degree</label>
                      <input
                        type="text"
                        value={formData.mastersDegreeName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mastersDegreeName: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. MA in Educational Management"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Master's Status</label>
                      <select
                        value={formData.mastersStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mastersStatus: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      >
                        <option value="Ongoing">Ongoing</option>
                        <option value="Graduating">Graduating</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Discontinue">Discontinued</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Doctorate Status</label>
                      <select
                        value={formData.doctorateStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            doctorateStatus: e.target.value,
                          })
                        }
                        className={inputCls}
                        disabled={isReadOnly}
                      >
                        <option value="Ongoing">Ongoing</option>
                        <option value="Graduating">Graduating</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Discontinue">Discontinued</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* ── SECTION 6: Form 201 Checklist ─────────────────────────── */}
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck
                        size={16}
                        className="text-emerald-700 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">
                          Form 201 Checklist
                        </h4>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          Employee Personnel File — {checkedItems}/{totalItems}{' '}
                          items confirmed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {totalAttachments > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllAttachmentsModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          <FileText size={13} />
                          View Files ({totalAttachments})
                        </button>
                      )}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleAllChecklist(!isAllChecked)
                          }
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {checklistStructure.map((category) => {
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
                                  handleToggleCategoryChecklist(
                                    category.id,
                                    !isCatChecked
                                  )
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
                                formData.checklist?.[category.id]?.[item] ||
                                false;
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
                                        handleChecklistChange(
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
                                        onClick={() => {
                                          const data =
                                            formData.attachments?.[
                                              category.id
                                            ]?.[item];
                                          const file =
                                            attachmentFiles[category.id]?.[
                                              item
                                            ];
                                          const isPdf =
                                            file?.type === 'application/pdf' ||
                                            file?.name
                                              .toLowerCase()
                                              .endsWith('.pdf') ||
                                            (data
                                              ? isPdfAttachment(data, item)
                                              : false);

                                          if (data)
                                            setViewerAttachment({
                                              name: file?.name
                                                ? `${item} (${file.name})`
                                                : item,
                                              data,
                                              isPdf,
                                            });
                                        }}
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
                                            triggerChecklistUpload(
                                              category.id,
                                              item
                                            )
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
                                              removeAttachment(
                                                category.id,
                                                item
                                              )
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
              </div>

              {/* ── Modal Footer ───────────────────────────────────────────── */}
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex flex-col-reverse sm:flex-row gap-2.5 justify-end shrink-0">
                {isReadOnly ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <Check size={13} />
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
                      onClick={handleClear}
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

      {/* ====================================================================
          RESET FORM CONFIRMATION MODAL
          ==================================================================== */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs !m-0"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200/60 shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Reset All Form Fields?
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    This will revert all fields and attachments to their initial
                    values.
                  </p>
                </div>
              </div>
              <p className="text-xs text-stone-600 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60 leading-relaxed">
                Are you sure you want to discard your changes? Any unsaved edits
                and newly uploaded documents will be lost.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialData);
                    setProfilePictureFile(null);
                    setRemoveProfilePicture(false);
                    setAttachmentFiles({});
                    setRemovedDocuments([]);
                    setSubmitError(null);
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Yes, Reset Form
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          ATTACHMENT DOCUMENT VIEWER (nested modal)
          ==================================================================== */}
      <AnimatePresence>
        {viewerAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md !m-0"
            onClick={() => setViewerAttachment(null)}
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
                  onClick={() => setViewerAttachment(null)}
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
                            setViewerPopupBlocked(true);
                          } else {
                            setViewerPopupBlocked(false);
                          }
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:underline transition-colors"
                      >
                        Open in new tab →
                      </button>
                      {viewerPopupBlocked && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg mt-1 inline-block">
                          Pop-up was blocked by browser. Please allow pop-ups
                          for this site or right-click to open.
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

      {/* ====================================================================
          ALL ATTACHMENTS LIST MODAL (nested modal)
          ==================================================================== */}
      <AnimatePresence>
        {showAllAttachmentsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md !m-0"
            onClick={() => setShowAllAttachmentsModal(false)}
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
                  onClick={() => setShowAllAttachmentsModal(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close file list"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {allAttachments.map((att, i) => {
                  const catObj = checklistStructure.find(
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
                        onClick={() => {
                          setViewerAttachment({
                            name: att.name,
                            data: att.data,
                            isPdf,
                          });
                          setShowAllAttachmentsModal(false);
                        }}
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
                  onClick={() => setShowAllAttachmentsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
