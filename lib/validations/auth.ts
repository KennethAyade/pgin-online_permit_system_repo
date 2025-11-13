import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one non-alphanumeric character"),
  fullName: z.string().min(2, "Full name is required"),
  birthdate: z.date(),
  mobileNumber: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
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

