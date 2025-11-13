# SAG Permit Online Application System - Tech Stack Recommendation

## Overview
This document outlines the recommended technology stack for building the SAG Permit Online Application System using Next.js as the primary framework.

---

## 🎯 Core Framework

### **Next.js 14+ (App Router)**
- **Why**: Modern React framework with built-in API routes, SSR/SSG capabilities, and excellent performance
- **Version**: Next.js 14+ with App Router (latest stable)
- **Key Features**:
  - Server Components for better performance
  - API Routes for backend logic
  - Built-in image optimization
  - File upload handling
  - Route protection

---

## 🗄️ Database

### **PostgreSQL 15+** (Recommended)
- **Why**: Robust, reliable, excellent for complex relationships
- **ORM**: Prisma (recommended) or Drizzle
- **Alternative**: MySQL 8.0+ (if preferred)

### **Database Schema Overview**:
```
- users (applicants)
- applications (ISAG/CSAG)
- documents (linked to applications)
- application_status_history (audit trail)
- comments_remarks (communication)
- admin_users (MGB staff)
- evaluation_checklists (ISAG/CSAG)
- notifications
```

---

## 🔐 Authentication & Authorization

### **NextAuth.js v5 (Auth.js)**
- **Why**: Industry-standard, secure, easy to implement
- **Features**:
  - Email/password authentication
  - Password recovery via email
  - Session management
  - Role-based access control (RBAC)
- **Session Storage**: Database (PostgreSQL)
- **Password Hashing**: bcryptjs

### **Role Types**:
- `applicant` - Regular users applying for permits
- `admin` - MGB/PMRB administrators
- `evaluator` - Technical reviewers
- `pmrb` - Final approvers

---

## 📝 Form Handling & Validation

### **React Hook Form**
- **Why**: Performance-optimized, minimal re-renders
- **Validation**: Zod (type-safe schema validation)
- **Multi-step Forms**: Use `useForm` with step management

### **Example Structure**:
```typescript
// Multi-step application form
Step 1: Permit Type Selection (ISAG/CSAG)
Step 2: Basic Project Information
Step 3: Proponent Information
Step 4: Project Details (Area, Employees, Cost)
Step 5: Document Uploads (Mandatory Requirements)
Step 6: Other Requirements Upload
Step 7: Review & Submit
```

---

## 🎨 UI Framework & Styling

### **Tailwind CSS 3+**
- **Why**: Utility-first, fast development, consistent design
- **Component Library**: 
  - **shadcn/ui** (recommended) - Copy-paste components, fully customizable
  - **OR** Radix UI + Tailwind (more control)
- **Icons**: Lucide React or Heroicons

### **UI Components Needed**:
- Form inputs (text, number, file upload)
- Multi-step wizard/progress indicator
- Data tables (applications list)
- Modals/Dialogs
- Toast notifications
- File upload with preview
- Status badges
- Dashboard cards/widgets

---

## 📄 File Upload & Storage

### **File Upload Library**
- **react-dropzone** - Drag & drop file uploads
- **File Validation**: Client-side + Server-side

### **Storage Solution**
- **Development**: Local file system (`/public/uploads/` or `/storage/`)
- **Production Options**:
  - **AWS S3** (recommended for scalability)
  - **Cloudinary** (good for PDFs + preview)
  - **DigitalOcean Spaces** (cost-effective)
  - **Local storage** (if budget-constrained)

### **File Handling**:
- **PDF Processing**: `pdf-lib` or `pdfjs-dist` for previews
- **File Size Limit**: 10MB (as per requirements)
- **File Type**: PDF only
- **Naming Convention**: `{applicationId}_{documentType}_{timestamp}.pdf`

---

## 📧 Email Service

### **Recommended Options**:
1. **Resend** (Recommended for Next.js)
   - Modern API, great DX
   - Free tier: 3,000 emails/month
   - Easy integration

2. **SendGrid**
   - Reliable, good free tier
   - 100 emails/day free

3. **Nodemailer** (Self-hosted)
   - Free but requires SMTP server
   - Good for development/testing

### **Email Templates Needed**:
- Registration verification
- Password recovery
- Application submitted confirmation
- Status change notifications (Returned, Approved, Rejected)
- Payment instructions
- Permit ready for download

---

## 🔔 Real-time Updates & Notifications

### **In-App Notifications**
- **React Context** + **Custom Hook** for notification state
- **Toast Library**: Sonner or react-hot-toast

### **Email Notifications**
- Triggered on status changes
- Queue system: **BullMQ** or **Bull** (Redis-based)

---

## 📊 State Management

### **React Context API** (for global state)
- User authentication state
- Application form state (draft saving)
- Notification state

### **Server State**: 
- **TanStack Query (React Query)** - For API data fetching, caching, synchronization
- **SWR** (alternative) - Simpler, lighter

---

## 🗃️ Data Fetching & API

### **Next.js API Routes** (App Router)
- `/api/auth/*` - Authentication endpoints
- `/api/applications/*` - Application CRUD
- `/api/documents/*` - File upload/download
- `/api/admin/*` - Admin operations
- `/api/notifications/*` - Notification management

### **API Client**:
- **tRPC** (optional but recommended for type-safe APIs)
- **OR** Standard REST with TypeScript types

---

## 🔍 Search & Filtering

### **Client-Side**:
- React Hook Form filters
- Simple text search

### **Server-Side** (Future Enhancement):
- Full-text search with PostgreSQL
- **OR** Algolia/Meilisearch for advanced search

---

## 📱 Responsive Design

### **Mobile-First Approach**
- Tailwind CSS breakpoints
- Touch-friendly file uploads
- Responsive tables (convert to cards on mobile)

---

## 🛡️ Security

### **Security Libraries**:
- **helmet** - Security headers
- **rate-limiter** - API rate limiting (upstash/ratelimit)
- **CSRF Protection** - Built into NextAuth
- **XSS Protection** - React's built-in escaping
- **SQL Injection** - Prisma ORM prevents this

### **File Upload Security**:
- File type validation (MIME type checking)
- File size limits (10MB)
- Virus scanning (optional: ClamAV)
- Secure file storage (outside public directory)

---

## 📦 Package Management

### **npm** or **pnpm** (recommended)
- Faster installs
- Better disk space usage

---

## 🧪 Testing (Optional for MVP)

### **Unit Testing**:
- **Vitest** - Fast, Vite-based
- **React Testing Library** - Component testing

### **E2E Testing** (Future):
- **Playwright** - Modern, reliable

---

## 📝 Code Quality

### **Linting & Formatting**:
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety (mandatory)

### **Git Hooks**:
- **Husky** - Pre-commit hooks
- **lint-staged** - Lint only staged files

---

## 🚀 Deployment

### **Recommended Platforms**:
1. **Vercel** (Best for Next.js)
   - Zero-config deployment
   - Free tier available
   - Built-in CI/CD

2. **Railway** or **Render**
   - Good for full-stack apps
   - PostgreSQL included
   - Reasonable pricing

3. **Self-Hosted** (VPS)
   - DigitalOcean, Linode, AWS EC2
   - More control, requires DevOps knowledge

### **Environment Variables**:
```env
# Database
DATABASE_URL=
DIRECT_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# File Storage
UPLOAD_DIR=/storage/uploads
MAX_FILE_SIZE=10485760

# App
APP_URL=
ADMIN_EMAIL=
```

---

## 📚 Recommended Project Structure

```
sag-permit-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── recover-password/
│   ├── (dashboard)/             # Protected routes
│   │   ├── dashboard/
│   │   ├── applications/
│   │   │   ├── new/
│   │   │   ├── [id]/
│   │   │   └── [id]/edit/
│   │   ├── for-action/
│   │   └── profile/
│   ├── (admin)/                 # Admin routes
│   │   ├── admin/
│   │   ├── applications/
│   │   ├── evaluation/
│   │   └── users/
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── applications/
│   │   ├── documents/
│   │   └── admin/
│   └── layout.tsx
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── forms/                   # Form components
│   ├── application/             # Application-specific
│   └── admin/                   # Admin components
├── lib/                         # Utilities
│   ├── db.ts                    # Prisma client
│   ├── auth.ts                  # NextAuth config
│   ├── email.ts                 # Email utilities
│   ├── upload.ts                # File upload
│   └── utils.ts                 # General utilities
├── prisma/                      # Database schema
│   ├── schema.prisma
│   └── migrations/
├── public/                      # Static assets
├── storage/                     # File uploads (gitignored)
├── types/                       # TypeScript types
└── .env.example
```

---

## 🎯 MVP Development Priority

### **Phase 1: Foundation (Week 1)**
- [ ] Next.js project setup
- [ ] Database schema design (Prisma)
- [ ] Authentication system (NextAuth)
- [ ] Basic UI components (shadcn/ui)
- [ ] User registration & login

### **Phase 2: Core Features (Week 2)**
- [ ] Application creation wizard
- [ ] Document upload system
- [ ] Draft saving functionality
- [ ] Basic dashboard

### **Phase 3: Workflow (Week 3)**
- [ ] Admin panel
- [ ] Evaluation checklist interface
- [ ] Status tracking
- [ ] Email notifications
- [ ] Comments/remarks system

### **Phase 4: Polish (Week 4)**
- [ ] Testing & bug fixes
- [ ] Documentation
- [ ] Deployment preparation
- [ ] Knowledge transfer

---

## 💰 Cost Estimation (Monthly)

### **Development (Free/Open Source)**:
- Next.js, React, Tailwind CSS: **FREE**
- PostgreSQL (local/dev): **FREE**
- Prisma: **FREE**

### **Production Hosting**:
- **Vercel**: Free tier (hobby) or $20/month (pro)
- **Railway/Render**: ~$5-20/month (includes PostgreSQL)
- **File Storage**: 
  - Local: **FREE**
  - AWS S3: ~$0.023/GB/month
  - Cloudinary: Free tier available

### **Email Service**:
- **Resend**: Free tier (3,000 emails/month)
- **SendGrid**: Free tier (100 emails/day)

### **Total Estimated Monthly Cost**: **$0-25** (using free tiers)

---

## 🔄 Migration Path (Future Enhancements)

### **Easy to Add Later**:
- Payment gateway integration (Stripe, PayMongo)
- Advanced reporting (Chart.js, Recharts)
- PDF generation (jsPDF, Puppeteer)
- Real-time updates (WebSockets, Pusher)
- Mobile app (React Native)
- API for third-party integration

---

## 📖 Learning Resources

### **Next.js**:
- Official docs: https://nextjs.org/docs
- Next.js Learn: https://nextjs.org/learn

### **Prisma**:
- Docs: https://www.prisma.io/docs
- Prisma with Next.js: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

### **NextAuth.js**:
- Docs: https://next-auth.js.org/
- NextAuth v5: https://authjs.dev/

---

## ✅ Final Recommendation Summary

**Core Stack**:
- ✅ **Next.js 14+** (App Router)
- ✅ **PostgreSQL** + **Prisma**
- ✅ **NextAuth.js v5**
- ✅ **Tailwind CSS** + **shadcn/ui**
- ✅ **React Hook Form** + **Zod**
- ✅ **Resend** (Email)
- ✅ **Vercel** (Deployment)

**This stack provides**:
- Fast development speed
- Type safety throughout
- Modern developer experience
- Scalability for future growth
- Cost-effective (mostly free/open source)
- Excellent Next.js ecosystem support

---

## 🚦 Next Steps

1. **Initialize Next.js project**: `npx create-next-app@latest`
2. **Set up Prisma**: `npx prisma init`
3. **Install core dependencies**: See `package.json` template below
4. **Design database schema**: Based on requirements
5. **Set up authentication**: NextAuth configuration
6. **Create UI components**: Using shadcn/ui
7. **Build application wizard**: Multi-step form
8. **Implement file upload**: Document management
9. **Build admin panel**: Evaluation workflow
10. **Add email notifications**: Status updates

---

## 📦 Sample package.json

```json
{
  "name": "sag-permit-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.7.0",
    "next-auth": "^5.0.0-beta.4",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "react-dropzone": "^14.2.0",
    "@tanstack/react-query": "^5.12.0",
    "resend": "^2.0.0",
    "bcryptjs": "^2.4.3",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    "prisma": "^5.7.0"
  }
}
```

---

**Ready to start building! 🚀**

