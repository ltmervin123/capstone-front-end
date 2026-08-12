import { z } from 'zod';

const checklistCategorySchema = z.record(z.string(), z.boolean()).default({});

export const createEmployeeFormSchema = z.object({
  employeeNumber: z
    .string()
    .trim()
    .min(1, 'Employee ID is required')
    .max(50)
    .transform((value) => value.toUpperCase()),
  surname: z.string().trim().min(1, 'Surname is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  middleName: z.string().trim().optional().default(''),
  dateOfBirth: z.string().trim().min(1, 'Date of birth is required'),
  sex: z.enum(['Male', 'Female', 'Other']),
  maritalStatus: z.string().trim().min(1, 'Marital status is required'),
  religion: z.string().trim().optional().default(''),
  homeAddress: z.string().trim().min(1, 'Home address is required'),
  contactNumber: z.string().trim().min(1, 'Contact number is required'),
  email: z.string().trim().email('Valid email is required'),
  position: z.string().trim().min(1, 'Position is required'),
  department: z.string().trim().min(1, 'Department is required'),
  employmentDate: z.string().trim().min(1, 'Employment date is required'),
  serviceDuration: z.string().trim().optional().default(''),
  status: z.enum(['Active', 'Inactive', 'Retired']).default('Active'),
  educationLevel: z.string().trim().optional().default(''),
  bachelorsDegree: z.string().trim().optional().default(''),
  mastersStatus: z.string().trim().optional().default(''),
  mastersDegreeName: z.string().trim().optional().default(''),
  doctorateStatus: z.string().trim().optional().default(''),
  functionalRate: z.coerce.number().nonnegative().optional().default(0),
  gasoline: z.coerce.number().nonnegative().optional().default(0),
  cashAdvance: z.coerce.number().nonnegative().optional().default(0),
  employeeShare: z.coerce.number().nonnegative().optional().default(0),
  checklist: z
    .object({
      personalInfo: checklistCategorySchema,
      educational: checklistCategorySchema,
      employment: checklistCategorySchema,
      government: checklistCategorySchema,
      training: checklistCategorySchema,
      administrative: checklistCategorySchema,
    })
    .optional(),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeFormSchema>;
