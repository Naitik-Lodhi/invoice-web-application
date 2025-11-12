// src/utils/validationSchemas.ts
import { z } from "zod";
import { VALIDATION_MESSAGES as MSG, VALIDATION_MESSAGES } from "../constants/messages";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export const signupSchema = z.object({
  firstName: z.string().min(1, VALIDATION_MESSAGES.firstNameRequired),
  lastName: z.string().min(1, VALIDATION_MESSAGES.lastNameRequired),
  email: z
    .string()
    .min(1, VALIDATION_MESSAGES.emailRequired)
    .email(VALIDATION_MESSAGES.emailInvalid),
  password: z
    .string()
    .min(8, VALIDATION_MESSAGES.passwordMinLength)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, VALIDATION_MESSAGES.passwordPattern),
  companyName: z.string().min(1, VALIDATION_MESSAGES.companyNameRequired),
  address: z.string().min(1, VALIDATION_MESSAGES.addressRequired),
  city: z.string().min(1, VALIDATION_MESSAGES.cityRequired),
  zipCode: z
    .string()
    .min(1, VALIDATION_MESSAGES.zipCodeRequired)
    .regex(/^\d{6}$/, VALIDATION_MESSAGES.zipCodeInvalid),
  industry: z.string().optional(),
  currencySymbol: z.string().min(1, VALIDATION_MESSAGES.currencySymbolRequired),
  companyLogo: z.instanceof(File).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, MSG.emailRequired).email(MSG.emailInvalid),
  password: z.string().min(1, MSG.passwordRequired),
  rememberMe: z.boolean().default(false),
});

// To get the TypeScript type from the schema
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
