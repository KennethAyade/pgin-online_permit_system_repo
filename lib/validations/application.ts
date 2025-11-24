import { z } from "zod"

// Schema for a single coordinate point
const coordinatePointSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
})

// Schema for project coordinates (4 points)
const projectCoordinatesSchema = z.object({
  point1: coordinatePointSchema,
  point2: coordinatePointSchema,
  point3: coordinatePointSchema,
  point4: coordinatePointSchema,
}).optional()

export const createApplicationSchema = z.object({
  permitType: z.enum(["ISAG", "CSAG"]),
  projectName: z.string().optional(),
  projectArea: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").optional(),
  footprintArea: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").optional(),
  numEmployees: z.number().int().positive().optional(),
  projectCost: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").optional(),
  projectCoordinates: projectCoordinatesSchema,
  currentStep: z.number().int().min(1).max(7).default(1),
})

export const updateApplicationSchema = createApplicationSchema.partial()

export const submitApplicationSchema = z.object({
  applicationId: z.string().min(1),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>

