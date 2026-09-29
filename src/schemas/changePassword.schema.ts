import { z } from 'zod';

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().trim().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.').max(200),
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New password and confirmation do not match.',
    path: ['confirmPassword'],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
