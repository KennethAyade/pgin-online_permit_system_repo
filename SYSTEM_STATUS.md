# SAG Permit Online Application System – Living Status Document

_Last reviewed: 2025-11-14_

This document summarizes the current state of the SAG Permit Online Application System (ISAG/CSAG), how it is structured, what is implemented, and what remains out of scope. It is intended to be kept up to date alongside code and deployment changes.

---

## 1. System Overview

**Purpose**  
End-to-end online application and evaluation system for Industrial Sand and Gravel (ISAG) and Commercial Sand and Gravel (CSAG) permits, for use by MGB Regional Office / PGIN.

**Core capabilities (MVP):**
- Online registration and authentication (applicants + admins)
- Multi-step application wizard for ISAG/CSAG
- Secure PDF document upload and management (10MB limit)
- Draft auto-save and “For Action” flows
- Admin/evaluator review with checklists and remarks
- Application status tracking with full history
- In-app and email notifications
- Basic payment + permit issuance workflow (partially manual in current implementation)

**Primary roles:**
- **Applicant** – creates and submits applications, uploads documents, responds to returns
- **Admin/Evaluator/Reviewer** – performs checks, evaluations, and recommendations
- **PMRB/Regional Director** – final approval and permit issuance

---

## 2. Tech Stack & Architecture (As Implemented)

**Frontend / Backend:**
- Next.js **16** (App Router)
- TypeScript
- React 19

**Data & Backend:**
- PostgreSQL (Prisma Cloud by default)
- Prisma ORM (`prisma/schema.prisma`)
- Next.js route handlers under `app/api/*`

**Auth & Security:**
- NextAuth.js v5 (credentials provider, JWT sessions)
- Bcrypt password hashing
- Role-based access control (user vs admin + admin roles)
- 30-minute session timeout

**UI / UX:**
- Tailwind CSS v4
- shadcn/ui + Radix UI
- lucide-react icon set

**Forms & Validation:**
- React Hook Form
- Zod validation schemas

**Email & Notifications:**
- Nodemailer (SMTP-based; current `.env` wired for Gmail example)
- In-app notifications table + bell/badge UI

**File Upload & Storage:**
- `react-dropzone` front-end upload
- PDF-only, 10MB max validation
- Files stored under `storage/uploads/` (local filesystem; upgradeable to cloud)

**Key directories (from `README.md` / `WARP.md`):**
- `app/`
  - `(auth)/` – login, register, email verification, password recovery/reset
  - `(dashboard)/` – applicant dashboard (applications, for-action, profile)
  - `(admin)/admin` – admin panel (stats, applications, users)
  - `api/` – route handlers for auth, applications, documents, comments, notifications, admin
- `components/`
  - `admin/`, `application/`, `forms/`, `layout/`, `shared/`, `ui/`
- `lib/`
  - `auth.ts`, `db.ts`, `email.ts`, `upload.ts`, `constants.ts`, `utils.ts`, `validations/`
- `prisma/`
  - `schema.prisma`, `seed.ts`
- `types/` – shared TypeScript types
- `storage/uploads/` – file storage (gitignored)
- `context/` – planning & architecture docs (not runtime code)

---

## 3. Functional Status

### 3.1 High-Level Implementation Status

According to `IMPLEMENTATION_SUMMARY.md` and `README.md`:

- All planned MVP implementation phases are **completed**.
- System is **feature-complete for MVP**, with:
  - Full applicant onboarding and login
  - Multi-step ISAG/CSAG application wizard with auto-save
  - Comprehensive document upload and management
  - Admin dashboard and application review panel
  - Evaluation checklist flows with remarks and history
  - Decision actions (approve, reject, return)
  - In-app notifications and email notifications
  - Professional, responsive UI aligned with government branding

Status label: **Ready for system testing and deployment configuration**.

> Note: `context/FEATURE_CHECKLIST.md` still contains initial “0%” placeholders; **it is outdated** relative to `IMPLEMENTATION_SUMMARY.md`. Treat the implementation summary + main `README.md` as authoritative for current status.

### 3.2 Applicant Features

**Implemented:**
- Registration with validation and email verification
- Login/logout with credential checks
- Password recovery + reset via token
- Profile management (view + change password; some profile edits)
- Dashboard with:
  - Application stats and recent applications
  - Quick actions (start new application, resume drafts)
  - For-Action inbox for returned/needs-revision applications
- Application wizard with 7 steps:
  1. Permit type selection (ISAG vs CSAG)
  2. Project information
  3. Proponent information
  4. Project details (area, footprint, employees, cost)
  5. Mandatory document upload (with ISAG-only EPEP)
  6. Other requirements upload
  7. Review & submit (with completeness validation)
- Draft auto-save (debounced) with ability to resume
- Application tracking with status timeline and comments view

**Not implemented / out-of-scope for now:**
- Online payment gateway integration (payments are modeled but process is largely manual)
- Applicant-facing advanced reporting or analytics

### 3.3 Admin / Evaluator Features

**Admin dashboard:**
- Overview statistics (pending, approved, returned, ISAG/CSAG breakdown)
- Quick access to application tables and filters

**Application management:**
- Full application list with filters (status, permit type, date, search)
- Detail view with applicant info, documents, status history, comments

**Evaluation & decisions:**
- ISAG/CSAG-specific evaluation checklists (document verification, other requirements, technical review)
- Compliant/non-compliant marking with per-item remarks
- Evaluation history and summary
- Decision actions:
  - Approve
  - Reject (with mandatory reason)
  - Return (with targeted remarks)
- Automatic recording of status changes and decision dates

**Notifications:**
- In-app notifications for key events
- Email notifications for application submission, returns, approvals, rejections, and auth flows

**Role / access model:**
- Admin vs applicant enforced via NextAuth sessions and email-domain checks (e.g. `@mgb`, `@pgin`, `@admin`) and `admin_users` table
- Evaluator/reviewer/PMRB roles modeled in DB (`AdminRole` enum) and surfaced in evaluation flows

### 3.4 Workflow & Status Model

**Primary lifecycle (user-facing):**
- `DRAFT` → `SUBMITTED` → `INITIAL_CHECK` → `TECHNICAL_REVIEW` → `FOR_FINAL_APPROVAL` → `APPROVED` → `PERMIT_ISSUED`
- `RETURNED` and `REJECTED` handled as branches with full audit trail

**Status tracking:**
- `application_status_history` table records all transitions (from/to status, who changed, role, remarks, timestamp)
- UI components visualize status timeline and key dates

---

## 4. Data Model & Persistence

The Prisma schema (see `context/DATABASE_SCHEMA.md` and `prisma/schema.prisma`) defines the domain model.

**Key models:**
- `User` – applicant accounts, including profile, verification, and recovery tokens
- `AdminUser` – MGB/PGIN staff with roles (ADMIN, EVALUATOR, REVIEWER, PMRB, REGIONAL_DIRECTOR)
- `Application` – core ISAG/CSAG applications (types, project data, status, payment and permit fields)
- `Document` – uploaded PDFs, with type, versioning, and multi-set support
- `ApplicationStatusHistory` – status change log
- `Comment` – threaded comments/remarks, including internal-only comments
- `Evaluation` & `EvaluationChecklistItem` – evaluation records and checklist items per application and evaluation type
- `Notification` – in-app + email notification records
- `SystemSettings` – configurable system-level settings (e.g., max file size, allowed types, fees)

**Indexes and performance:**
- Indexed by user, status, permitType, and applicationNo for fast dashboard queries
- Indexed notification fields for unread/recipient queries

**Current state:**  
Schema is fully defined and wired to a PostgreSQL database (Prisma Cloud by default in `.env`). Database seeding (`npm run db:seed`) creates baseline admin/evaluator/test accounts and supporting data.

---

## 5. Security & Compliance

From `README.md` and `IMPLEMENTATION_SUMMARY.md`:

**Implemented controls:**
- Password hashing with bcrypt (no plain-text storage)
- JWT-based sessions with 30-minute max age
- Role-based access control for UI and API
- Protected API routes (server-side session checks)
- File upload validation (PDF-only, size limit 10MB)
- SQL injection protection via Prisma ORM
- XSS protection via React default escaping
- CSRF protection handled by NextAuth
- Secure session management and logout

**Considerations / future work:**
- Optional encryption of particularly sensitive fields (e.g., financial data) if required
- Extended audit logging for admin activities (beyond status history)
- Hardening of file storage (migration to cloud object storage with signed URLs)

---

## 6. Environments, Configuration & Scripts

**Local development status:**
- Node and npm project fully configured (`package.json`)
- Prisma scripts and seed in place
- `.env` pre-populated with working Prisma Cloud DB + example Gmail SMTP (must be updated for your own credentials)
- Verified commands (from `README.md`, `SETUP_GUIDE.md`, and `WARP.md`):

Scripts:
- `npm run dev` – start development server (`http://localhost:3000`)
- `npm run build` – generate Prisma client then build Next.js
- `npm run start` – start production server
- `npm run lint` – run ESLint
- `npm run db:generate` – generate Prisma client
- `npm run db:push` – push schema to DB
- `npm run db:migrate` – create/apply dev migrations
- `npm run db:studio` – open Prisma Studio
- `npm run db:seed` – seed DB (admin/evaluator/test user accounts)

**Test accounts (after seeding):**
- Admin: `admin@mgb.gov.ph` / `Admin@123`
- Evaluator: `evaluator@mgb.gov.ph` / `Evaluator@123`
- Test user: `test@example.com` / `User@123`

**Production readiness checklist (remaining work):**
- [ ] Configure production database (set `DATABASE_URL`/`DIRECT_URL`)
- [ ] Generate and set new `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL` to the production URL
- [ ] Configure production SMTP (host, port, username, password, from address)
- [ ] Deploy to Vercel or equivalent
- [ ] Configure domain and SSL
- [ ] Set up backups and monitoring

---

## 7. Testing Status

**Automated tests:**
- No dedicated `npm test` or automated test suite configured at this time.
- Quality assurance is currently manual, via flows described in `README.md` and `SETUP_GUIDE.md`.

**Manual flows (currently used):**
- Applicant journey: register → verify email → login → create application → upload docs → submit → track status
- Admin journey: login as admin → dashboard review → open applications → evaluate via checklist → approve/reject/return
- File upload checks: PDF-only, size limit, replacement, and delete flows
- Email checks: verification, password reset, and application-status notifications

**Recommended next steps:**
- Introduce minimal integration tests for core flows (auth, application submission, admin decisions)
- Add smoke tests around API routes for applications/documents/auth
- Consider end-to-end tests using Playwright or Cypress for the main applicant/admin paths

---

## 8. Known Gaps & Out-of-Scope Items

Based on `context/README.md`, `FEATURE_CHECKLIST.md`, and current implementation:

**Intentionally out-of-scope for MVP (not implemented):**
- Online **payment gateway integration** (payments are represented in the data model but handled manually)
- Automated **permit PDF generation** and advanced document templating
- Advanced reporting & analytics (beyond basic dashboard stats)
- Multi-level hierarchical routing and complex workflow automation
- Integration with external government systems
- Mobile application / offline capabilities
- Public APIs for third-party integrations

These can be added as post-MVP enhancements if required.

---

## 9. Documentation Map

Existing key docs and their purpose:

- `README.md` – authoritative high-level overview, features, scripts, user/admin flows
- `IMPLEMENTATION_SUMMARY.md` – detailed list of what is currently implemented and confirmed complete
- `SETUP_GUIDE.md` – quick setup and testing guide for local environment
- `WARP.md` – guidance for AI/dev tools working in this repo
- `context/README.md` – original project overview and planning
- `context/DATABASE_SCHEMA.md` – full Prisma-based data model design
- `context/FEATURE_CHECKLIST.md` – initial feature planning checklist (now outdated; superseded by implementation summary)
- `context/QUICK_START_GUIDE.md` – initial setup guide for a fresh Next.js project
- `context/TECH_STACK_RECOMMENDATION.md` – rationale for the chosen stack and alternatives

---

## 10. How to Keep This Document “Living”

When making significant changes, update this file in tandem with code and other docs:

- **New features:**
  - Add to Sections 3 (Functional Status) and 8 (Known Gaps) as appropriate.
- **Schema changes:**
  - Update Section 4 and ensure `context/DATABASE_SCHEMA.md` and `prisma/schema.prisma` stay in sync.
- **Security changes:**
  - Reflect in Section 5.
- **Deployment changes (new environments, hosts, or processes):**
  - Update Sections 6 and 7.
- **New non-MVP scope decisions:**
  - Capture in Section 8 so stakeholders see what’s in/out of scope.

Always bump the "Last reviewed" date at the top when you meaningfully revise this file.