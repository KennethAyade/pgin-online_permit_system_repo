import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const search = request.nextUrl.searchParams.get("search")?.trim()

    const adminWhere: any = {}
    const userWhere: any = {}

    if (search) {
      adminWhere.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ]

      userWhere.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ]
    }

    const [admins, applicants] = await Promise.all([
      prisma.adminUser.findMany({
        where: adminWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          position: true,
          department: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.findMany({
        where: userWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          address: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({ admins, applicants })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { adminId, isActive } = body as {
      adminId?: string
      isActive?: boolean
    }

    if (!adminId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      )
    }

    // Prevent admins from disabling themselves
    if (adminId === (session.user as any).id) {
      return NextResponse.json(
        { error: "You cannot change your own active status." },
        { status: 400 },
      )
    }

    const updated = await prisma.adminUser.update({
      where: { id: adminId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        position: true,
        department: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({ admin: updated })
  } catch (error) {
    console.error("Error updating admin user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, type } = body as { id?: string; type?: "admin" | "applicant" }

    if (!id || (type !== "admin" && type !== "applicant")) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      )
    }

    // Extra safety: prevent deleting your own admin account
    if (type === "admin" && id === (session.user as any).id) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account." },
        { status: 400 },
      )
    }

    if (type === "admin") {
      await prisma.adminUser.delete({ where: { id } })
    } else {
      // Applicant; cascades will remove related rows per Prisma schema
      await prisma.user.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
