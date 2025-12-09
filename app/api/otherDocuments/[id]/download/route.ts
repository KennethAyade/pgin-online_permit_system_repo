import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { readFile } from "fs/promises"
import { join } from "path"

/**
 * Download/view OtherDocument file
 * GET /api/otherDocuments/[id]/download
 */
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

    const { id: documentId } = await params

    // Get OtherDocument with application
    const otherDocument = await prisma.otherDocument.findUnique({
      where: { id: documentId },
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

    if (!otherDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if file has been uploaded
    if (!otherDocument.submittedFileUrl) {
      return NextResponse.json(
        { error: "File not uploaded yet" },
        { status: 404 }
      )
    }

    // Check if user owns the application or is admin
    const isAdmin = (session.user as any)?.role === "admin"
    if (otherDocument.application.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Check if file is stored in Vercel Blob (URL starts with https://)
    if (otherDocument.submittedFileUrl.startsWith("https://")) {
      // Redirect to blob URL or fetch and proxy
      const inline = request.nextUrl.searchParams.get("inline") === "1"

      // Fetch the file from blob storage
      try {
        const response = await fetch(otherDocument.submittedFileUrl)
        if (!response.ok) {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          )
        }

        const fileBuffer = await response.arrayBuffer()

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${otherDocument.submittedFileName}"`,
          },
        })
      } catch (fetchError) {
        console.error("Error fetching file from blob:", fetchError)
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        )
      }
    }

    // Fallback to local filesystem (development)
    const filePath = join(process.cwd(), otherDocument.submittedFileUrl)

    try {
      const fileBuffer = await readFile(filePath)

      const inline = request.nextUrl.searchParams.get("inline") === "1"

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${otherDocument.submittedFileName}"`,
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
    console.error("Error downloading other document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
