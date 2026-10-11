import type { Employee } from '../../../types/types';
import type { ExtractedEmployeeDocumentData } from '../../../services/employeeService';
import { EMPTY_ATTACHMENTS, EMPTY_CHECKLIST } from './constants';
import type {
  ChecklistCategory,
  EmployeeFormData,
  InitialDocumentFile,
} from './types';

export function isMetadataOnlyAttachment(value: string | undefined): boolean {
  return !!value && value.startsWith('meta:');
}

export function isStoredAssetUrl(value: string | undefined): boolean {
  return (
    !!value &&
    (value.startsWith('/api/assets/') ||
      value.startsWith('http://') ||
      value.startsWith('https://'))
  );
}

export function isPdfAttachment(
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

export function parseMetadataLabel(value: string): string {
  const raw = value.replace(/^meta:/, '');
  const [fileName, mimeType, size] = raw.split('|');
  const sizeLabel = size
    ? `${Math.round(Number(size) / 1024)} KB`
    : 'unknown size';
  return `${fileName || 'file'} (${mimeType || 'unknown type'}, ${sizeLabel}) — metadata only`;
}

export function getInitialChecklistItem(documentType?: string): string {
  return documentType === 'RESUME' || documentType === 'CV'
    ? 'Updated Resume or Curriculum Vitae'
    : 'Personal Data Sheet / Bio Data';
}

export function buildInitialEmployeeFormData(
  employee: Employee | null,
  initialDocumentFile?: InitialDocumentFile | null
): EmployeeFormData {
  const initialCategoryItem = getInitialChecklistItem(
    initialDocumentFile?.documentType
  );

  const initialChecklist: NonNullable<Employee['checklist']> = {
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

  const initialAttachments: NonNullable<Employee['attachments']> = {
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

  return {
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
}

export function buildInitialAttachmentFiles(
  initialDocumentFile?: InitialDocumentFile | null
): Partial<Record<ChecklistCategory, Record<string, File>>> {
  if (!initialDocumentFile) return {};
  const initialCategoryItem = getInitialChecklistItem(
    initialDocumentFile.documentType
  );
  return {
    personalInfo: {
      [initialCategoryItem]: initialDocumentFile.file,
    },
  };
}

export function buildDraftEmployeeFromExtractedData(
  parsed: ExtractedEmployeeDocumentData
): Employee {
  return {
    id: '',
    surname: parsed.surname || '',
    firstName: parsed.firstName || '',
    middleName: parsed.middleName || '',
    dateOfBirth: parsed.dateOfBirth || '',
    sex:
      parsed.sex === 'Male' || parsed.sex === 'Female' || parsed.sex === 'Other'
        ? parsed.sex
        : 'Male',
    maritalStatus: parsed.maritalStatus || 'Single',
    religion: parsed.religion || '',
    homeAddress: parsed.homeAddress || '',
    contactNumber: parsed.contactNumber || '',
    email: parsed.email || '',
    position: parsed.position || '',
    department: parsed.department || '',
    serviceDuration: parsed.serviceDuration || '',
    employmentDate:
      parsed.employmentDate || new Date().toISOString().slice(0, 10),
    bachelorsDegree: parsed.bachelorsDegree || '',
    mastersStatus: parsed.mastersStatus || 'Ongoing',
    doctorateStatus: parsed.doctorateStatus || 'Ongoing',
    mastersDegreeName: parsed.mastersDegreeName || '',
    educationLevel: parsed.educationLevel || '',
    status: 'Active',
    checklist: {
      personalInfo: {},
      educational: {},
      employment: {},
      government: {},
      training: {},
      administrative: {},
    },
    attachments: {
      personalInfo: {},
      educational: {},
      employment: {},
      government: {},
      training: {},
      administrative: {},
    },
    functionalRate: 1500,
    gasoline: 1000,
    cashAdvance: 0,
    employeeShare: 1200,
    updatedAt: Date.now(),
  };
}
