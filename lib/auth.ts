import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        const role = credentials.role as string | undefined

        // Check if admin login
        if (role === "admin") {
          const admin = await prisma.adminUser.findUnique({
            where: { email }
          })

          if (!admin || !admin.isActive) return null

          const isPasswordValid = await bcrypt.compare(
            password,
            admin.password
          )

          if (!isPasswordValid) return null

          // Update last login
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: admin.id,
            email: admin.email,
            name: admin.fullName,
            role: "admin",
            adminRole: admin.role,
          }
        }

        // Regular user login
        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        )

        if (!isPasswordValid) return null

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: "user",
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.adminRole = (user as any).adminRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).adminRole = token.adminRole
      }
      return session
    }
  }
})

