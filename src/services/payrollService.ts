import type { CutoffType, PayrollRecord, PayrollRun } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

interface PayrollRunListPayload {
  runs: PayrollRun[];
}

interface PayrollRunPayload {
  run: PayrollRun & { records?: PayrollRecord[] };
}

interface PayrollRecordsListPayload {
  records: PayrollRecord[];
}

interface PayrollRecordPayload {
  record: PayrollRecord;
}

export interface CreatePayrollRunPayload {
  name: string;
  cutoffType: CutoffType;
  startDate: string;
  endDate: string;
}

export interface AdjustPayrollRecordPayload {
  daysWorked?: number;
  functionalRate?: number;
  allowances?: number;
  gasoline?: number;
  tardinessMinutes?: number;
  cashAdvance?: number;
  sssDeduction?: number;
  philHealthDeduction?: number;
  pagIbigDeduction?: number;
  taxWithheld?: number;
  otherDeductions?: number;
}

export const payrollService = {
  async listPayrollRuns(): Promise<PayrollRun[]> {
    const response =
      await apiRequest<ApiSuccessResponse<PayrollRunListPayload>>(
        '/payroll/runs'
      );
    return response.data.runs;
  },

  async getPayrollRun(
    id: string
  ): Promise<PayrollRun & { records: PayrollRecord[] }> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRunPayload>>(
      `/payroll/runs/${encodeURIComponent(id)}`
    );
    return response.data.run as PayrollRun & { records: PayrollRecord[] };
  },

  async createPayrollRun(
    payload: CreatePayrollRunPayload
  ): Promise<PayrollRun> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRunPayload>>(
      '/payroll/runs',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return response.data.run;
  },

  async lockAttendance(id: string): Promise<PayrollRun> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRunPayload>>(
      `/payroll/runs/${encodeURIComponent(id)}/lock-attendance`,
      { method: 'POST' }
    );
    return response.data.run;
  },

  async unlockAttendance(id: string): Promise<PayrollRun> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRunPayload>>(
      `/payroll/runs/${encodeURIComponent(id)}/unlock-attendance`,
      { method: 'POST' }
    );
    return response.data.run;
  },

  async calculatePayrollRun(
    id: string
  ): Promise<PayrollRun & { records: PayrollRecord[] }> {
    const response = await apiRequest<
      ApiSuccessResponse<PayrollRun & { records: PayrollRecord[] }>
    >(`/payroll/runs/${encodeURIComponent(id)}/calculate`, { method: 'POST' });
    return response.data;
  },

  async publishPayrollRun(id: string): Promise<PayrollRun> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRunPayload>>(
      `/payroll/runs/${encodeURIComponent(id)}/publish`,
      { method: 'POST' }
    );
    return response.data.run;
  },

  async deletePayrollRun(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<
      ApiSuccessResponse<{ success: boolean; message: string }>
    >(`/payroll/runs/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return response.data;
  },

  async listPayrollRecords(params?: {
    payrollRunId?: string;
    month?: string;
    year?: number;
  }): Promise<PayrollRecord[]> {
    const query = new URLSearchParams();
    if (params?.payrollRunId) query.set('payrollRunId', params.payrollRunId);
    if (params?.month && params.month !== 'All')
      query.set('month', params.month);
    if (params?.year && !Number.isNaN(params.year))
      query.set('year', params.year.toString());

    const qs = query.toString();
    const endpoint = qs ? `/payroll/records?${qs}` : '/payroll/records';

    const response =
      await apiRequest<ApiSuccessResponse<PayrollRecordsListPayload>>(endpoint);
    return response.data.records;
  },

  async getPayrollRecord(id: string): Promise<PayrollRecord> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRecordPayload>>(
      `/payroll/records/${encodeURIComponent(id)}`
    );
    return response.data.record;
  },

  async adjustPayrollRecord(
    id: string,
    payload: AdjustPayrollRecordPayload
  ): Promise<PayrollRecord> {
    const response = await apiRequest<ApiSuccessResponse<PayrollRecordPayload>>(
      `/payroll/records/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return response.data.record;
  },
};
