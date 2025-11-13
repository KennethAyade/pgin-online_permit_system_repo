import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { readFile, unlink } from "fs/promises"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if user owns the application or is admin
    if (document.application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Read file from storage
    const filePath = join(process.cwd(), document.fileUrl)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": document.mimeType,
          "Content-Disposition": `attachment; filename="${document.fileName}"`,
          "Content-Length": document.fileSize.toString(),
        },
      })
    } catch (fileError) {
      console.error("Error reading file:", fileError)
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if user owns the application
    if (document.application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Only allow deletion from DRAFT applications
    if (document.application.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot delete document from submitted application" },
        { status: 400 }
      )
    }

    // Delete file from storage
    try {
      const filePath = join(process.cwd(), document.fileUrl)
      await unlink(filePath)
    } catch (fileError) {
      console.error("Error deleting file:", fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

