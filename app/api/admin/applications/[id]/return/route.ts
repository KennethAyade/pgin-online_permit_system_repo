import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const returnSchema = z.object({
  remarks: z.string().min(1),
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
    const validationResult = returnSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { remarks } = validationResult.data

    const application = await prisma.application.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: "RETURNED",
        decision: "RETURNED",
        decisionDate: new Date(),
      },
    })

    // Create status history
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: application.status,
        toStatus: "RETURNED",
        changedBy: session.user.id,
        changedByRole: (session.user as any).adminRole || "admin",
        remarks,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: application.userId,
        applicationId: application.id,
        type: "APPLICATION_RETURNED",
        title: "Application Returned",
        message: `Your application ${application.applicationNo} has been returned. ${remarks}`,
        link: `/applications/${application.id}`,
      },
    })

    return NextResponse.json({ application: updatedApplication })
  } catch (error) {
    console.error("Error returning application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

