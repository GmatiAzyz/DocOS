import { z } from 'zod';
import { ValidationError } from './error-handler';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
export const dateSchema = z.string().or(z.date()).transform((val) => new Date(val));

// Doctor registration schema
export const doctorRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  clinicName: z.string().min(2, 'Clinic name must be at least 2 characters').max(100, 'Clinic name too long'),
  specialty: z.string().optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(200, 'Address too long').optional(),
});

// Patient creation schema
export const patientCreationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: emailSchema.optional(),
  phone: phoneSchema,
  dob: dateSchema,
  address: z.string().max(200, 'Address too long').optional(),
  emergencyContact: z.string().max(100, 'Emergency contact too long').optional(),
  medicalHistory: z.string().max(1000, 'Medical history too long').optional(),
  allergies: z.string().max(500, 'Allergies description too long').optional(),
  medications: z.string().max(500, 'Medications description too long').optional(),
});

// Appointment creation schema
export const appointmentCreationSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  appointmentDate: dateSchema,
  startTime: dateSchema,
  endTime: dateSchema,
  type: z.string().min(1, 'Appointment type is required').max(50, 'Appointment type too long'),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Visit note creation schema
export const visitNoteSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  symptoms: z.string().max(1000, 'Symptoms description too long').optional(),
  diagnosis: z.string().max(1000, 'Diagnosis description too long').optional(),
  treatment: z.string().max(1000, 'Treatment description too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  visitDate: dateSchema,
});

// Invoice creation schema
export const invoiceCreationSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  amount: z.number().positive('Amount must be positive').max(999999.99, 'Amount too high'),
  dueDate: dateSchema,
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
  })),
});

// Payment creation schema
export const paymentCreationSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: dateSchema,
  paymentMethod: z.string().min(1, 'Payment method is required').max(50, 'Payment method too long'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Generic validation function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', (error as z.ZodError).issues);
    }
    throw error;
  }
}

// Safe validation function that returns null on failure
export function safeValidateInput<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}

// Partial validation for updates
export function validatePartialInput<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
  try {
    const partialSchema = (schema as any).partial();
    return partialSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', (error as z.ZodError).issues);
    }
    throw error;
  }
}
