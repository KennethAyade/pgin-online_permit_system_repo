import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { recoverPasswordSchema } from "@/lib/validations/auth"
import { sendEmail, generatePasswordResetTemplate } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = recoverPasswordSchema.safeParse({
      ...body,
      birthdate: new Date(body.birthdate),
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Find user by email, fullName, and birthdate
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      )
    }

    // Verify fullName and birthdate match
    const fullNameMatch = user.fullName.toLowerCase() === data.fullName.toLowerCase()
    const birthdateMatch = user.birthdate.toISOString().split("T")[0] === 
      data.birthdate.toISOString().split("T")[0]

    if (!fullNameMatch || !birthdateMatch) {
      // Don't reveal which field is wrong
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      )
    }

    // Generate password reset token
    const passwordResetToken = randomBytes(32).toString("hex")
    const passwordResetExpires = new Date()
    passwordResetExpires.setHours(passwordResetExpires.getHours() + 1) // 1 hour expiry

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      }
    })

    // Send password reset email
    const emailHtml = generatePasswordResetTemplate(
      passwordResetToken,
      user.fullName
    )

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password - SAG Permit System",
      html: emailHtml,
    })

    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password recovery error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

