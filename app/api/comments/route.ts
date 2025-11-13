import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createCommentSchema = z.object({
  applicationId: z.string().min(1),
  content: z.string().min(1),
  commentType: z.enum(["REMARK", "CLARIFICATION", "REVISION_REQUEST", "APPROVAL_NOTE", "REJECTION_REASON"]).default("REMARK"),
  parentId: z.string().optional(),
  isInternal: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = createCommentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Check if user owns the application or is admin
    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        applicationId: data.applicationId,
        content: data.content,
        commentType: data.commentType,
        authorId: session.user.id,
        authorRole: "applicant",
        authorName: session.user.name || session.user.email || "Unknown",
        parentId: data.parentId,
        isInternal: data.isInternal,
      },
    })

    return NextResponse.json(
      { comment },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

