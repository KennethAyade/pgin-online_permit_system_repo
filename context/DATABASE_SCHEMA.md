# SAG Permit System - Database Schema Design

## Overview
This document outlines the database schema for the SAG Permit Online Application System using Prisma ORM with PostgreSQL.

---

## 📊 Entity Relationship Diagram (Conceptual)

```
Users (Applicants)
    ↓ (1:N)
Applications (ISAG/CSAG)
    ↓ (1:N)
Documents
    ↓ (1:N)
ApplicationStatusHistory
    ↓ (1:N)
CommentsRemarks

AdminUsers (MGB Staff)
    ↓ (1:N)
Evaluations
    ↓ (1:N)
EvaluationChecklistItems
```

---

## 🗄️ Database Tables

### **1. Users (Applicants)**

Stores applicant/user account information.

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String   // Hashed with bcrypt
  fullName      String   // Used as username for login
  birthdate     DateTime
  mobileNumber  String?
  
  // Business Information
  companyName   String?
  address       String?
  
  // Government ID
  governmentIdUrl String?
  
  // Account Status
  emailVerified Boolean  @default(false)
  emailVerificationToken String?
  passwordResetToken     String?
  passwordResetExpires   DateTime?
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  applications  Application[]
  notifications Notification[]
  
  @@map("users")
}
```

---

### **2. Applications**

Stores permit applications (ISAG/CSAG).

```prisma
model Application {
  id            String   @id @default(cuid())
  applicationNo String  @unique @default(uuid()) // Auto-generated tracking number
  
  // Permit Type
  permitType   PermitType // ISAG or CSAG
  
  // Applicant Information
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Project Information
  projectName  String?
  projectArea  Decimal? // Numeric value only
  footprintArea Decimal?
  numEmployees Int?
  projectCost  Decimal?
  
  // Application Status
  status       ApplicationStatus @default(DRAFT)
  
  // Current Step (for draft applications)
  currentStep  Int      @default(1)
  
  // Submission
  submittedAt  DateTime?
  submittedTo  String?  // Default recipient (PGIN/MGB Regional Office)
  
  // Evaluation
  assignedTo  String?  // Admin/Evaluator ID
  evaluatedBy String?   // Admin who evaluated
  reviewedBy  String?   // Reviewer ID
  approvedBy  String?   // PMRB/Regional Director ID
  
  // Decision
  decision     Decision? // APPROVED, REJECTED, RETURNED
  decisionDate DateTime?
  decisionReason String? // For rejections
  
  // Payment
  paymentStatus PaymentStatus @default(PENDING)
  orderOfPaymentUrl String?
  paymentReceiptUrl String?
  paymentDate  DateTime?
  
  // Permit
  permitNumber String?  // Auto-generated upon approval
  permitUrl    String?  // Signed permit PDF
  permitIssuedAt DateTime?
  
  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  documents    Document[]
  statusHistory ApplicationStatusHistory[]
  comments     Comment[]
  evaluations  Evaluation[]
  notifications Notification[]
  
  @@index([userId])
  @@index([status])
  @@index([permitType])
  @@index([applicationNo])
  @@map("applications")
}

enum PermitType {
  ISAG
  CSAG
}

enum ApplicationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  INITIAL_CHECK
  TECHNICAL_REVIEW
  FOR_FINAL_APPROVAL
  FOR_ACTION
  APPROVED
  REJECTED
  RETURNED
  PAYMENT_PENDING
  PERMIT_ISSUED
}

enum Decision {
  APPROVED
  REJECTED
  RETURNED
}

enum PaymentStatus {
  PENDING
  PAID
  VERIFIED
}
```

---

### **3. Documents**

Stores uploaded documents for each application.

```prisma
model Document {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  // Document Information
  documentType  DocumentType
  documentName  String
  fileName      String   // Original filename
  fileUrl       String   // Storage path/URL
  fileSize      Int      // Bytes
  mimeType      String   // Should be application/pdf
  
  // Document Set (for requirements that need 5 sets)
  setNumber     Int?     // 1-5 for documents requiring multiple sets
  
  // Status
  isRequired    Boolean  @default(true)
  isComplete    Boolean  @default(false)
  remarks       String?  // Admin remarks
  
  // Version Control
  version       Int      @default(1) // Increments on replacement
  replacedAt    DateTime?
  
  // Timestamps
  uploadedAt    DateTime @default(now())
  uploadedBy    String   // User ID
  
  @@index([applicationId])
  @@index([documentType])
  @@map("documents")
}

enum DocumentType {
  // Mandatory Requirements
  APPLICATION_FORM
  SURVEY_PLAN
  LOCATION_MAP
  WORK_PROGRAM
  IEE_REPORT
  EPEP // ISAG only
  PROOF_TECHNICAL_COMPETENCE
  PROOF_FINANCIAL_CAPABILITY
  ARTICLES_INCORPORATION
  OTHER_SUPPORTING_PAPERS
  
  // Other Requirements
  AREA_STATUS_CLEARANCE_CENRO
  AREA_STATUS_CLEARANCE_MGB
  CERTIFICATE_POSTING_BARANGAY
  CERTIFICATE_POSTING_MUNICIPAL
  CERTIFICATE_POSTING_PROVINCIAL
  CERTIFICATE_POSTING_CENRO
  CERTIFICATE_POSTING_PENRO
  CERTIFICATE_POSTING_MGB
  ECC
  SANGGUNIAN_ENDORSEMENT_BARANGAY
  SANGGUNIAN_ENDORSEMENT_MUNICIPAL
  SANGGUNIAN_ENDORSEMENT_PROVINCIAL
  FIELD_VERIFICATION_REPORT
  SURETY_BOND
  
  // Additional/Returned Documents
  ADDITIONAL_DOCUMENT
  REVISED_DOCUMENT
}
```

---

### **4. ApplicationStatusHistory**

Audit trail for application status changes.

```prisma
model ApplicationStatusHistory {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  // Status Change
  fromStatus    ApplicationStatus?
  toStatus      ApplicationStatus
  changedBy     String   // User/Admin ID
  changedByRole String   // applicant, admin, evaluator, pmrb
  
  // Remarks
  remarks       String?
  
  // Attachments (evaluation reports, etc.)
  attachmentUrl String?
  
  // Timestamps
  createdAt     DateTime @default(now())
  
  @@index([applicationId])
  @@index([toStatus])
  @@map("application_status_history")
}
```

---

### **5. Comments**

Comments and remarks system for communication.

```prisma
model Comment {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  // Comment Details
  content       String   @db.Text
  commentType   CommentType @default(REMARK)
  
  // Author
  authorId      String
  authorRole    String   // applicant, admin, evaluator, pmrb
  authorName    String
  
  // Reply/Thread
  parentId      String?  // For threaded comments
  parent        Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies       Comment[] @relation("CommentReplies")
  
  // Visibility
  isInternal    Boolean  @default(false) // Admin-only comments
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([applicationId])
  @@index([parentId])
  @@map("comments")
}

enum CommentType {
  REMARK
  CLARIFICATION
  REVISION_REQUEST
  APPROVAL_NOTE
  REJECTION_REASON
}
```

---

### **6. AdminUsers**

MGB/PMRB staff accounts.

```prisma
model AdminUser {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String   // Hashed with bcrypt
  
  // Personal Information
  fullName      String
  position      String   // Evaluator, Reviewer, PMRB, Regional Director
  department    String?   // MGB, PMRB, etc.
  
  // Role & Permissions
  role          AdminRole @default(EVALUATOR)
  permissions   Json?     // Flexible permission system
  
  // Account Status
  isActive      Boolean  @default(true)
  emailVerified Boolean @default(false)
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  evaluations   Evaluation[]
  assignedApplications Application[] @relation("AssignedApplications")
  
  @@map("admin_users")
}

enum AdminRole {
  ADMIN
  EVALUATOR
  REVIEWER
  PMRB
  REGIONAL_DIRECTOR
}
```

---

### **7. Evaluations**

Evaluation records for each application.

```prisma
model Evaluation {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  // Evaluator
  evaluatorId   String
  evaluator     AdminUser @relation(fields: [evaluatorId], references: [id])
  
  // Evaluation Type
  evaluationType EvaluationType
  
  // Checklist
  checklistItems EvaluationChecklistItem[]
  
  // Summary
  isCompliant   Boolean?
  summary       String?  @db.Text
  
  // Signatures
  evaluatedBy   String?  // Name
  evaluatedSignature String? // Digital signature or file URL
  evaluatedDate DateTime?
  
  reviewedBy    String?
  reviewedSignature String?
  reviewedDate  DateTime?
  
  approvedBy    String?
  approvedSignature String?
  approvedDate  DateTime?
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([applicationId, evaluationType])
  @@index([applicationId])
  @@index([evaluatorId])
  @@map("evaluations")
}

enum EvaluationType {
  INITIAL_CHECK
  TECHNICAL_REVIEW
  FINAL_APPROVAL
}
```

---

### **8. EvaluationChecklistItem**

Individual checklist items for evaluations.

```prisma
model EvaluationChecklistItem {
  id            String   @id @default(cuid())
  evaluationId  String
  evaluation    Evaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  
  // Checklist Item
  itemNumber    Int
  itemName      String
  category      ChecklistCategory
  
  // Status
  isComplete    Boolean  @default(false)
  isCompliant   Boolean?
  remarks       String?
  
  // Timestamps
  checkedAt     DateTime?
  checkedBy     String?
  
  @@index([evaluationId])
  @@map("evaluation_checklist_items")
}

enum ChecklistCategory {
  DOCUMENT_VERIFICATION
  OTHER_REQUIREMENTS
  TECHNICAL_REVIEW
}
```

---

### **9. Notifications**

System notifications for users and admins.

```prisma
model Notification {
  id            String   @id @default(cuid())
  
  // Recipient
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  adminUserId   String?  // For admin notifications
  
  // Related Application
  applicationId String?
  application   Application? @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  // Notification Details
  type          NotificationType
  title         String
  message      String   @db.Text
  link          String?  // URL to related page
  
  // Status
  isRead        Boolean  @default(false)
  readAt        DateTime?
  
  // Email
  emailSent     Boolean  @default(false)
  emailSentAt   DateTime?
  
  // Timestamps
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([adminUserId])
  @@index([applicationId])
  @@index([isRead])
  @@map("notifications")
}

enum NotificationType {
  APPLICATION_SUBMITTED
  APPLICATION_RETURNED
  APPLICATION_APPROVED
  APPLICATION_REJECTED
  PAYMENT_REQUIRED
  PERMIT_READY
  STATUS_CHANGED
  COMMENT_ADDED
  DOCUMENT_REQUIRED
}
```

---

### **10. SystemSettings**

System-wide settings and configuration.

```prisma
model SystemSettings {
  id            String   @id @default(cuid())
  key           String   @unique
  value         String   @db.Text
  description   String?
  updatedAt     DateTime @updatedAt
  updatedBy     String?
  
  @@map("system_settings")
}
```

**Example Settings**:
- `max_file_size`: "10485760" (10MB in bytes)
- `allowed_file_types`: "application/pdf"
- `default_recipient`: "PGIN Regional Office"
- `surety_bond_amount`: "20000"
- `application_fee`: "5000"

---

## 📋 Complete Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ... All models above ...

// Additional relation for Application assignment
model Application {
  // ... existing fields ...
  assignedAdmin AdminUser? @relation("AssignedApplications", fields: [assignedTo], references: [id])
}
```

---

## 🔍 Indexes for Performance

### **Critical Indexes**:
- `applications.userId` - Fast user dashboard queries
- `applications.status` - Filter by status
- `applications.permitType` - Filter ISAG/CSAG
- `documents.applicationId` - Fast document retrieval
- `application_status_history.applicationId` - Audit trail queries
- `notifications.userId + isRead` - Unread notifications

---

## 🔄 Database Migrations Strategy

### **Initial Migration**:
```bash
npx prisma migrate dev --name init
```

### **Migration Naming Convention**:
- `YYYYMMDD_description` (e.g., `20240115_add_payment_fields`)

---

## 📊 Sample Queries

### **Get User's Applications**:
```typescript
const applications = await prisma.application.findMany({
  where: { userId: userId },
  include: {
    documents: true,
    statusHistory: {
      orderBy: { createdAt: 'desc' },
      take: 1
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

### **Get Applications for Admin Dashboard**:
```typescript
const pendingApps = await prisma.application.findMany({
  where: {
    status: {
      in: ['SUBMITTED', 'UNDER_REVIEW', 'INITIAL_CHECK']
    }
  },
  include: {
    user: {
      select: { fullName: true, email: true }
    },
    documents: {
      where: { documentType: 'APPLICATION_FORM' },
      take: 1
    }
  },
  orderBy: { submittedAt: 'desc' }
});
```

### **Get Application with Full Details**:
```typescript
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: {
    user: true,
    documents: {
      orderBy: { documentType: 'asc' }
    },
    statusHistory: {
      orderBy: { createdAt: 'desc' },
      include: {
        changedByUser: true
      }
    },
    comments: {
      include: {
        replies: true
      },
      orderBy: { createdAt: 'desc' }
    },
    evaluations: {
      include: {
        checklistItems: true,
        evaluator: true
      }
    }
  }
});
```

---

## 🔐 Security Considerations

1. **Password Hashing**: Always use bcrypt (never store plain text)
2. **Sensitive Data**: Consider encrypting certain fields (e.g., financial info)
3. **Audit Trail**: All status changes logged in `ApplicationStatusHistory`
4. **Soft Deletes**: Consider adding `deletedAt` field for important records
5. **File URLs**: Store relative paths, not absolute URLs (security)

---

## 📈 Future Enhancements

### **Potential Additions**:
- `PaymentTransactions` table (if payment gateway integrated)
- `PermitRenewals` table (for permit renewals)
- `FieldVerifications` table (detailed field verification records)
- `Reports` table (generated reports)
- `ActivityLogs` table (detailed audit logs)

---

**Schema is ready for implementation! 🚀**

