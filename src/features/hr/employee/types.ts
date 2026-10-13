import type { Employee } from '../../../types/types';

export type ChecklistCategory = keyof NonNullable<Employee['checklist']>;
export type AttachmentCategory = keyof NonNullable<Employee['attachments']>;

export type EmployeeFormData = Omit<
  Employee,
  'updatedAt' | 'checklist' | 'attachments'
> & {
  checklist: NonNullable<Employee['checklist']>;
  attachments: NonNullable<Employee['attachments']>;
};

export interface CreatedSuccessInfo {
  employeeNumber: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  profilePicture?: string;
}

export interface ViewerAttachment {
  name: string;
  data: string;
  isPdf?: boolean;
}

export interface ChecklistCategoryConfig {
  id: ChecklistCategory;
  title: string;
  items: string[];
}

export interface AttachmentItem {
  categoryId: string;
  item: string;
  name: string;
  data: string;
  file?: File;
}

export interface InitialDocumentFile {
  file: File;
  documentType: 'PDS' | 'RESUME' | 'CV' | 'BIODATA';
}

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
  initialDocumentFile?: InitialDocumentFile | null;
  onPromote?: (emp: Employee) => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export type EmployeeTabType = 'directory' | 'logs';
