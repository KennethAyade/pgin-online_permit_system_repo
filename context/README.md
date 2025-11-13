# SAG Permit Online Application System

A web-based MVP for digital transformation of Industrial Sand and Gravel (ISAG) and Commercial Sand and Gravel (CSAG) permit application process for government agencies.

---

## 📋 Project Overview

This system enables applicants to submit permit applications online and allows MGB/PMRB administrators to evaluate, review, and approve applications through a streamlined digital workflow.

### **Key Features**:
- ✅ User registration and authentication
- ✅ Multi-step application wizard (ISAG/CSAG)
- ✅ Document upload and management
- ✅ Draft saving functionality
- ✅ Admin evaluation checklist
- ✅ Status tracking and notifications
- ✅ Email notifications
- ✅ Payment and permit issuance workflow

---

## 🗂️ Documentation

### **Planning & Architecture**:
- **[TECH_STACK_RECOMMENDATION.md](./TECH_STACK_RECOMMENDATION.md)** - Complete technology stack recommendation
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema design with Prisma
- **[FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md)** - Detailed feature checklist and implementation guide

### **Getting Started**:
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Step-by-step setup instructions

### **Project Documents**:
- `ADMIN_2.pdf` - Admin workflow documentation
- `USER_2.pdf` - User workflow guide
- `SAG-ADMIN-EVALUATION-CHECKLIST.pdf` - Evaluation checklists
- `Temporary Web Flow for SAG Permit Prototype (1).pdf` - UI flow reference
- `SOFTWARE_20DEVELOPMENT_20AGREEMENT_Kyle_Robillos_Kurt_Casero.pdf` - Development agreement

---

## 🚀 Tech Stack

### **Core**:
- **Next.js 14+** (App Router) - React framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM

### **Authentication**:
- **NextAuth.js v5** - Authentication & session management

### **UI/UX**:
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### **File Management**:
- **react-dropzone** - File uploads
- **Local storage** (upgradeable to cloud)

### **Email**:
- **Resend** - Email service

### **Deployment**:
- **Vercel** (recommended) or Railway/Render

---

## 📊 System Architecture

### **User Roles**:
1. **Applicant** - Submits permit applications
2. **Admin** - Manages applications and users
3. **Evaluator** - Performs initial checks
4. **Reviewer** - Technical review
5. **PMRB/Regional Director** - Final approval

### **Application Flow**:
```
User Registration → Login → Create Application → Upload Documents → Submit
                                                                    ↓
Admin: Initial Check → Technical Review → Final Approval → Payment → Permit Issuance
```

### **Status Workflow**:
```
DRAFT → SUBMITTED → UNDER_REVIEW → INITIAL_CHECK → TECHNICAL_REVIEW 
→ FOR_FINAL_APPROVAL → APPROVED → PAYMENT_PENDING → PERMIT_ISSUED
```

---

## 🗄️ Database Schema

### **Main Tables**:
- `users` - Applicant accounts
- `applications` - Permit applications (ISAG/CSAG)
- `documents` - Uploaded documents
- `application_status_history` - Audit trail
- `comments` - Communication/remarks
- `admin_users` - MGB staff accounts
- `evaluations` - Evaluation records
- `notifications` - System notifications

See **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** for complete schema.

---

## 📝 Permit Types

### **ISAG (Industrial Sand and Gravel)**:
- 5-Year Work Program required
- EPEP (Environmental Protection and Enhancement Program) required
- More comprehensive documentation

### **CSAG (Commercial Sand and Gravel)**:
- 1-Year Work Program required
- No EPEP requirement
- Simplified documentation

---

## 🔐 Security Features

- Password hashing (bcrypt)
- Session management (30-minute timeout)
- File upload validation (type, size)
- SQL injection prevention (Prisma ORM)
- XSS protection (React)
- CSRF protection (NextAuth)
- Role-based access control

---

## 📧 Email Notifications

### **User Notifications**:
- Registration verification
- Password recovery
- Application submitted confirmation
- Status changes (Returned, Approved, Rejected)
- Payment instructions
- Permit ready for download

### **Admin Notifications**:
- New application submitted
- Application requires action
- Pending approvals

---

## 📦 Project Structure

```
sag-permit-system/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # User dashboard
│   ├── (admin)/           # Admin panel
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   └── application/       # Application-specific
├── lib/                   # Utilities
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
└── storage/              # File uploads
```

---

## 🚦 Development Phases

### **Phase 1: Foundation (Week 1)**
- Project setup
- Authentication system
- Basic UI components

### **Phase 2: Application Creation (Week 2)**
- Dashboard
- Application wizard
- Document upload
- Draft management

### **Phase 3: Workflow & Admin (Week 3)**
- Admin panel
- Evaluation checklist
- Status tracking
- Comments system

### **Phase 4: Notifications & Polish (Week 4)**
- Email notifications
- Payment workflow
- Testing & bug fixes
- Documentation

---

## 💰 Cost Estimation

### **Development**: PHP 25,000 (one-time)

### **Monthly Hosting** (Production):
- **Vercel**: Free tier or $20/month (Pro)
- **Railway/Render**: $5-20/month (includes PostgreSQL)
- **File Storage**: Free (local) or ~$5/month (cloud)
- **Email**: Free tier (Resend: 3,000 emails/month)

**Total**: ~$0-25/month (using free tiers)

---

## 🛠️ Quick Start

1. **Clone repository** (when available)
2. **Install dependencies**: `npm install`
3. **Set up database**: See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)
4. **Configure environment**: Copy `.env.example` to `.env`
5. **Run migrations**: `npx prisma migrate dev`
6. **Start dev server**: `npm run dev`

See **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** for detailed setup.

---

## 📚 Key Requirements

### **File Upload**:
- Format: PDF only
- Size: 10MB maximum
- Storage: Local server (upgradeable to cloud)

### **Document Requirements**:
- **ISAG**: 10 mandatory + 6 other requirements
- **CSAG**: 9 mandatory + 6 other requirements
- Multiple sets (5 sets) for certain documents

### **User Experience**:
- Multi-step wizard (7 steps)
- Auto-save drafts
- Real-time status tracking
- Email notifications
- Mobile-responsive design

---

## 🔄 Future Enhancements

### **Not Included in MVP**:
- Payment gateway integration
- Automated permit PDF generation
- Advanced reporting and analytics
- Multi-level routing
- Mobile app
- API for third-party integration

These can be added post-MVP based on requirements.

---

## 📖 Documentation

- **User Manual**: Step-by-step guide for applicants
- **Admin Manual**: Guide for MGB staff
- **Technical Docs**: API documentation, database schema
- **Deployment Guide**: Production deployment instructions

---

## ✅ Acceptance Criteria

The MVP is complete when:
- ✅ All "Fully Included" features are functional
- ✅ All "Partially Included" features work as described
- ✅ System passes basic security testing
- ✅ Documentation is provided
- ✅ Knowledge transfer session completed
- ✅ Critical bugs fixed

---

## 🤝 Development Team

- **Developer**: Kyle Robillos, Kurt Casero
- **Client**: PGIN / MGB Regional Office
- **Timeline**: 1 month (4 weeks)
- **Budget**: PHP 25,000

---

## 📞 Support

For questions or issues:
- Review documentation in `/docs` folder
- Check [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) for feature status
- Refer to [TECH_STACK_RECOMMENDATION.md](./TECH_STACK_RECOMMENDATION.md) for technical details

---

## 📄 License

Proprietary - All rights reserved by Client upon full payment.

---

## 🎯 Next Steps

1. ✅ Review all documentation
2. ✅ Set up development environment (see QUICK_START_GUIDE.md)
3. ✅ Implement database schema (see DATABASE_SCHEMA.md)
4. ✅ Start with Phase 1 features (see FEATURE_CHECKLIST.md)
5. ✅ Follow development phases week by week

---

**Ready to build! 🚀**

For detailed information, refer to the individual documentation files listed above.

