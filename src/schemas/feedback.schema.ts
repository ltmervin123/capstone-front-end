import { z } from 'zod';

export const FEEDBACK_CATEGORIES = [
  'General Feedback / Suggestion',
  'Leave Inquiry',
  'Payroll Inquiry',
  'Workplace Suggestion',
  'Confidential HR Concern',
] as const;

export const createFeedbackFormSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  subject: z.string().trim().min(1, 'Please enter a subject for your feedback.'),
  message: z.string().trim().min(1, 'Please enter your feedback message.'),
  isAnonymous: z.boolean(),
});

export type CreateFeedbackFormValues = z.infer<typeof createFeedbackFormSchema>;

export const replyFeedbackFormSchema = z.object({
  adminResponse: z.string().trim().min(1, 'Please enter a response for the employee.'),
  status: z.enum(['New', 'Under Review', 'Resolved']),
});

export type ReplyFeedbackFormValues = z.infer<typeof replyFeedbackFormSchema>;
