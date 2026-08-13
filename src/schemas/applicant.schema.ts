import { z } from 'zod';
import { ApplicantStatus } from '../types/types';

export const applicantFormSchema = z.object({
  name: z.string().trim().min(1, 'Applicant name is required'),
  email: z.string().trim().email('A valid email is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  position: z.string().trim().min(1, 'Position applied is required'),
  department: z.string().trim().optional().default(''),
  status: z.enum(ApplicantStatus),
  appliedDate: z.string().trim().min(1, 'Applied date is required'),
  resumeUrl: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;
