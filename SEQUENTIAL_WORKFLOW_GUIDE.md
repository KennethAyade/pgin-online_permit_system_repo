# Acceptance Requirements - Sequential Workflow Guide

## 🎯 CORE CONCEPT: STEP-BY-STEP, NOT ALL AT ONCE

The acceptance requirements workflow is **strictly sequential**. Users CANNOT submit all requirements at once or skip ahead. Each requirement must be completed individually in the specified order.

---

## 📊 USER JOURNEY (Step-by-Step)

### STEP 1: User Registers Account

```
User visits /register
     ↓
Selects Account Type: INDIVIDUAL or CORPORATE
     ↓
Enters Personal Information (name, email, password, birthdate, phone)
     ↓
Selects Address (cascading dropdowns):
  - Region (required)
  - Province (requires Region selected)
  - City/Municipality (requires Province selected)
  - Barangay (requires City selected)
     ↓
Accepts Terms & Conditions
     ↓
Submits Registration
     ↓
Account Created ✓
```

**Files Involved**:
- `components/forms/registration-form.tsx` (UI)
- `app/api/users/register/route.ts` (API)
- `lib/constants/philippines-divisions.ts` (Address data)

**Database Updated**:
- User record created with: accountType, region, province, city, barangay

---

### STEP 2: User Creates New Application

```
User logs in → Dashboard
     ↓
Clicks "Create New Application"
     ↓
Selects Permit Type: ISAG or CSAG
     ↓
Fills Application Form (project details)
     ↓
Submits Application
     ↓
Application Created with Status: DRAFT
```

---

### STEP 3: Application Enters Acceptance Requirements Phase

```
Admin reviews application
     ↓
Admin clicks "Move to Acceptance Requirements"
     ↓
API Call: POST /api/acceptanceRequirements/initialize
     ↓
System creates requirements:
  - ISAG: 11 requirements
  - CSAG: 10 requirements
     ↓
All requirements initialize with:
  - Status: PENDING_SUBMISSION
  - Order: 1, 2, 3, ... N
  - All locked except first
     ↓
Application Status: ACCEPTANCE_IN_PROGRESS
     ↓
application.currentAcceptanceRequirementId = ID of Requirement #1
     ↓
User notified: "Acceptance requirements are ready"
```

**Files Involved**:
- `app/api/acceptanceRequirements/initialize/route.ts` (Initialize API)

---

### STEP 4: User Submits Requirements ONE AT A TIME

#### ⚠️ KEY: Sequential Submission

**THE RULE**:
- Only 1 requirement can be submitted at a time
- User can ONLY submit the current requirement (tracked by `currentAcceptanceRequirementId`)
- Previous requirements must be ACCEPTED before next unlocks
- Future requirements are LOCKED and cannot be selected

#### Timeline for ISAG (11 Requirements):

```
TIME    REQUIREMENT    STATUS              USER ACTION
────────────────────────────────────────────────────────
Day 1   Req #1         PENDING_SUBMISSION  ► SUBMIT (Text: Coordinates)
        Req #2         PENDING_SUBMISSION  [LOCKED]
        Req #3         PENDING_SUBMISSION  [LOCKED]
        ... (Req 4-11) PENDING_SUBMISSION  [LOCKED]

Day 2   Req #1         PENDING_REVIEW      (Admin reviewing)
        Req #2         PENDING_SUBMISSION  [LOCKED]
        Req #3         PENDING_SUBMISSION  [LOCKED]
        ... (Req 4-11) PENDING_SUBMISSION  [LOCKED]

Day 3   Req #1         ACCEPTED ✓          (Admin approved)
                       (Deadline: ✓ auto-accepted in 10 days)
        Req #2         PENDING_SUBMISSION  ► SUBMIT (File: Application Form)
        Req #3         PENDING_SUBMISSION  [LOCKED]
        ... (Req 4-11) PENDING_SUBMISSION  [LOCKED]

Day 4   Req #1         ACCEPTED ✓
        Req #2         PENDING_REVIEW      (Admin reviewing)
        Req #3         PENDING_SUBMISSION  [LOCKED]
        ... (Req 4-11) PENDING_SUBMISSION  [LOCKED]

Day 5   Req #1         ACCEPTED ✓
        Req #2         ACCEPTED ✓          (Admin approved)
        Req #3         PENDING_SUBMISSION  ► SUBMIT (File: Survey Plan)
        Req #4         PENDING_SUBMISSION  [LOCKED]
        ... (Req 5-11) PENDING_SUBMISSION  [LOCKED]

... (Continue pattern until all 11 submitted)

Day N   Req #1-10      ACCEPTED ✓✓✓...✓    (All approved)
        Req #11        PENDING_REVIEW      (Admin reviewing last)

Day N+1 Req #1-11      ACCEPTED ✓✓✓...✓    (All approved)
                                            ✓ Application COMPLETE
```

---

### STEP 5: Individual Requirement Submission Detail

#### How to Submit a Single Requirement

```
User navigates to: /applications/[id]
     ↓
Clicks "Acceptance Requirements" tab
     ↓
Sees list of all 11 (or 10) requirements with status badges:

REQUIREMENT #1: Project Coordinates      [PENDING_SUBMISSION] ← Current
REQUIREMENT #2: Application Form         [PENDING_SUBMISSION] [LOCKED]
REQUIREMENT #3: Survey Plan              [PENDING_SUBMISSION] [LOCKED]
... etc

     ↓
Clicks on Requirement #1 (only one that's unlocked)
     ↓
Submission Form Appears:

  ┌─────────────────────────────────────┐
  │ PROJECT COORDINATES                  │
  │ "Enter your project coordinates..."  │
  │                                       │
  │ Latitude:  [____________]             │
  │ Longitude: [____________]             │
  │                                       │
  │ [Cancel] [Submit Requirement]        │
  └─────────────────────────────────────┘

     ↓
User Enters Data
     ↓
User Clicks "Submit Requirement"
     ↓
API Call: POST /api/acceptanceRequirements/submit
  {
    requirementId: "req-1-id",
    submittedData: "14.5994,121.0437",
    submittedFileUrl: null,
    submittedFileName: null
  }
     ↓
BACKEND PROCESSING:
  - Validate user is authenticated
  - Validate requirement exists & belongs to this application
  - Validate requirement status is PENDING_SUBMISSION or REVISION_REQUIRED
  - Validate data is not empty
  - Change status: PENDING_SUBMISSION → PENDING_REVIEW
  - Record submittedAt, submittedBy: "applicant"
  - Set autoAcceptDeadline = now() + 10 days
  - Create notification: REQUIREMENT_PENDING_REVIEW
  - Return success
     ↓
FRONTEND SHOWS:
  ✓ "Requirement submitted successfully"
  ✓ Form clears
  ✓ Requirement #1 shows as PENDING_REVIEW (yellow)
  ✓ Auto-deselect (after 2 seconds)
     ↓
REQUIREMENT #1 STATUS: PENDING_REVIEW
REQUIREMENT #2 STATUS: PENDING_SUBMISSION [STILL LOCKED]

(Waiting for admin to review Requirement #1)
```

#### Example: File Upload Requirement

```
(Continuing from above... Admin approved Requirement #1)

     ↓
User Clicks on Requirement #2 (now unlocked)
     ↓
Submission Form Appears:

  ┌──────────────────────────────────────┐
  │ APPLICATION FORM (MGB Form 8-4)      │
  │ "Upload Application Form..."         │
  │                                       │
  │ [Choose File...]  [Browse]           │
  │ No file selected                      │
  │                                       │
  │ [Cancel] [Submit Requirement]        │
  │            (disabled)                 │
  └──────────────────────────────────────┘

     ↓
User Clicks "Choose File"
     ↓
File Dialog Opens
     ↓
User Selects: "MGB-Form-8-4.pdf"
     ↓
Form Shows:
  [✓] MGB-Form-8-4.pdf (2.3 MB)

  [Upload Progress: ████████░░ 80%]
     ↓
File Uploaded to Storage
     ↓
User Clicks "Submit Requirement"
     ↓
API Call: POST /api/acceptanceRequirements/submit
  {
    requirementId: "req-2-id",
    submittedData: null,
    submittedFileUrl: "https://storage.../files/mgb-form-8-4.pdf",
    submittedFileName: "MGB-Form-8-4.pdf"
  }
     ↓
BACKEND PROCESSING: (same as above)
  - Validate file exists
  - Change status: PENDING_SUBMISSION → PENDING_REVIEW
  - Record submittedAt, submittedFileUrl, submittedFileName
  - Set autoAcceptDeadline = now() + 10 days
     ↓
REQUIREMENT #2 STATUS: PENDING_REVIEW (yellow)
REQUIREMENT #3 STATUS: PENDING_SUBMISSION [STILL LOCKED]

(Process repeats for Requirements 3-11)
```

---

## 🔒 LOCKING MECHANISM (Why Sequential)

### Why Requirements Are Locked

```
The system prevents users from jumping ahead by checking:

✓ Requirement #1: Unlocked (order = 1, first requirement)
✓ Requirement #2: Locked (previous requirement status ≠ ACCEPTED)
✓ Requirement #3: Locked (previous requirement status ≠ ACCEPTED)

Only when Requirement #1.status = ACCEPTED:
✓ Requirement #2: Unlocked (previous requirement ACCEPTED)
✓ Requirement #3: Locked (previous requirement status ≠ ACCEPTED)

Only when Requirement #2.status = ACCEPTED:
✓ Requirement #3: Unlocked (previous requirement ACCEPTED)
✓ Requirement #4: Locked (previous requirement status ≠ ACCEPTED)
```

### Visual Representation

```
REQUIREMENT STATUS INDICATORS:

🔓 UNLOCKED (Current) - User can submit now
  - Show submit form
  - Show "Current" badge
  - Fully interactive

🔓 UNLOCKED (Completed) - User can view/edit
  - Show as completed ✓
  - Show submitted date
  - Allow re-view or re-download

🔒 LOCKED (Waiting for Previous) - User cannot interact
  - Show as grayed out
  - Show "Awaiting Previous Requirement" message
  - No submit form available
  - Click does nothing
  - Show lock icon 🔒
```

---

## ⏱️ DEADLINE SCENARIOS

### Scenario 1: Normal Acceptance (Happy Path)

```
Day 1  → User Submits Requirement #1
         Status: PENDING_SUBMISSION → PENDING_REVIEW
         Deadline Set: 10 days from now

Day 2  → Admin Reviews & ACCEPTS Requirement #1
         Status: PENDING_REVIEW → ACCEPTED ✓
         Requirement #2 Unlocked

Day 3  → User Submits Requirement #2
         Status: PENDING_SUBMISSION → PENDING_REVIEW
         Deadline Set: 10 days from now

Day 4  → Admin Reviews & ACCEPTS Requirement #2
         Status: PENDING_REVIEW → ACCEPTED ✓
         Requirement #3 Unlocked

... (Continue for all requirements)

Day 30 → All Requirements Completed ✓
         Application Status: ACCEPTANCE_IN_PROGRESS → UNDER_REVIEW
         Notification: "All requirements completed"
```

### Scenario 2: Auto-Accept (Admin Delay)

```
Day 1  → User Submits Requirement #1
         Deadline: Day 11 (10 days out)

Days 2-10 → Admin is busy, doesn't review

Day 11 → CRON JOB RUNS: checkAutoAcceptDeadlines
         Status: PENDING_REVIEW → ACCEPTED ✓ (AUTO-ACCEPTED)
         isAutoAccepted: true
         Requirement #2 Unlocked
         Notification: "Your requirement was automatically accepted
                        due to admin evaluation timeout"

... (User can continue submitting)
```

### Scenario 3: Rejection & Revision (Unhappy Path)

```
Day 1  → User Submits Requirement #1
         Deadline: Day 11

Day 4  → Admin Reviews & REJECTS Requirement #1
         Status: PENDING_REVIEW → REVISION_REQUIRED
         Revision Deadline: Day 18 (14 days out)
         Requirement #1 UNLOCKED for resubmission
         Requirement #2 Remains LOCKED
         Notification: "Requirement rejected. Admin remarks: [details].
                        Resubmit by Day 18"

Day 6  → User Resubmits Requirement #1
         Status: REVISION_REQUIRED → PENDING_REVIEW
         New Deadline: Day 16

Day 8  → Admin Reviews & ACCEPTS Requirement #1
         Status: PENDING_REVIEW → ACCEPTED ✓
         Requirement #2 Unlocked
         Notification: "Requirement accepted. Proceed to next"

Day 9  → User Submits Requirement #2
         ... (Continue normally)
```

### Scenario 4: Revision Deadline Expires (Critical Path)

```
Day 1  → User Submits Requirement #1
         Deadline: Day 11

Day 4  → Admin Reviews & REJECTS Requirement #1
         Revision Deadline: Day 18

Days 5-17 → User is busy, doesn't resubmit
            Countdown showing on UI: "3 days left", then "1 day left"

Day 18 → CRON JOB RUNS: checkRevisionDeadlines
         Status: REVISION_REQUIRED → VOIDED
         Application Status: ANY → VOIDED ⚠️
         isVoided: true
         voidedAt: Day 18 timestamp
         voidReason: "Revision deadline expired"
         Notification: "Your application has been voided due to
                        expiration of revision deadline.
                        Please submit a new application."

Result: User must START OVER with new application ❌
```

---

## 👨‍💼 ADMIN QUEUE WORKFLOW

### How Admin Reviews Requirements

```
Admin logs in → Admin Dashboard
     ↓
Clicks "Acceptance Requirements Queue" tab
     ↓
Sees table of all PENDING_REVIEW requirements:

┌────────────────┬───────────┬──────┬──────────────┬────────────┬──────────────┐
│ App No.        │ Project   │ Type │ Requirement  │ Applicant  │ Days Left    │
├────────────────┼───────────┼──────┼──────────────┼────────────┼──────────────┤
│ APP-2025-001   │ Mining X  │ ISAG │ Requirement  │ John Doe   │ 8 days ✓     │
│                │           │      │ #2: Survey   │ john@...   │              │
├────────────────┼───────────┼──────┼──────────────┼────────────┼──────────────┤
│ APP-2025-002   │ Mining Y  │ CSAG │ Requirement  │ Jane Smith │ 2 days ⚠️    │
│                │           │      │ #1: Coords   │ jane@...   │              │
├────────────────┼───────────┼──────┼──────────────┼────────────┼──────────────┤
│ APP-2025-003   │ Mining Z  │ ISAG │ Requirement  │ Bob Jones  │ 6 days ✓     │
│                │           │      │ #3: Location │ bob@...    │              │
└────────────────┴───────────┴──────┴──────────────┴────────────┴──────────────┘

Pagination: Page 1 of 3  [Previous] [Next]
Filter:     [All] [ISAG] [CSAG]

     ↓
Admin Clicks "Review" Button on First Requirement
     ↓
Review Panel Expands:

┌──────────────────────────────────────────┐
│ REQUIREMENT REVIEW PANEL                 │
├──────────────────────────────────────────┤
│ Application: APP-2025-001                │
│ Project: Mining X                        │
│ Applicant: John Doe (john@email.com)     │
│ Requirement: #2 - Survey Plan            │
│ Submitted: Nov 15, 2025 at 10:30 AM      │
│ File: survey-plan-signed.pdf              │
│ Deadline: Nov 21, 2025 (8 days left) ✓   │
│                                           │
│ Admin Remarks (Optional):                │
│ ┌──────────────────────────────────────┐ │
│ │ [Text area for admin remarks]        │ │
│ │                                      │ │
│ │ E.g., "Please ensure coordinates... │ │
│ │        are certified by PEO..."      │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ [Accept Requirement] [Reject (Revision)] │
└──────────────────────────────────────────┘

     ↓
Admin Reads Requirement Details
     ↓
Admin Has 2 Choices:

╔═══════════════════════════════════════════════════════════╗
║ CHOICE 1: ACCEPT REQUIREMENT                              ║
╚═══════════════════════════════════════════════════════════╝

Admin Clicks: [Accept Requirement]

BACKEND PROCESSING:
  ✓ Status: PENDING_REVIEW → ACCEPTED
  ✓ Record: reviewedAt, reviewedBy (admin ID), adminRemarks (optional)
  ✓ Find next requirement (order = 2 + 1 = 3)
  ✓ Set application.currentAcceptanceRequirementId = Requirement #3
  ✓ Create notification: REQUIREMENT_ACCEPTED
    Message: "Your requirement #2 (Survey Plan) has been accepted.
              Please proceed to submit Requirement #3 (Location Map)."

FRONTEND:
  ✓ Review panel closes
  ✓ Success message: "Requirement #2 accepted successfully"
  ✓ Table refreshes
  ✓ Requirement removed from queue (no longer PENDING_REVIEW)
  ✓ Next PENDING_REVIEW requirement appears in queue

USER SIDE:
  ✓ Notification badge updated
  ✓ Requirement #3 unlocks in their application
  ✓ Can now submit Requirement #3


╔═══════════════════════════════════════════════════════════╗
║ CHOICE 2: REJECT (REQUEST REVISION)                       ║
╚═══════════════════════════════════════════════════════════╝

Admin Types remarks in text area:
  "The survey plan signatures are unclear. Please resubmit
   with certified signatures from licensed PEO."

Admin Clicks: [Reject (Request Revision)]

BACKEND PROCESSING:
  ✓ Status: PENDING_REVIEW → REVISION_REQUIRED
  ✓ Record: reviewedAt, reviewedBy, adminRemarks (captured from textarea)
  ✓ Set revisionDeadline = now() + 14 days
  ✓ Requirement #2 UNLOCKED for resubmission
  ✓ Requirement #3 remains LOCKED
  ✓ Create notification: REQUIREMENT_REVISION_NEEDED
    Message: "Your requirement #2 (Survey Plan) needs revision.
              Admin remarks: The survey plan signatures are unclear...
              Please resubmit by Nov 25, 2025."

FRONTEND:
  ✓ Review panel closes
  ✓ Success message: "Requirement #2 rejected, revision requested"
  ✓ Table refreshes
  ✓ Requirement removed from queue (no longer PENDING_REVIEW)

USER SIDE:
  ✓ Notification badge updated
  ✓ Requirement #2 now shows: REVISION_REQUIRED (orange badge)
  ✓ Admin remarks visible
  ✓ Revision deadline countdown: "9 days left"
  ✓ Can resubmit Requirement #2
  ✓ Requirement #3 still locked until #2 resubmitted
  ✓ On resubmit: Status → PENDING_REVIEW (back in admin queue)
```

---

## 📱 USER INTERFACE STATES

### Application Details - Acceptance Requirements Tab

#### State 1: Before First Requirement Submitted

```
ACCEPTANCE REQUIREMENTS

Progress: 0/11 Completed

REQUIREMENT #1: Project Coordinates          [PENDING_SUBMISSION] ← Current
   Description: Enter your project coordinates for verification
   Status: Ready to submit
   [Select]

REQUIREMENT #2: Application Form (MGB 8-4)   [PENDING_SUBMISSION]
   Description: Duly Accomplished Application Form
   Status: Awaiting Previous Requirement ❌ [Locked 🔒]

REQUIREMENT #3: Survey Plan                  [PENDING_SUBMISSION]
   Description: Survey plan signed and sealed by...
   Status: Awaiting Previous Requirement ❌ [Locked 🔒]

... (Requirements 4-11 also locked)
```

#### State 2: First Requirement Submitted (Pending Review)

```
ACCEPTANCE REQUIREMENTS

Progress: 0/11 Completed

REQUIREMENT #1: Project Coordinates          [PENDING_REVIEW] ⏳
   Description: Enter your project coordinates for verification
   Status: Submitted, awaiting admin review
   Submitted: Nov 15, 2025
   Auto-Accept Deadline: Nov 25, 2025 (10 days) ✓
   [View Submission]

REQUIREMENT #2: Application Form (MGB 8-4)   [PENDING_SUBMISSION]
   Description: Duly Accomplished Application Form
   Status: Awaiting Previous Requirement ❌ [Locked 🔒]

REQUIREMENT #3: Survey Plan                  [PENDING_SUBMISSION]
   Description: Survey plan signed and sealed by...
   Status: Awaiting Previous Requirement ❌ [Locked 🔒]

... (Requirements 4-11 also locked)
```

#### State 3: First Requirement Accepted (Can Submit Second)

```
ACCEPTANCE REQUIREMENTS

Progress: 1/11 Completed ✓

REQUIREMENT #1: Project Coordinates          [ACCEPTED] ✓
   Description: Enter your project coordinates for verification
   Status: Approved by admin
   Submitted: Nov 15, 2025
   Reviewed: Nov 16, 2025
   [View Details]

REQUIREMENT #2: Application Form (MGB 8-4)   [PENDING_SUBMISSION] ← Current
   Description: Duly Accomplished Application Form
   Status: Ready to submit
   [Select]

REQUIREMENT #3: Survey Plan                  [PENDING_SUBMISSION]
   Description: Survey plan signed and sealed by...
   Status: Awaiting Previous Requirement ❌ [Locked 🔒]

... (Requirements 4-11 also locked)
```

#### State 4: Requirement Rejected (Revision Needed)

```
ACCEPTANCE REQUIREMENTS

Progress: 1/11 Completed ✓

REQUIREMENT #1: Project Coordinates          [ACCEPTED] ✓
   Status: Approved
   [View Details]

REQUIREMENT #2: Application Form (MGB 8-4)   [REVISION_REQUIRED] ⚠️ ← Current
   Description: Duly Accomplished Application Form
   Status: Rejected - Revision Required
   Submitted: Nov 16, 2025
   Reviewed: Nov 17, 2025

   ADMIN REMARKS:
   "The form is incomplete. Please fill in all required fields
    and ensure company director's signature is present."

   Revision Deadline: Nov 31, 2025 (14 days) ⏰
   [Resubmit] [View Previous]

REQUIREMENT #3: Survey Plan                  [PENDING_SUBMISSION]
   Status: Awaiting Previous Requirement ❌ [Locked 🔒]

... (Requirements 4-11 also locked)
```

---

## 🎯 KEY TAKEAWAYS

### Sequential Submission Rules

1. **ONE AT A TIME**: Only one requirement can be active at any time
2. **IN ORDER**: Must follow numerical sequence (1, 2, 3, ...)
3. **CANNOT SKIP**: Cannot submit #3 until #1 and #2 are accepted
4. **LOCKED FUTURE**: Requirements #2+ are locked until their predecessor is accepted
5. **10-DAY AUTO-ACCEPT**: If admin doesn't review in 10 days, auto-accepts
6. **14-DAY REVISION WINDOW**: If rejected, user has 14 days to resubmit
7. **APPLICATION VOIDING**: Missing 14-day deadline voids entire application

### User Cannot:
- ❌ Submit multiple requirements at once
- ❌ Skip ahead to requirement #5 when #1-#4 aren't done
- ❌ Bypass admin review (except auto-accept on deadline)
- ❌ Recover voided application (must reapply)

### Admin Can:
- ✓ Accept requirement (moves to next)
- ✓ Reject & request revision (gives 14 days)
- ✓ Add remarks/feedback
- ✓ View all pending requirements in queue
- ✓ Filter by permit type

### System Can:
- ✓ Auto-accept on 10-day deadline
- ✓ Void application on 14-day revision deadline
- ✓ Send notifications for all status changes
- ✓ Track complete audit trail
- ✓ Generate deadlines automatically

---

**Visual Timeline Summary**:
```
User Registers
    ↓
User Creates Application
    ↓
Admin Initializes Requirements
    ↓
User Submits Req #1  →  Admin Reviews  →  Auto-accept/Approve  →  Unlock Req #2
    ↓                                                                   ↓
    └─ If Rejected ─ 14-day Resubmit Deadline ─ Can Resubmit  ─────┘

User Submits Req #2  →  Admin Reviews  →  Approve  →  Unlock Req #3
    ↓
[Continue for all requirements]

User Submits Req #11  →  Admin Reviews  →  Approve  →  All Complete ✓
    ↓
Application Moves to UNDER_REVIEW
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Status**: ✅ Step-by-Step Implementation Complete
