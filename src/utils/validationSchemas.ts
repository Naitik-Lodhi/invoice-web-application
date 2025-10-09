// src/utils/validationSchemas.ts
import { z } from "zod";
import { VALIDATION_MESSAGES as MSG } from "../constants/messages";
import { checkEmailExists } from "../services/authService";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, MSG.firstNameRequired).max(50),
  lastName: z.string().trim().min(1, MSG.lastNameRequired).max(50),
  email: z
    .string()
    .trim()
    .min(1, MSG.emailRequired)
    .email(MSG.emailInvalid)
    .refine(
      async (email) => {
        // Don't call the API if the email is empty or invalid
        if (!email || !z.string().email().safeParse(email).success) {
          return true;
        }
        const isEmailTaken = await checkEmailExists(email);
        return !isEmailTaken; // Return false if email is taken to trigger the error
      },
      {
        message: "An account with this email already exists.", // The error message
      }
    ),
  password: z
    .string()
    .min(1, MSG.passwordRequired)
    .min(8, MSG.passwordMinLength)
    .max(20)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, MSG.passwordPattern),

  // companyLogo: z.any().optional(), // We'll handle this separately
  companyLogo: z
    .any()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg and .png formats are supported."
    ),

  companyName: z.string().trim().min(1, MSG.companyNameRequired).max(100),
  address: z.string().trim().min(1, MSG.addressRequired).max(500),
  city: z.string().trim().min(1, MSG.cityRequired).max(50),
  zipCode: z.string().trim().length(6, MSG.zipCodeInvalid),
  industry: z.string().max(50).optional(),
  currencySymbol: z.string().trim().min(1, MSG.currencySymbolRequired).max(5),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, MSG.emailRequired).email(MSG.emailInvalid),
  password: z.string().min(1, MSG.passwordRequired),
  rememberMe: z.boolean().default(false),
});

// To get the TypeScript type from the schema
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
