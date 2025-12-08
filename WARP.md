# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

SAG Permit Online Application System for Industrial/Commercial Sand and Gravel permits (ISAG/CSAG) for MGB / PGIN. It is a Next.js 16 (App Router) + TypeScript application using Prisma with PostgreSQL, NextAuth v5, Tailwind v4, shadcn/ui, and Nodemailer.

The authoritative, always-up-to-date technical reference is `SYSTEM_STATUS_REPORT.md` (system architecture, workflows, status, and recent changes). The top-level `README.md` is a shorter entry point; `TESTING_GUIDE.md` and `tests/README.md` document automated tests.

## Essential commands

All commands assume Node.js 20+, npm, and a configured PostgreSQL database.

### Install & local development

- Install dependencies:
  - `npm install`
- Generate Prisma client (also runs automatically on install and build):
  - `npm run db:generate`
- Apply database schema (development):
  - `npm run db:push`
- Seed demo data (creates admin/evaluator/test users):
  - `npm run db:seed`
- Start development server (App + API on `http://localhost:3000`):
  - `npm run dev`

### Database utilities

- Open Prisma Studio:
  - `npm run db:studio`
- Create a migration (development only):
  - `npm run db:migrate`
- Reset database to a clean seeded state (used by tests and troubleshooting):
  - `npm run db:reset`

### Build & production

- Production build (runs `prisma generate` then `next build`):
  - `npm run build`
- Start production server (after `npm run build`):
  - `npm run start`

Deployment- and cron-specific details (endpoints, schedules, required env vars) are in `SYSTEM_STATUS_REPORT.md` under **DEPLOYMENT GUIDE** and **Cron Job Configuration**.

### Tests

Tests use Jest (unit/API/component), Playwright (E2E/visual), and bespoke TSX-based workflow tests.

**Jest + Playwright test suites (see `TESTING_GUIDE.md` and `tests/README.md` for details):**

- Run all Jest tests:
  - `npm test`
  - or `npm run test:all`
- Unit tests only:
  - `npm run test:unit`
- API integration tests:
  - `npm run test:api`
- Component tests:
  - `npm run test:components`
- E2E tests (requires dev server running):
  - `npm run test:e2e`
- Visual regression tests:
  - `npm run test:visual`
- Coverage report:
  - `npm run test:coverage`
- Watch mode during development:
  - `npm run test:watch`

**Custom workflow / API scenario runners (TSX):**

These directly execute TypeScript test runners in `tests/` using `tsx`:

- Full batch upload + parallel review workflow:
  - `npm run test:workflow`
- Acceptance requirements API tests:
  - `npm run test:api:acceptance`
- Other documents API tests:
  - `npm run test:api:other-docs`

**Running a single Jest test file or test name (beyond predefined scripts):**

- Single file, e.g. a specific component test:
  - `npm test -- tests/components/registration-form.test.tsx`
- Single test by name pattern:
  - `npm test -- -t "Acceptance requirements API"`

When tests manipulate data, use `npm run db:reset` beforehand to ensure a clean database, and confirm `DATABASE_URL` / test DB env vars match what the guide expects.

## High-level architecture

### Framework & entrypoints

- Next.js App Router under `app/`:
  - `(auth)/`: authentication-related pages (login, registration, email verification, password recovery/reset).
  - `(dashboard)/`: applicant-facing dashboard, application list/detail, 7-step wizard, "for action" views, and profile pages.
  - `(admin)/`: admin dashboard, applications list, user management, and admin layouts.
  - `api/`: 38+ API routes implementing all back-end behavior (auth, users, applications, documents, acceptance requirements, other documents, admin flows, and cron endpoints). Route lists and semantics are documented in `SYSTEM_STATUS_REPORT.md` under **API ARCHITECTURE**.

Global layout and styles live in `app/layout.tsx` and `app/globals.css`.

### Domain layers

- **Database / Prisma (`prisma/schema.prisma`)**
  - Core enums: `ApplicationStatus`, `PermitType`, `DocumentType`, `NotificationType`, `AcceptanceRequirementStatus`, `AcceptanceRequirementType`, `OtherDocumentStatus`, etc.
  - Key models:
    - `User` / `AdminUser` (accounts and roles).
    - `Application` (lifecycle and status management, including coordinate and document state).
    - `Document`, `AcceptanceRequirement`, `OtherDocument` (document + requirement tracking for the two-phase workflow).
    - `Evaluation`, `EvaluationChecklistItem` (manual compliance evaluation), `ApplicationStatusHistory`, `Comment`, `Notification`, and coordinate history / consent models.
  - Any change to workflow statuses or requirement types should be coordinated between this schema, the API routes in `app/api/**`, and the UI components under `components/admin` and `components/application`.

- **Backend services (`lib/`)**
  - `auth.ts`: NextAuth v5 configuration and auth helpers.
  - `db.ts`: Prisma client singleton; all database access should flow through this.
  - `email.ts`: Nodemailer-based email sending for 15+ notification types.
  - `upload.ts`: abstractions around document file handling (uses `@vercel/blob`).
  - `utils.ts`: shared utility functions (e.g., working-day deadline calculations that underpin auto-accept and voiding behavior).
  - `constants.ts` and `lib/constants/philippines-divisions.ts`: application-level constants and full Philippine administrative division dataset (regions, provinces, cities, barangays).
  - `validations/`: Zod schemas for auth and application input validation.
  - `geo/`: GIS-specific utilities:
    - `dms-utils.ts`, `coordinate-validation.ts`, and `polygon-helpers.ts` handle coordinate parsing/validation and geometric operations.
    - `overlap-detection.ts` implements polygon overlap detection used by coordinate-review APIs and admin overlap checks.
  - `services/`:
    - `coordinate-history.ts`: tracks historical coordinate changes and their statuses.
    - `philippines-address-api.ts`: service for address-related lookups.

- **HTTP/API layer (`app/api/**`)**

  Organized roughly by domain; `SYSTEM_STATUS_REPORT.md` contains the authoritative route table. The most important clusters for workflow changes are:

  - `app/api/applications/**`: creation, draft auto-save, submission, coordinate validation, and status management.
  - `app/api/documents/upload/route.ts`: central document upload endpoint. Its allowed `ApplicationStatus` set is critical for when users can upload acceptance or other documents.
  - `app/api/acceptanceRequirements/**` and `app/api/otherDocuments/**`: user-facing initialization and submission of acceptance and other documents.
  - `app/api/admin/acceptanceRequirements/**` and `app/api/admin/otherDocuments/**`: admin review of requirements and other documents, including parallel review queues.
  - `app/api/admin/applications/[id]/evaluate/route.ts`: evaluation API that now owns **manual compliance marking** using checklist data (see latest `SYSTEM_STATUS_REPORT.md` version history for details).
  - `app/api/cron/checkAutoAcceptDeadlines` and `.../checkRevisionDeadlines`: cron endpoints enforcing 14-working-day rules for auto-accept and application voiding.

  When implementing business-rule changes, keep API behavior consistent with the workflows described in `SYSTEM_STATUS_REPORT.md` (e.g., batch upload with parallel review, two-phase acceptance/other-documents flows, and deadline rules).

### UI layer (`components/`)

- **Admin UI (`components/admin/`)**
  - `acceptance-requirements-queue.tsx`: admin queue for acceptance requirements with deadline indicators and Accept/Reject actions.
  - `overlap-consent-manager.tsx` / `coordinate-review-queue.tsx`: admin-facing coordinate overlap review and consent handling.
  - `evaluation-checklist.tsx`: manual document evaluation checklist; now the single source of truth for marking requirements `isCompliant` / non-compliant in conjunction with the `evaluate` API.
  - `admin-dashboard.tsx`, `application-table.tsx`, `admin-application-details.tsx`, `admin-sidebar.tsx`: dashboard, listing and navigation components.

- **Applicant/application UI (`components/application/` & `components/forms/`)**
  - `application-wizard.tsx`: 7-step application wizard orchestrating the full applicant flow, including coordinate gating, batch document upload, and submission.
  - Step components (`step-project-coordinates.tsx`, `step-acceptance-docs.tsx`, `step-other-requirements.tsx`, etc.) each own a distinct part of the wizard.
  - `coordinate-point-manager.tsx` and `components/map/*`: coordinate entry UX and map visualization, including DMS/decimal handling and overlap visualization.
  - `acceptance-requirements-section.tsx` / `other-documents-section.tsx`: applicant-side views of requirement statuses and upload actions for both phases (acceptance requirements and other documents).
  - Shared visual components for applications: `application-card.tsx`, `application-details.tsx`, `status-badge.tsx`, `status-timeline.tsx`, `document-list.tsx`, `document-upload.tsx`, `comments-section.tsx`.

- **Layout & shared components**
  - `components/layout/*`: global header, sidebar, footer, and route guards (`protected-route.tsx`).
  - `components/shared/*`: cross-cutting UI such as `file-upload-list.tsx`, `notification-bell.tsx`, and loading screens.
  - `components/ui/*`: shadcn/ui primitives; generally do not change behavior here unless altering visual design globally.

- **Pages under `app/(dashboard)` and `app/(admin)`** coordinate these components into full screens. For cross-cutting UX changes (e.g., mobile layout, tab labels, dashboards), check `SYSTEM_STATUS_REPORT.md` sections **USER INTERFACE OVERVIEW** and **Mobile-First Responsive Design** to understand the intended behavior before editing.

### Scripts & automation

- `scripts/reset-database.ts`: used by `npm run db:reset` to wipe and reseed the database.
- `scripts/run-all-tests.ts`: orchestrates running all TSX-based workflow tests.
- `scripts/fix-stuck-other-documents.ts` and `scripts/cleanup-database.ts`: maintenance utilities for repairing data issues noted in the status report.

### Tests

- `tests/README.md`: focused on three core TSX-based workflow/API suites (batch upload workflow, acceptance requirements API, other documents API), including prerequisites and troubleshooting.
- `TESTING_GUIDE.md`: higher-level matrix of Jest and Playwright suites (unit, API, components, E2E, visual) and CI usage.
- `tests/components/*`: Jest + React Testing Library tests for key UI components (e.g., `application-wizard.test.tsx`, `registration-form.test.tsx`).

When modifying core workflows (coordinates, acceptance requirements, other documents, or evaluation), prefer updating or extending the corresponding tests under `tests/workflows/` and `tests/api/` and re-running `npm run test:workflow` and the relevant API tests.

## Documentation & meta-architecture

- `SYSTEM_STATUS_REPORT.md` is the canonical, living system document. It contains:
  - A detailed description of the entire applicant and admin workflows (including batch upload + parallel review, two-phase document handling, and evaluation),
  - API route inventories,
  - File structure summaries,
  - Version history with per-change rationales and file/line references.
- `TESTING_GUIDE.md` and `tests/README.md` define how automated testing is organized and how CI runs tests.
- `context/` and `docs/` contain broader project documentation (e.g., feature checklists, database schema notes, tech stack rationale, and the ÆtherLight pattern library in `docs/patterns/`). These are mainly for human readers; only modify pattern-library files when explicitly asked to extend or update patterns.
- `internal/agents/README.md` describes a hierarchical agent-context architecture used in other tooling (e.g., spawning specialized agents). When acting via Warp, you can treat `WARP.md` + the above system docs as your primary context; you do not need to replicate that multi-agent setup unless the user requests it.

In all cases, prefer aligning behavior and new changes with the workflows and invariants described in `SYSTEM_STATUS_REPORT.md`, and update that document if you introduce meaningful workflow or architecture changes.