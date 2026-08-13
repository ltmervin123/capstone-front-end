import type { AttendanceRecord, AttendanceStatus } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

interface AttendanceListPayload {
  records: AttendanceRecord[];
}

interface AttendancePayload {
  record: AttendanceRecord;
}

export interface CreateAttendancePayload {
  employeeNumber: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: AttendanceStatus;
  remarks?: string;
}

export const attendanceService = {
  async listAttendance(): Promise<AttendanceRecord[]> {
    const response = await apiRequest<ApiSuccessResponse<AttendanceListPayload>>('/attendance');
    return response.data.records;
  },

  async createAttendance(payload: CreateAttendancePayload): Promise<AttendanceRecord> {
    const response = await apiRequest<ApiSuccessResponse<AttendancePayload>>('/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.data.record;
  },
};
