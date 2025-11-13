import nodemailer from "nodemailer"

// Create reusable transporter
// Support both Laravel-style (MAIL_*) and direct SMTP_* variables
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || "587"),
  secure: (process.env.MAIL_ENCRYPTION === "ssl" || process.env.SMTP_SECURE === "true"), // true for 465/SSL, false for 587/TLS
  auth: {
    user: process.env.MAIL_USERNAME || process.env.SMTP_USER,
    pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  try {
    const fromEmail = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM || process.env.SMTP_USER
    
    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}

export function generateEmailVerificationTemplate(token: string, name: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL || process.env.APP_URL}/verify-email?token=${token}`
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with the SAG Permit Online Application System.</p>
          <p>Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
        </div>
      </body>
    </html>
  `
}

export function generatePasswordResetTemplate(token: string, name: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || process.env.APP_URL}/reset-password?token=${token}`
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password for your SAG Permit Online Application System account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
        </div>
      </body>
    </html>
  `
}
