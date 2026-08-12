import type { Employee } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

export type ApiEmployee = Employee & { dbId?: string };

interface EmployeesPayload {
  employees: ApiEmployee[];
}

interface EmployeePayload {
  employee: ApiEmployee;
}

export interface CreateEmployeeAttachment {
  categoryId: keyof NonNullable<Employee['attachments']>;
  itemName: string;
  file: File;
}

export interface CreateEmployeePayload {
  employeeNumber: string;
  surname: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string;
  sex: Employee['sex'];
  maritalStatus: string;
  religion?: string;
  homeAddress: string;
  contactNumber: string;
  email: string;
  position: string;
  department: string;
  employmentDate: string;
  serviceDuration?: string;
  status: Employee['status'];
  educationLevel?: string;
  bachelorsDegree?: string;
  mastersStatus?: string;
  mastersDegreeName?: string;
  doctorateStatus?: string;
  functionalRate?: number;
  gasoline?: number;
  cashAdvance?: number;
  employeeShare?: number;
  checklist?: Employee['checklist'];
}

export const employeeService = {
  async listEmployees(): Promise<ApiEmployee[]> {
    const response = await apiRequest<ApiSuccessResponse<EmployeesPayload>>('/employees');
    return response.data.employees;
  },

  async createEmployee(params: {
    payload: CreateEmployeePayload;
    profilePicture?: File | null;
    attachments?: CreateEmployeeAttachment[];
  }): Promise<ApiEmployee> {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(params.payload));

    if (params.profilePicture) {
      formData.append('profilePicture', params.profilePicture);
    }

    const attachments = params.attachments ?? [];
    const documentLabels = attachments.map((item) => ({
      categoryId: item.categoryId,
      itemName: item.itemName,
    }));

    if (documentLabels.length > 0) {
      formData.append('documentLabels', JSON.stringify(documentLabels));
    }

    for (const attachment of attachments) {
      formData.append('documents', attachment.file);
    }

    const response = await apiRequest<ApiSuccessResponse<EmployeePayload>>('/employees', {
      method: 'POST',
      body: formData,
    });

    return response.data.employee;
  },
};
