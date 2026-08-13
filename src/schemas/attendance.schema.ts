import { z } from 'zod';
import { AttendanceStatus } from '../types/types';

export const createAttendanceFormSchema = z.object({
  employeeNumber: z.string().trim().min(1, 'Employee is required'),
  date: z.string().trim().min(1, 'Date is required'),
  timeIn: z.string().trim().optional().default(''),
  timeOut: z.string().trim().optional().default(''),
  status: z.enum(AttendanceStatus),
  remarks: z.string().trim().optional().default(''),
});

export type CreateAttendanceFormValues = z.infer<typeof createAttendanceFormSchema>;
