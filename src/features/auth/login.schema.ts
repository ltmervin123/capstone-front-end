import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().trim().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
