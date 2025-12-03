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

    // Log incoming registration attempt
    console.log("[REGISTRATION] Registration attempt received", {
      timestamp: new Date().toISOString(),
      contentType: request.headers.get('content-type'),
      origin: request.headers.get('origin')
    })

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
      // Extract field-specific errors for better logging
      const fieldErrors = validationResult.error.errors.reduce((acc, err) => {
        const field = err.path.join('.')
        acc[field] = err.message
        return acc
      }, {} as Record<string, string>)

      // Log comprehensive validation failure details
      console.error("[REGISTRATION] Validation failed", {
        email: body.email || 'unknown',
        accountType: body.accountType || 'unknown',
        failedFields: Object.keys(fieldErrors),
        errors: fieldErrors,
        submittedData: {
          hasEmail: !!body.email,
          hasPassword: !!body.password,
          hasBirthdate: !!body.birthdate,
          hasRegion: !!body.region,
          hasProvince: !!body.province,
          hasCity: !!body.city,
          hasBarangay: !!body.barangay,
          acceptTerms: body.acceptTerms,
          // Corporate fields
          hasCompanyName: !!body.companyName,
          hasRepresentativeInfo: !!(body.representativeFullName && body.representativeEmail),
          hasPresidentName: !!body.presidentFullName,
        }
      })

      // Map technical field names to user-friendly labels
      const fieldLabels: Record<string, string> = {
        'email': 'Email address',
        'password': 'Password',
        'fullName': 'Full name',
        'birthdate': 'Birth date',
        'region': 'Region',
        'province': 'Province',
        'city': 'City',
        'barangay': 'Barangay',
        'acceptTerms': 'Terms and conditions',
        'companyName': 'Company name',
        'representativeFullName': 'Representative name',
        'representativeEmail': 'Representative email',
        'representativeContactNumber': 'Representative contact',
        'representativeBirthday': 'Representative birthday',
        'presidentFullName': 'President name',
      }

      const userFriendlyErrors = Object.entries(fieldErrors).map(([field, message]) => {
        const label = fieldLabels[field] || field
        return `${label}: ${message}`
      })

      return NextResponse.json(
        {
          error: "Registration validation failed. Please check the following:",
          validationErrors: userFriendlyErrors,
          fieldErrors: fieldErrors // Keep original for programmatic access
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      console.warn("[REGISTRATION] Attempt to register with existing email", {
        email: data.email,
        existingUserId: existingUser.id,
        existingUserVerified: existingUser.emailVerified
      })

      return NextResponse.json(
        { error: "User with this email already exists. Please log in or use password recovery." },
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

      if (!presidentAuthResult.success) {
        console.error("[REGISTRATION] Failed to upload president authorization letter", {
          email: data.email,
          error: presidentAuthResult.error,
          fileName: presidentAuthLetterFile.name,
          fileSize: presidentAuthLetterFile.size
        })
        return NextResponse.json(
          {
            error: "Failed to upload President's Authorization Letter",
            details: presidentAuthResult.error || "Unknown upload error"
          },
          { status: 400 }
        )
      }
      presidentAuthorizationLetterUrl = presidentAuthResult.fileUrl

      // Upload government ID
      const govIdResult = await saveFile(
        governmentIdFile,
        "registration",
        "government_id"
      )

      if (!govIdResult.success) {
        console.error("[REGISTRATION] Failed to upload government ID", {
          email: data.email,
          error: govIdResult.error,
          fileName: governmentIdFile.name,
          fileSize: governmentIdFile.size
        })
        return NextResponse.json(
          {
            error: "Failed to upload Government ID",
            details: govIdResult.error || "Unknown upload error"
          },
          { status: 400 }
        )
      }
      governmentIdUrl = govIdResult.fileUrl

      // Upload company ID
      const companyIdResult = await saveFile(
        companyIdFile,
        "registration",
        "company_id"
      )

      if (!companyIdResult.success) {
        console.error("[REGISTRATION] Failed to upload company ID", {
          email: data.email,
          error: companyIdResult.error,
          fileName: companyIdFile.name,
          fileSize: companyIdFile.size
        })
        return NextResponse.json(
          {
            error: "Failed to upload Company ID",
            details: companyIdResult.error || "Unknown upload error"
          },
          { status: 400 }
        )
      }
      companyIdUrl = companyIdResult.fileUrl

      // Upload SEC/DTI certificate
      const secDtiResult = await saveFile(
        secDtiCertificateFile,
        "registration",
        "sec_dti_cert"
      )

      if (!secDtiResult.success) {
        console.error("[REGISTRATION] Failed to upload SEC/DTI certificate", {
          email: data.email,
          error: secDtiResult.error,
          fileName: secDtiCertificateFile.name,
          fileSize: secDtiCertificateFile.size
        })
        return NextResponse.json(
          {
            error: "Failed to upload SEC/DTI Certificate",
            details: secDtiResult.error || "Unknown upload error"
          },
          { status: 400 }
        )
      }
      secDtiCertificateUrl = secDtiResult.fileUrl

      console.log("[REGISTRATION] All corporate documents uploaded successfully", {
        email: data.email,
        documentCount: 4
      })
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
    // Determine error type for better debugging
    const errorType = error instanceof Error ? error.constructor.name : typeof error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error("[REGISTRATION] Unhandled error during registration", {
      errorType,
      errorMessage,
      errorStack,
      timestamp: new Date().toISOString(),
      // Safely extract any available context
      email: (formData?.get("email") as string) || 'unknown',
      accountType: (formData?.get("accountType") as string) || 'unknown'
    })

    // Return appropriate error based on error type
    if (error instanceof Error) {
      // Check for common database errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: "Registration failed: Email already exists" },
          { status: 409 }
        )
      }

      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: "Registration failed: Invalid data reference" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error during registration. Please try again.",
        supportMessage: "If this persists, please contact support with timestamp: " + new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

