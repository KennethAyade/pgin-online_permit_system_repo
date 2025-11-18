import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"
import { sendEmail, generateEmailVerificationTemplate } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = registerSchema.safeParse({
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString("hex")

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        birthdate: data.birthdate,
        mobileNumber: data.mobileNumber,
        accountType: data.accountType,
        companyName: data.companyName,
        // Store address components separately
        region: data.region,
        province: data.province,
        city: data.city,
        barangay: data.barangay,
        emailVerificationToken,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      }
    })

    // Send verification email
    const emailHtml = generateEmailVerificationTemplate(
      emailVerificationToken,
      user.fullName
    )

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - SAG Permit System",
      html: emailHtml,
    })

    return NextResponse.json(
      {
        message: "User registered successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

