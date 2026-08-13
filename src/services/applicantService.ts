import type { Applicant, ApplicantStatus } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

interface ApplicantListPayload {
  applicants: Applicant[];
}

interface ApplicantPayload {
  applicant: Applicant;
}

export interface ApplicantPayloadInput {
  name: string;
  email: string;
  phone: string;
  position: string;
  department?: string;
  status: ApplicantStatus;
  appliedDate: string;
  resumeUrl?: string;
  notes?: string;
}

export const applicantService = {
  async listApplicants(): Promise<Applicant[]> {
    const response = await apiRequest<ApiSuccessResponse<ApplicantListPayload>>('/applicants');
    return response.data.applicants;
  },

  async createApplicant(payload: ApplicantPayloadInput): Promise<Applicant> {
    const response = await apiRequest<ApiSuccessResponse<ApplicantPayload>>('/applicants', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.data.applicant;
  },

  async updateApplicant(id: string, payload: ApplicantPayloadInput): Promise<Applicant> {
    const response = await apiRequest<ApiSuccessResponse<ApplicantPayload>>(
      `/applicants/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );

    return response.data.applicant;
  },

  async deleteApplicant(id: string): Promise<{ id: string }> {
    const response = await apiRequest<ApiSuccessResponse<{ id: string }>>(
      `/applicants/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );

    return response.data;
  },
};
