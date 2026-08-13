import { z } from 'zod';
import { LeaveType } from '../types/types';

export const createLeaveFormSchema = z
  .object({
    employeeNumber: z.string().trim().min(1, 'Please select an employee.'),
    type: z.enum(LeaveType),
    startDate: z.string().trim().min(1, 'Please select both start and end dates.'),
    endDate: z.string().trim().min(1, 'Please select both start and end dates.'),
    numberOfDays: z.number().int().min(1, 'Number of days must be at least 1'),
    timeFrom: z.string().trim().optional().default(''),
    timeTo: z.string().trim().optional().default(''),
    reason: z.string().trim().min(1, 'Please enter a valid reason for the leave.'),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: 'Start date cannot be after the end date.',
    path: ['startDate'],
  });

export type CreateLeaveFormValues = z.infer<typeof createLeaveFormSchema>;
