# SAG Permit System - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up the SAG Permit Online Application System development environment.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

---

## Step 1: Initialize Next.js Project

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest sag-permit-system

# Select options:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ App Router: Yes
# ✓ src/ directory: No
# ✓ Import alias: @/*

cd sag-permit-system
```

---

## Step 2: Install Core Dependencies

```bash
# Install Prisma and database client
npm install @prisma/client
npm install -D prisma

# Install NextAuth.js v5
npm install next-auth@beta

# Install form handling
npm install react-hook-form @hookform/resolvers zod

# Install UI components
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Install file upload
npm install react-dropzone

# Install email service
npm install resend

# Install utilities
npm install bcryptjs date-fns
npm install -D @types/bcryptjs

# Install data fetching (optional but recommended)
npm install @tanstack/react-query
```

---

## Step 3: Set Up Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

### Configure `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sag_permit_db?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/sag_permit_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@yourdomain.com"

# File Upload
UPLOAD_DIR="./storage/uploads"
MAX_FILE_SIZE=10485760

# App
APP_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
```

### Generate Prisma Client:

```bash
npx prisma generate
```

---

## Step 4: Set Up Database

```bash
# Create PostgreSQL database
createdb sag_permit_db

# Or using psql:
# psql -U postgres
# CREATE DATABASE sag_permit_db;

# Run migrations (after creating schema.prisma)
npx prisma migrate dev --name init

# Or push schema without migrations (development)
npx prisma db push
```

---

## Step 5: Set Up shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Select options:
# ✓ Style: Default
# ✓ Base color: Slate
# ✓ CSS variables: Yes

# Install essential components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
```

---

## Step 6: Project Structure

Create the following directory structure:

```
sag-permit-system/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── recover-password/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── applications/
│   │   └── for-action/
│   ├── (admin)/
│   │   ├── admin/
│   │   └── applications/
│   ├── api/
│   │   ├── auth/
│   │   ├── applications/
│   │   └── documents/
│   └── layout.tsx
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── forms/
│   ├── application/
│   └── admin/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── email.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
├── storage/         # File uploads (gitignored)
└── types/
```

---

## Step 7: Create Essential Files

### `lib/db.ts` (Prisma Client)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### `lib/utils.ts` (Utility Functions)

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `.gitignore` (Add storage directory)

```
# ... existing entries ...

# File uploads
/storage/uploads/*
!/storage/uploads/.gitkeep
```

---

## Step 8: Set Up NextAuth

### `lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
```

### `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

---

## Step 9: Create Storage Directory

```bash
mkdir -p storage/uploads
touch storage/uploads/.gitkeep
```

---

## Step 10: Run Development Server

```bash
# Start development server
npm run dev

# In another terminal, open Prisma Studio (optional)
npx prisma studio
```

Visit `http://localhost:3000` to see your app!

---

## Step 11: Create First Migration

After setting up your Prisma schema (see `DATABASE_SCHEMA.md`):

```bash
# Generate migration
npx prisma migrate dev --name init

# This will:
# 1. Create migration files
# 2. Apply migration to database
# 3. Generate Prisma Client
```

---

## 📚 Next Steps

1. **Set up Database Schema**: Copy schema from `DATABASE_SCHEMA.md` to `prisma/schema.prisma`
2. **Create Authentication Pages**: Login, Register, Password Recovery
3. **Build Application Wizard**: Multi-step form for permit applications
4. **Implement File Upload**: Document management system
5. **Create Admin Panel**: Evaluation and approval workflow

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma Client
npx prisma db push  # Push schema changes (dev)
npx prisma migrate dev  # Create and apply migration
npx prisma studio   # Open Prisma Studio (DB GUI)
npx prisma migrate reset  # Reset database (dev only)

# shadcn/ui
npx shadcn-ui@latest add [component]  # Add component
```

---

## 🔧 Troubleshooting

### **Prisma Client not found**
```bash
npx prisma generate
```

### **Database connection error**
- Check `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Verify database exists

### **Port 3000 already in use**
```bash
# Use different port
npm run dev -- -p 3001
```

### **Module not found errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

---

## 📖 Documentation References

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed and running
- [ ] Next.js project created
- [ ] Dependencies installed
- [ ] Prisma initialized
- [ ] Database created
- [ ] Environment variables configured
- [ ] shadcn/ui initialized
- [ ] Project structure created
- [ ] Development server running

---

**You're ready to start building! 🎉**

