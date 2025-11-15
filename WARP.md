# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Commands

### Install & Local Development
- Install dependencies:
  - `npm install`
- Start dev server (Next.js App Router):
  - `npm run dev`
  - Default URL: `http://localhost:3000`

### Database (Prisma + PostgreSQL)
- Generate Prisma Client (keep in sync with `prisma/schema.prisma`):
  - `npm run db:generate`
- Push schema to the configured database (non-destructive when possible):
  - `npm run db:push`
- Run interactive migrations during development:
  - `npm run db:migrate`
- Open Prisma Studio (inspect/edit data, verify seed/test users):
  - `npm run db:studio`
- Seed database with test data (admin/evaluator/test user accounts):
  - `npm run db:seed`
- Hard reset DB schema and re-seed (use with care):
  - `npm run db:push -- --force-reset`
  - `npm run db:seed`

### Build, Lint, and Production
- Lint (ESLint, config in `eslint.config.mjs`):
  - `npm run lint`
- Build (runs `prisma generate` then compiles Next.js app):
  - `npm run build`
- Start production server (after `npm run build`):
  - `npm run start`

### Testing
- There is **no automated test script** configured (no `npm test` or equivalent) as of now.
- Testing is done via manual flows described in `README.md` and `SETUP_GUIDE.md` (e.g., using seeded accounts to run through applicant/admin workflows).

## Environment & Configuration
- Environment variables are managed via `.env` (see `README.md` and `.env.example` if present):
  - PostgreSQL connection (`DATABASE_URL`, `DIRECT_URL`)
  - NextAuth (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
  - SMTP/email (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, etc.).
- The repository is currently wired to a Prisma Cloud PostgreSQL instance in the default `.env`; update credentials/URLs when pointing to a different environment.

## High-Level Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma
- **Auth**: NextAuth.js v5 (credentials provider, JWT sessions)
- **UI**: React + Tailwind CSS v4 + shadcn/ui + Radix UI
- **Forms & Validation**: React Hook Form + Zod
- **Email**: Nodemailer (SMTP)
- **File Uploads**: `react-dropzone` with local storage under a `storage/uploads/` directory

Authoritative overviews: `README.md`, `IMPLEMENTATION_SUMMARY.md`, `SETUP_GUIDE.md`, and `context/README.md`.

### Code Organization (Big Picture)
- `app/` (Next.js App Router)
  - Route groups implement the main user experiences:
    - `(auth)/` – login, registration, email verification, password recovery/reset.
    - `(dashboard)/` – applicant dashboard: application list, status tracking, profile, "for action" items.
    - `(admin)/` – admin panel: high-level stats, application tables, evaluation/decision workflows.
  - `app/api/*` – route handlers backing UI flows:
    - `/auth` – authentication, password reset, email verification.
    - `/applications` – CRUD/draft autosave/submission for permit applications.
    - `/documents` – upload, download, replacement, and deletion of PDF documents.
    - `/admin/*` – admin-only endpoints for evaluations, decisions, and dashboard metrics.

- `components/`
  - Feature-oriented React components; key groupings:
    - `admin/` – admin dashboards, tables, evaluation/decision UIs.
    - `application/` – multi-step application wizard, status timelines, application detail views.
    - `forms/` – reusable form building blocks (React Hook Form + Zod wrappers).
    - `layout/` – shared layout shells (headers, sidebars, page containers, etc.).
    - `shared/` – generic UI pieces used across applicant/admin surfaces.
    - `ui/` – shadcn/ui primitives and design-system-level components.
  - When extending UI, prefer composing from `ui/` + `forms/` + feature folders instead of introducing ad-hoc styles.

- `lib/`
  - Cross-cutting infrastructure and utilities:
    - `auth.ts` – NextAuth configuration (credentials provider, session strategy, role handling).
    - `db.ts` – singleton Prisma client used by API routes and server components.
    - `email.ts` – SMTP/Nodemailer integration and email template helpers.
    - `upload.ts` – file upload handling and validation (PDF-only, size limits).
    - `constants.ts` – shared constants (statuses, roles, configuration flags).
    - `utils.ts` – general-purpose helpers.
    - `validations/` – Zod schemas for forms, API payloads, and domain objects.

- `prisma/`
  - `schema.prisma` – source of truth for domain data model:
    - `users`, `admin_users`, `applications`, `documents`, `application_status_history`, `comments`, `evaluations`, `evaluation_checklist_items`, `notifications`, `system_settings`, etc.
  - `seed.ts` – seeds admin/evaluator/test accounts and baseline data for local testing.

- `types/`
  - Shared TypeScript types for domain entities and API payloads, used across components and route handlers.

- `context/`
  - High-level planning and documentation (architecture, schema, checklists, tech stack recommendations, etc.).
  - Treat this as design/reference material; update only when requirements change, not as part of typical feature work.

### Domain & Workflow Modeling
- **Roles & Access Control**
  - Applicant vs Admin is enforced via NextAuth sessions and role checks in both UI and API layers.
  - Admin identification uses email patterns (e.g., `@mgb`, `@pgin`, `@admin`) and/or entries in `admin_users`.

- **Application Lifecycle**
  - Modeled in the DB and surfaced in the UI as a status timeline.
  - Core statuses include: `DRAFT`, `SUBMITTED`, `INITIAL_CHECK`, `TECHNICAL_REVIEW`, `FOR_FINAL_APPROVAL`, `APPROVED`, `RETURNED`, `REJECTED`, `PERMIT_ISSUED`.
  - Transitions are triggered by API routes under `app/api/applications/*` and `app/api/admin/*` and logged in `application_status_history`.

- **Documents & Validation**
  - Documents are stored as records linked to applications and constrained to PDF files with a 10MB limit.
  - Mandatory/optional document sets differ slightly between ISAG and CSAG; these rules are encoded across Zod schemas, UI wizard steps, and server-side validation.

- **Notifications & Email**
  - `notifications` table holds in-app notifications (e.g., status changes, returned applications, approvals/rejections).
  - Email templates and sending logic live in `lib/email.ts` and are invoked from relevant auth/application/admin actions.

## Warp Usage Notes
- When adding or modifying features:
  - Reuse existing route groups and component folders (`(auth)`, `(dashboard)`, `(admin)`, `components/application`, `components/admin`, etc.) to keep the structure coherent.
  - Align new fields/statuses with the Prisma schema and extend Zod schemas and TypeScript types in `lib/validations/` and `types/` accordingly.
- Consult these docs for additional context before large changes:
  - `README.md` – end-to-end overview, scripts, and user/admin flows.
  - `IMPLEMENTATION_SUMMARY.md` – what is already implemented and where the main capabilities live conceptually.
  - `SETUP_GUIDE.md` – how to bring up a complete local environment and test flows with seeded accounts.
  - `context/README.md` and linked files – original architecture, schema, and requirement documents.
- There are currently no CLAUDE, Cursor, or Copilot rule files in this repo; this `WARP.md` is the primary agent-specific guidance.