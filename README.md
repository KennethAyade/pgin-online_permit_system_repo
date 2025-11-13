# SAG Permit Online Application System

Official online permit application system for Industrial Sand and Gravel (ISAG) and Commercial Sand and Gravel (CSAG) permits, managed by MGB Regional Office / PGIN.

## 🚀 Features

### For Applicants
- **Online Registration** - Create account with email verification
- **Application Wizard** - Step-by-step guided application process
- **Document Upload** - Secure PDF document management (max 10MB)
- **Real-time Tracking** - Monitor application status
- **Email Notifications** - Receive updates on application progress
- **Draft Auto-save** - Never lose your progress

### For Administrators
- **Dashboard** - Overview of all applications and statistics
- **Application Review** - Comprehensive evaluation tools
- **Evaluation Checklist** - ISAG/CSAG specific checklists
- **Decision Management** - Approve, reject, or return applications
- **Document Verification** - View and verify uploaded documents
- **Status Management** - Track application workflow

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma Cloud)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **Email**: Nodemailer (SMTP)
- **File Upload**: react-dropzone

## 📋 Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (or Prisma Cloud account)
- SMTP email server (Gmail, Outlook, etc.)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pgin-online_permit_system_repo
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

The `.env` file is already configured with:
- Database URLs (Prisma Cloud)
- NextAuth secret
- SMTP settings (Gmail)

Update the following if needed:
- `MAIL_USERNAME` - Your email address
- `MAIL_PASSWORD` - Your SMTP password/app password
- `MAIL_FROM_ADDRESS` - Sender email address

4. **Generate Prisma Client**
```bash
npm run db:generate
```

5. **Push database schema**
```bash
npm run db:push
```

6. **Seed the database** (Optional - creates test users)
```bash
npm run db:seed
```

This creates:
- Admin: `admin@mgb.gov.ph` / `Admin@123`
- Evaluator: `evaluator@mgb.gov.ph` / `Evaluator@123`
- Test User: `test@example.com` / `User@123`

7. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 Usage

### User Flow

1. **Register** - Create account at `/register`
2. **Verify Email** - Check email for verification link
3. **Login** - Sign in at `/login`
4. **Create Application** - Start new application at `/applications/new`
5. **Upload Documents** - Upload required PDFs
6. **Submit** - Review and submit application
7. **Track Status** - Monitor progress in dashboard

### Admin Flow

1. **Login** - Use admin credentials (email with @mgb, @pgin, or @admin)
2. **Dashboard** - View statistics at `/admin`
3. **Review Applications** - Access applications at `/admin/applications`
4. **Evaluate** - Use evaluation checklist
5. **Decision** - Approve, reject, or return applications

## 🗂️ Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── recover-password/
│   │   ├── reset-password/
│   │   └── verify-email/
│   ├── (dashboard)/         # User dashboard
│   │   ├── dashboard/
│   │   ├── applications/
│   │   ├── for-action/
│   │   └── profile/
│   ├── (admin)/             # Admin panel
│   │   └── admin/
│   │       ├── applications/
│   │       └── users/
│   └── api/                 # API routes
│       ├── auth/
│       ├── applications/
│       ├── documents/
│       ├── users/
│       ├── comments/
│       ├── notifications/
│       └── admin/
├── components/
│   ├── admin/               # Admin components
│   ├── application/         # Application components
│   ├── forms/               # Form components
│   ├── layout/              # Layout components
│   ├── shared/              # Shared components
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client
│   ├── email.ts             # Email service
│   ├── upload.ts            # File upload utilities
│   ├── constants.ts         # App constants
│   ├── utils.ts             # Utility functions
│   └── validations/         # Zod schemas
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeder
└── types/                   # TypeScript types
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT session management (30-minute timeout)
- Role-based access control (User/Admin)
- File upload validation (PDF only, 10MB max)
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF protection
- Secure file storage

## 📊 Database Schema

### Main Tables
- `users` - Applicant accounts
- `admin_users` - Admin/evaluator accounts
- `applications` - Permit applications
- `documents` - Uploaded documents
- `application_status_history` - Status tracking
- `comments` - Comments and remarks
- `evaluations` - Admin evaluations
- `evaluation_checklist_items` - Checklist items
- `notifications` - System notifications
- `system_settings` - System configuration

## 🎨 UI Design

Professional government-style interface:
- **Color Scheme**: Blue-700 primary, professional grays
- **Typography**: System fonts, clear hierarchy
- **Components**: Consistent, accessible, modern
- **Layout**: Clean, organized, intuitive
- **Responsive**: Mobile-friendly design

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
   - `MAIL_USERNAME=your-email@gmail.com`
   - `MAIL_PASSWORD=your-app-password`

### Other SMTP Providers
Update `.env` with your provider's settings:
- `MAIL_HOST` - SMTP server
- `MAIL_PORT` - SMTP port (587 for TLS, 465 for SSL)
- `MAIL_ENCRYPTION` - tls or ssl

## 🧪 Testing

### Test Accounts (after seeding)

**Admin Account**
- Email: `admin@mgb.gov.ph`
- Password: `Admin@123`
- Access: `/admin`

**Test User Account**
- Email: `test@example.com`
- Password: `User@123`
- Access: `/dashboard`

### Test Flow

1. Login as test user
2. Create new application
3. Upload documents
4. Submit application
5. Login as admin
6. Review and evaluate application
7. Approve/reject/return

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with test data
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL=<your-production-db-url>
DIRECT_URL=<your-production-db-url>
NEXTAUTH_SECRET=<generate-new-secret>
NEXTAUTH_URL=<your-production-url>
MAIL_HOST=<smtp-host>
MAIL_PORT=<smtp-port>
MAIL_USERNAME=<smtp-username>
MAIL_PASSWORD=<smtp-password>
MAIL_FROM_ADDRESS=<sender-email>
```

## 📖 Documentation

### Application Workflow

1. **DRAFT** - Application created, not submitted
2. **SUBMITTED** - Application submitted by applicant
3. **INITIAL_CHECK** - Initial document verification
4. **TECHNICAL_REVIEW** - Technical evaluation
5. **FOR_FINAL_APPROVAL** - Awaiting final approval
6. **APPROVED** - Application approved
7. **RETURNED** - Returned to applicant for corrections
8. **REJECTED** - Application rejected
9. **PERMIT_ISSUED** - Permit generated and issued

### Document Requirements

**ISAG (Industrial Sand and Gravel)**
- Application Form (MGB Form 8-4)
- Survey Plan
- Location Map
- 5-Year Work Program
- IEE Report
- EPEP (Environmental Protection and Enhancement Program)
- Proof of Technical Competence
- Proof of Financial Capability
- Articles of Incorporation
- Other Supporting Papers

**CSAG (Commercial Sand and Gravel)**
- Same as ISAG except:
  - 1-Year Work Program (instead of 5-year)
  - No EPEP required

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Check database is accessible
- Run `npm run db:push` to sync schema

### Email Not Sending
- Verify SMTP credentials
- Check firewall/security settings
- For Gmail, use App Password (not regular password)

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Regenerate Prisma Client: `npm run db:generate`

## 📞 Support

For technical issues or questions, contact:
- MGB Regional Office / PGIN
- System Administrator: admin@mgb.gov.ph

## 📄 License

Official Government System - MGB Regional Office / PGIN

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Developed for**: MGB Regional Office / PGIN
