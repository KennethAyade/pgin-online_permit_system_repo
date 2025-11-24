# SAG Permit Online Application System

Official online permit application system for Industrial Sand and Gravel (ISAG) and Commercial Sand and Gravel (CSAG) permits, managed by MGB Regional Office / PGIN.

> 📘 **For complete system documentation, see [SYSTEM_STATUS_REPORT.md](SYSTEM_STATUS_REPORT.md)** - the living document that contains all technical details, workflows, and status information.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (or Prisma Cloud account)
- SMTP email server (Gmail, Outlook, etc.)

### Installation

```bash
# 1. Clone and navigate
git clone <repository-url>
cd pgin-online_permit_system_repo

# 2. Install dependencies
npm install

# 3. Set up environment variables (update .env file)
# - MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM_ADDRESS

# 4. Generate Prisma Client
npm run db:generate

# 5. Push database schema
npm run db:push

# 6. Seed database (creates test users)
npm run db:seed

# 7. Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## 🧪 Test Accounts

**Admin:**
- Email: `admin@mgb.gov.ph`
- Password: `Admin@123`
- Access: `/admin`

**User:**
- Email: `test@example.com`
- Password: `User@123`
- Access: `/dashboard`

---

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

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma Cloud)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Email**: Nodemailer (SMTP)

---

## ⭐ Key Features

### For Applicants
- Account registration with Philippine address (Region → Province → City → Barangay)
- 7-step application wizard with auto-save
- **Sequential acceptance requirements** (submit one requirement at a time)
- Document upload (PDF, 10MB max)
- Real-time status tracking
- Email notifications

### For Administrators
- Dashboard with statistics
- **Acceptance requirements review queue** with pagination
- Evaluation checklists (ISAG/CSAG specific)
- Decision management (Approve/Reject/Return)
- Document verification
- User management

### Automated Features
- **10-day auto-accept** if admin doesn't review requirement
- **14-day revision deadline** enforcement (application voided if not resubmitted)
- Email notifications (15 types)
- Draft auto-save every 2 seconds

---

## 📊 Database Models

10 tables:
- users (with account type and cascading address)
- admin_users
- applications
- **acceptance_requirements** ⭐
- documents
- evaluations
- evaluation_checklist_items
- application_status_history
- comments
- notifications

---

## 📖 Documentation

**Main Documentation:**
- **[SYSTEM_STATUS_REPORT.md](SYSTEM_STATUS_REPORT.md)** - Complete system documentation (living document)

**Key Sections:**
- System overview and workflows
- Technical architecture
- API routes (31 endpoints)
- Sequential acceptance requirements
- Deployment guide
- Troubleshooting

---

## 🚀 Deployment

### Production Checklist

1. ✅ Build succeeds (`npm run build`)
2. ⚠️ Configure environment variables
3. ⚠️ Set up cron jobs for automated deadlines
4. ⚠️ Test email delivery
5. ⚠️ Run end-to-end tests

See [SYSTEM_STATUS_REPORT.md](SYSTEM_STATUS_REPORT.md) for detailed deployment instructions.

---

## 🔐 Security Features

- Password hashing (bcrypt)
- JWT session management (30-min timeout)
- Role-based access control
- File upload validation
- SQL injection prevention
- XSS & CSRF protection

---

## 🐛 Troubleshooting

**Database issues:**
```bash
npm run db:generate
npm run db:push
```

**Email not sending:**
- Verify SMTP credentials in `.env`
- For Gmail: Use App Password (not regular password)

**Build errors:**
```bash
rm -rf .next node_modules
npm install
npm run db:generate
```

---

## 📞 Support

- MGB Regional Office / PGIN
- System Administrator: admin@mgb.gov.ph

---

## 📄 License

Official Government System - MGB Regional Office / PGIN

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Status**: Production Ready (pending cron job configuration)

For complete technical documentation, see [SYSTEM_STATUS_REPORT.md](SYSTEM_STATUS_REPORT.md)
