import { z } from "zod"

// Schema for a single coordinate point (old format)
const coordinatePointSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
})

// Old format (wizard input) - object with point1, point2, point3, point4
const legacyProjectCoordinatesSchema = z.object({
  point1: coordinatePointSchema,
  point2: coordinatePointSchema,
  point3: coordinatePointSchema,
  point4: coordinatePointSchema,
})

// New format (after coordinate submission) - array of {lat, lng}
const arrayProjectCoordinatesSchema = z.array(
  z.object({
    lat: z.number(),
    lng: z.number(),
  })
)

// Accept both formats using union to fix draft save 400 errors after coordinate submission
const projectCoordinatesSchema = z.union([
  legacyProjectCoordinatesSchema,
  arrayProjectCoordinatesSchema,
]).optional()

// Schema for batch-uploaded acceptance documents (Step 5)
const uploadedDocumentsSchema = z
  .record(
    z.object({
      fileUrl: z.string(),
      fileName: z.string(),
    })
  )
  .optional()

export const createApplicationSchema = z.object({
  permitType: z.enum(["ISAG", "CSAG"]),
  projectName: z.string().optional(),
  projectArea: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").optional(),
  footprintArea: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").optional(),
  numEmployees: z.number().int().positive().optional(),
  projectCost: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").optional(),
  projectCoordinates: projectCoordinatesSchema,
  currentStep: z.number().int().min(1).max(7).default(1),
  uploadedDocuments: uploadedDocumentsSchema,
})

export const updateApplicationSchema = createApplicationSchema.partial()

export const submitApplicationSchema = z.object({
  applicationId: z.string().min(1),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>

