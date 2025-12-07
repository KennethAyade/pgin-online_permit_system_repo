import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const evaluateSchema = z.object({
  evaluationType: z.enum(["INITIAL_CHECK", "TECHNICAL_REVIEW", "FINAL_APPROVAL"]),
  checklistItems: z.array(z.object({
    itemNumber: z.number(),
    itemName: z.string(),
    category: z.enum(["DOCUMENT_VERIFICATION", "OTHER_REQUIREMENTS", "TECHNICAL_REVIEW"]),
    isComplete: z.boolean(),
    isCompliant: z.boolean().optional(),
    remarks: z.string().optional(),
  })),
  isCompliant: z.boolean(),
  summary: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const body = await request.json()
    const validationResult = evaluateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Create or update evaluation
    const evaluation = await prisma.evaluation.upsert({
      where: {
        applicationId_evaluationType: {
          applicationId: id,
          evaluationType: data.evaluationType,
        },
      },
      update: {
        checklistItems: {
          deleteMany: {},
          create: data.checklistItems.map((item) => ({
            itemNumber: item.itemNumber,
            itemName: item.itemName,
            category: item.category,
            isComplete: item.isComplete,
            isCompliant: item.isCompliant,
            remarks: item.remarks,
            checkedAt: new Date(),
            checkedBy: session.user.id,
          })),
        },
        isCompliant: data.isCompliant,
        summary: data.summary,
        evaluatedBy: session.user.id,
        evaluatedDate: new Date(),
      },
      create: {
        applicationId: id,
        evaluatorId: session.user.id,
        evaluationType: data.evaluationType,
        checklistItems: {
          create: data.checklistItems.map((item) => ({
            itemNumber: item.itemNumber,
            itemName: item.itemName,
            category: item.category,
            isComplete: item.isComplete,
            isCompliant: item.isCompliant,
            remarks: item.remarks,
            checkedAt: new Date(),
            checkedBy: session.user.id,
          })),
        },
        isCompliant: data.isCompliant,
        summary: data.summary,
        evaluatedBy: session.user.id,
        evaluatedDate: new Date(),
      },
    })

    // Update AcceptanceRequirement records with compliance data
    // Map document labels to requirement types
    const DOCUMENT_LABEL_TO_TYPE: Record<string, string> = {
      "Application Form (MGB Form 8-4)": "APPLICATION_FORM",
      "Survey Plan": "SURVEY_PLAN",
      "Location Map": "LOCATION_MAP",
      "Work Program": "WORK_PROGRAM",
      "IEE Report": "IEE_REPORT",
      "EPEP": "EPEP",
      "Proof of Technical Competence": "PROOF_TECHNICAL_COMPETENCE",
      "Proof of Financial Capability": "PROOF_FINANCIAL_CAPABILITY",
      "Articles of Incorporation": "ARTICLES_INCORPORATION",
      "Other Supporting Papers": "OTHER_SUPPORTING_PAPERS",
    }

    // Update compliance for each checklist item
    for (const item of data.checklistItems) {
      const requirementType = DOCUMENT_LABEL_TO_TYPE[item.itemName] as any

      if (requirementType) {
        // Find and update the matching AcceptanceRequirement
        await prisma.acceptanceRequirement.updateMany({
          where: {
            applicationId: id,
            requirementType,
          },
          data: {
            isCompliant: item.isCompliant,
            complianceMarkedAt: new Date(),
            complianceMarkedBy: session.user.id,
          },
        })
      }
    }

    // Update application status based on evaluation type
    let newStatus = application.status
    if (data.evaluationType === "INITIAL_CHECK") {
      newStatus = data.isCompliant ? "TECHNICAL_REVIEW" : "RETURNED"
    } else if (data.evaluationType === "TECHNICAL_REVIEW") {
      newStatus = data.isCompliant ? "FOR_FINAL_APPROVAL" : "RETURNED"
    }

    if (newStatus !== application.status) {
      await prisma.application.update({
        where: { id },
        data: { status: newStatus },
      })

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: newStatus,
          changedBy: session.user.id,
          changedByRole: (session.user as any).adminRole || "admin",
          remarks: `Evaluation completed: ${data.evaluationType}`,
        },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: application.userId,
          applicationId: application.id,
          type: newStatus === "RETURNED" ? "APPLICATION_RETURNED" : "STATUS_CHANGED",
          title: `Application ${newStatus === "RETURNED" ? "Returned" : "Status Updated"}`,
          message: `Your application ${application.applicationNo} has been ${newStatus === "RETURNED" ? "returned" : "updated"}`,
          link: `/applications/${application.id}`,
        },
      })
    }

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error("Error evaluating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

