import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

    // Generate permit number
    const permitNumber = `SAG-${application.permitType}-${Date.now().toString().slice(-6)}`

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: "APPROVED",
        decision: "APPROVED",
        decisionDate: new Date(),
        approvedBy: session.user.id,
        permitNumber,
      },
    })

    // Create status history
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: application.status,
        toStatus: "APPROVED",
        changedBy: session.user.id,
        changedByRole: (session.user as any).adminRole || "admin",
        remarks: "Application approved",
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: application.userId,
        applicationId: application.id,
        type: "APPLICATION_APPROVED",
        title: "Application Approved",
        message: `Your application ${application.applicationNo} has been approved. Permit Number: ${permitNumber}`,
        link: `/applications/${application.id}`,
      },
    })

    return NextResponse.json({ application: updatedApplication })
  } catch (error) {
    console.error("Error approving application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

