import type { LeaveRecord, LeaveType } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

interface LeaveListPayload {
  records: LeaveRecord[];
}

interface LeavePayload {
  record: LeaveRecord;
}

export interface CreateLeavePayload {
  employeeNumber: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  timeFrom?: string;
  timeTo?: string;
  reason: string;
}

export const leaveService = {
  async listLeaves(): Promise<LeaveRecord[]> {
    const response = await apiRequest<ApiSuccessResponse<LeaveListPayload>>('/leaves');
    return response.data.records;
  },

  async createLeave(payload: CreateLeavePayload): Promise<LeaveRecord> {
    const response = await apiRequest<ApiSuccessResponse<LeavePayload>>('/leaves', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.data.record;
  },

  async deleteLeave(id: string): Promise<{ id: string }> {
    const response = await apiRequest<ApiSuccessResponse<{ id: string }>>(
      `/leaves/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );

    return response.data;
  },
};
