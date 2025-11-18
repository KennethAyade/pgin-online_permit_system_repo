import { z } from "zod"

export const AccountType = z.enum(["INDIVIDUAL", "CORPORATE"])
export type AccountTypeValue = z.infer<typeof AccountType>

export const registerSchema = z.object({
  accountType: AccountType,
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one non-alphanumeric character"),
  fullName: z.string().min(2, "Full name is required"),
  birthdate: z.date(),
  mobileNumber: z.string().optional(),
  companyName: z.string().optional(),
  // Address components
  region: z.string().min(1, "Region is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().min(1, "City is required"),
  barangay: z.string().min(1, "Barangay is required"),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
}).refine((data) => {
  // Company name is required if accountType is CORPORATE
  if (data.accountType === "CORPORATE" && !data.companyName) {
    return false
  }
  return true
}, {
  message: "Company name is required for corporate accounts",
  path: ["companyName"],
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const recoverPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required"),
  birthdate: z.date(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one non-alphanumeric character"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one non-alphanumeric character"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

