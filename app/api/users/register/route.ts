import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"
import { sendEmail, generateEmailVerificationTemplate } from "@/lib/email"
import { randomBytes } from "crypto"
import { saveFile } from "@/lib/upload"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form fields
    const body: any = {
      accountType: formData.get("accountType"),
      email: formData.get("email"),
      password: formData.get("password"),
      fullName: formData.get("fullName"),
      birthdate: formData.get("birthdate"),
      mobileNumber: formData.get("mobileNumber"),
      companyName: formData.get("companyName"),
      representativeFullName: formData.get("representativeFullName"),
      representativeEmail: formData.get("representativeEmail"),
      representativeContactNumber: formData.get("representativeContactNumber"),
      representativeBirthday: formData.get("representativeBirthday"),
      presidentFullName: formData.get("presidentFullName"),
      region: formData.get("region"),
      province: formData.get("province"),
      city: formData.get("city"),
      barangay: formData.get("barangay"),
      acceptTerms: formData.get("acceptTerms") === "true",
    }

    // Extract file uploads
    const presidentAuthLetterFile = formData.get("presidentAuthLetter") as File | null
    const governmentIdFile = formData.get("governmentId") as File | null
    const companyIdFile = formData.get("companyId") as File | null
    const secDtiCertificateFile = formData.get("secDtiCertificate") as File | null

    // Validate input
    const validationResult = registerSchema.safeParse({
      ...body,
      birthdate: body.birthdate ? new Date(body.birthdate) : undefined,
      representativeBirthday: body.representativeBirthday ? new Date(body.representativeBirthday) : undefined,
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

    // Upload files if provided (for corporate accounts)
    let presidentAuthorizationLetterUrl: string | undefined
    let governmentIdUrl: string | undefined
    let companyIdUrl: string | undefined
    let secDtiCertificateUrl: string | undefined

    if (data.accountType === "CORPORATE") {
      // Validate that all required files are provided
      if (!presidentAuthLetterFile || !governmentIdFile || !companyIdFile || !secDtiCertificateFile) {
        return NextResponse.json(
          { error: "All document uploads are required for corporate accounts" },
          { status: 400 }
        )
      }

      // Upload president authorization letter
      const presidentAuthResult = await saveFile(
        presidentAuthLetterFile,
        "registration",
        "president_auth"
      )
      presidentAuthorizationLetterUrl = presidentAuthResult.fileUrl

      // Upload government ID
      const govIdResult = await saveFile(
        governmentIdFile,
        "registration",
        "government_id"
      )
      governmentIdUrl = govIdResult.fileUrl

      // Upload company ID
      const companyIdResult = await saveFile(
        companyIdFile,
        "registration",
        "company_id"
      )
      companyIdUrl = companyIdResult.fileUrl

      // Upload SEC/DTI certificate
      const secDtiResult = await saveFile(
        secDtiCertificateFile,
        "registration",
        "sec_dti_cert"
      )
      secDtiCertificateUrl = secDtiResult.fileUrl
    }

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
        // Representative information (for CORPORATE)
        representativeFullName: data.representativeFullName,
        representativeEmail: data.representativeEmail,
        representativeContactNumber: data.representativeContactNumber,
        representativeBirthday: data.representativeBirthday,
        // President information (for CORPORATE)
        presidentFullName: data.presidentFullName,
        presidentAuthorizationLetterUrl,
        // Store address components separately
        region: data.region,
        province: data.province,
        city: data.city,
        barangay: data.barangay,
        // Document URLs (for CORPORATE)
        governmentIdUrl,
        companyIdUrl,
        secDtiCertificateUrl,
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

