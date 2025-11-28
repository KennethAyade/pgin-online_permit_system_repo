# Batch Upload Workflow - Testing Guide

This guide provides comprehensive instructions for testing the batch upload workflow with parallel review system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Automated Tests](#automated-tests)
3. [Manual Frontend Tests](#manual-frontend-tests)
4. [Admin Testing](#admin-testing)
5. [Deadline Testing](#deadline-testing)
6. [Edge Cases](#edge-cases)

---

## Prerequisites

### Test Accounts

Ensure these accounts exist in your database:

**User Account:**
- Email: `sagkurtkyle@gmail.com`
- Password: `SAGthesis101`

**Admin Account:**
- Email: `admin@mgb.gov.ph`
- Password: `Admin@123`

### Database Setup

Run the database reset script to start with clean data:

```bash
npm run db:reset
```

This will:
- ✅ Remove all dummy data
- ✅ Keep only the two test accounts above
- ✅ Clear all applications, documents, and notifications

---

## Automated Tests

### 1. Complete Workflow Test

This test simulates the entire user journey from start to finish.

**Run:**
```bash
npx tsx tests/workflows/batch-upload-workflow.test.ts
```

**What it tests:**
1. ✅ Create application with coordinates
2. ✅ Upload ALL documents at once (batch upload)
3. ✅ Submit application and initialize requirements
4. ✅ Admin reviews documents in parallel (non-sequential order)
5. ✅ Admin rejects some documents
6. ✅ User resubmits only rejected documents
7. ✅ Admin accepts resubmitted documents
8. ✅ Other Documents section unlocks
9. ✅ User uploads other documents
10. ✅ Admin reviews other documents
11. ✅ Application moves to UNDER_REVIEW

**Expected result:** All tests pass, application completes workflow

**Cleanup:** Test data is automatically deleted (unless `CLEANUP_AFTER_TEST=false`)

---

### 2. Acceptance Requirements API Test

Tests all acceptance requirements API endpoints.

**Run:**
```bash
npx tsx tests/api/acceptance-requirements.test.ts
```

**What it tests:**
- ✅ Initialize API with batch uploaded documents
- ✅ Documents uploaded during wizard → PENDING_REVIEW
- ✅ Documents not uploaded → PENDING_SUBMISSION
- ✅ Submit requirement API
- ✅ Admin accept requirement API
- ✅ Admin reject requirement API
- ✅ Resubmit rejected requirement API
- ✅ All accepted → unlocks Other Documents

**Expected result:** All API tests pass

---

### 3. Other Documents API Test

Tests all other documents API endpoints.

**Run:**
```bash
npx tsx tests/api/other-documents.test.ts
```

**What it tests:**
- ✅ GET other documents API
- ✅ Submit other document API
- ✅ Admin accept other document API
- ✅ Admin reject other document API
- ✅ Resubmit rejected other document API
- ✅ All accepted → application moves to UNDER_REVIEW

**Expected result:** All API tests pass

---

### Run All Automated Tests

```bash
# Run all tests sequentially
npx tsx tests/workflows/batch-upload-workflow.test.ts && \
npx tsx tests/api/acceptance-requirements.test.ts && \
npx tsx tests/api/other-documents.test.ts
```

---

## Manual Frontend Tests

These tests verify the user interface and user experience.

### Test 1: Application Wizard - Batch Upload

**Steps:**

1. **Login as User**
   - Go to http://localhost:3000
   - Login with `sagkurtkyle@gmail.com` / `SAGthesis101`

2. **Start New Application**
   - Click "New Application"
   - Select permit type: ISAG or CSAG

3. **Step 2: Submit Coordinates**
   - Enter valid coordinates or use map
   - Click "Submit Coordinates for Admin Review"
   - **Expected:** Application locked at Step 2

4. **Admin Approves Coordinates**
   - Logout, login as admin (`admin@mgb.gov.ph` / `Admin@123`)
   - Go to "Coordinate Review Queue"
   - Find application, click "Review"
   - Click "Accept"
   - **Expected:** Coordinates approved

5. **Return to User - Continue Wizard**
   - Logout, login as user
   - Open application (should be in DRAFT status)
   - Continue to Step 3-5 (fill project details, company info, contact)

6. **Step 6: Batch Upload ALL Documents**
   - **Expected:** See upload zones for ALL 10-11 acceptance requirements
   - Upload PDF files for:
     - Mining Rights Document
     - Mineral Profile
     - Miners Affidavit
     - Vicinity Map
     - Surface Rights Document
     - Tax Declaration
     - Environmental Impact Assessment
     - Work Program
     - Socio-Economic Profile
     - Financial Capacity Document
   - **Expected:** Green checkmarks appear for each uploaded file
   - **Expected:** Can delete and re-upload files
   - Click "Save & Continue"

7. **Step 7: Other Requirements**
   - **Expected:** Section is LOCKED
   - **Expected:** See message: "This section will be available after all acceptance requirements are approved"
   - **Expected:** See two-phase workflow visualization
   - **Expected:** Preview of 14 other document types
   - Click "Save & Continue"

8. **Step 8: Review & Submit**
   - Review all information
   - **Expected:** See list of uploaded documents with checkmarks
   - Click "Submit Application"
   - **Expected:** Success message
   - **Expected:** Redirect to application details page

---

### Test 2: Acceptance Requirements - Parallel Review

**Steps:**

1. **View Acceptance Requirements Tab**
   - As user, go to application details
   - Click "Acceptance Requirements" tab
   - **Expected:** See all 11 requirements (ISAG) or 10 (CSAG)
   - **Expected:** Coordinates have green "ACCEPTED" badge
   - **Expected:** Uploaded docs have yellow "PENDING REVIEW" badge
   - **Expected:** See admin review deadline (14 working days)

2. **Admin Reviews in Any Order**
   - Login as admin
   - Go to "Acceptance Requirements Queue"
   - Find application
   - Click any requirement (not sequential) - e.g., #5, then #2, then #8
   - **Expected:** Can review in ANY order (parallel)

3. **Admin Accepts Some Documents**
   - For 3-4 requirements:
     - Click "Review"
     - Enter admin remarks: "Document is compliant"
     - Click "Accept"
   - **Expected:** Status changes to "ACCEPTED"
   - **Expected:** Green badge appears

4. **Admin Rejects Some Documents**
   - For 2-3 requirements:
     - Click "Review"
     - Enter admin remarks: "Missing signatures"
     - Optionally attach file (annotated document)
     - Click "Reject"
   - **Expected:** Status changes to "REVISION REQUIRED"
   - **Expected:** Red badge appears
   - **Expected:** Revision deadline set (14 working days)

5. **User Sees Status**
   - Login as user
   - Go to application details → Acceptance Requirements tab
   - **Expected:** See accepted requirements (green)
   - **Expected:** See rejected requirements (red)
   - **Expected:** See admin remarks for rejected ones
   - **Expected:** See revision deadline countdown

---

### Test 3: Resubmit Rejected Documents

**Steps:**

1. **Click Rejected Requirement**
   - As user, click a requirement with status "REVISION REQUIRED"
   - **Expected:** See admin remarks in yellow alert box
   - **Expected:** See revision deadline warning
   - **Expected:** See upload form

2. **Reupload File**
   - Upload revised PDF file
   - Click "Submit"
   - **Expected:** Success message
   - **Expected:** Status changes to "PENDING REVIEW"
   - **Expected:** New admin review deadline set

3. **Verify Cannot Reupload Accepted Docs**
   - Click a requirement with status "ACCEPTED"
   - **Expected:** NO upload form shown
   - **Expected:** Green checkmark and "ACCEPTED" badge
   - **Expected:** View-only mode

4. **Admin Reviews Resubmitted Doc**
   - Login as admin
   - Find resubmitted requirement in queue
   - Accept or reject again
   - **Expected:** Back-and-forth process works

---

### Test 4: Other Documents Unlock

**Steps:**

1. **Verify Other Documents Tab Hidden**
   - As user, go to application details
   - **Expected:** NO "Other Documents" tab visible
   - **Expected:** Only see: Overview, Acceptance Requirements, Documents, Status, etc.

2. **Admin Accepts All Remaining Requirements**
   - Login as admin
   - Accept ALL pending acceptance requirements
   - **Expected:** All requirements show "ACCEPTED"

3. **Verify Other Documents Tab Appears**
   - Login as user
   - Go to application details
   - **Expected:** "Other Documents" tab NOW VISIBLE
   - **Expected:** Tab has folder icon
   - Click "Other Documents" tab

4. **Upload Other Documents**
   - **Expected:** See list of ~14 other document types
   - **Expected:** See upload zones for each
   - Upload files for:
     - Environmental Compliance Certificate (ECC)
     - LGU Endorsement
     - Community Consent
     - Ancestral Domain Clearance
     - Business Permit
     - (and others...)
   - **Expected:** Green checkmarks for uploaded files
   - Can upload all at once or one-by-one

5. **Submit Other Documents**
   - Click "Submit All Other Documents"
   - **Expected:** Success message
   - **Expected:** Status changes to "PENDING REVIEW"
   - **Expected:** Admin review deadlines set

---

### Test 5: Other Documents Review

**Steps:**

1. **Admin Reviews Other Documents**
   - Login as admin
   - Go to "Other Documents Queue" (if separate) or main queue
   - Find application
   - **Expected:** See all other documents with status PENDING_REVIEW
   - Review in any order (parallel)

2. **Accept/Reject Other Documents**
   - Accept some, reject others
   - **Expected:** Same workflow as acceptance requirements
   - **Expected:** Rejected docs can be resubmitted by user

3. **All Other Documents Accepted**
   - Admin accepts all remaining other documents
   - **Expected:** Application status → "UNDER_REVIEW"
   - **Expected:** Application moves to evaluation phase

---

## Admin Testing

### Admin Dashboard

**Steps:**

1. **Login as Admin**
   - Email: `admin@mgb.gov.ph`
   - Password: `Admin@123`

2. **View Coordinate Review Queue**
   - Click "Coordinate Review Queue" tab
   - **Expected:** See pending coordinate submissions
   - **Expected:** See overlap warnings if coordinates overlap with existing permits

3. **View Acceptance Requirements Queue**
   - Click "Acceptance Requirements Queue" tab
   - **Expected:** See all requirements pending review
   - **Expected:** Can filter by status, permit type, etc.
   - **Expected:** Can click any requirement to review (parallel)

4. **Review Interface**
   - Click "Review" on any requirement
   - **Expected:** See submitted document preview
   - **Expected:** See applicant information
   - **Expected:** Can download submitted file
   - **Expected:** Can enter admin remarks (text)
   - **Expected:** Can upload file (annotated document)
   - **Expected:** "Accept" and "Reject" buttons

5. **Deadline Indicators**
   - **Expected:** See countdown for auto-accept deadline
   - **Expected:** Color coding: Green (>7 days), Yellow (3-7 days), Red (<3 days)
   - **Expected:** Urgent items at top of queue

---

## Deadline Testing

### Test Auto-Accept Deadline

**Note:** This test requires time manipulation or cron job execution.

**Option 1: Time Manipulation (Fast)**

1. Manually update `autoAcceptDeadline` in database to past date:
   ```sql
   UPDATE acceptance_requirement
   SET "autoAcceptDeadline" = NOW() - INTERVAL '1 day'
   WHERE status = 'PENDING_REVIEW';
   ```

2. Trigger cron job manually:
   ```bash
   curl http://localhost:3000/api/cron/checkAutoAcceptDeadlines
   ```

3. **Expected:** Requirements auto-accepted
4. **Expected:** Status changes to "ACCEPTED"
5. **Expected:** `isAutoAccepted` flag set to true
6. **Expected:** Notification sent to applicant

**Option 2: Wait 14 Working Days (Real)**

1. Submit requirement
2. Wait 14 working days
3. Cron job runs daily
4. **Expected:** Auto-acceptance happens

---

### Test Revision Deadline

**Option 1: Time Manipulation (Fast)**

1. Admin rejects requirement
2. Manually update `revisionDeadline` to past date:
   ```sql
   UPDATE acceptance_requirement
   SET "revisionDeadline" = NOW() - INTERVAL '1 day'
   WHERE status = 'REVISION_REQUIRED';
   ```

3. Trigger cron job:
   ```bash
   curl http://localhost:3000/api/cron/checkRevisionDeadlines
   ```

4. **Expected:** Application status → "VOIDED"
5. **Expected:** Requirement marked with `isVoided: true`
6. **Expected:** Notification sent to applicant
7. **Expected:** Further submissions blocked

---

## Edge Cases

### Edge Case 1: Partial Batch Upload

**Scenario:** User uploads only 5 out of 10 documents in Step 6

**Steps:**
1. In wizard Step 6, upload only 5 documents
2. Submit application
3. **Expected:** 5 requirements → PENDING_REVIEW
4. **Expected:** 5 requirements → PENDING_SUBMISSION
5. User can upload remaining 5 later in Acceptance Requirements tab

---

### Edge Case 2: All Documents Rejected

**Scenario:** Admin rejects ALL submitted documents

**Steps:**
1. Admin rejects all pending requirements
2. **Expected:** All show "REVISION REQUIRED" with deadlines
3. User resubmits all documents
4. **Expected:** All back to "PENDING REVIEW"
5. Admin can review again

---

### Edge Case 3: Voided Application Reactivation

**Scenario:** Application voided due to missed deadline

**Steps:**
1. Application status → VOIDED
2. **Expected:** User CANNOT submit new documents
3. **Expected:** "Application Voided" message shown
4. User must create new application

---

### Edge Case 4: Admin Changes Decision

**Scenario:** Admin accepts a document, then realizes it should be rejected

**Steps:**
1. Admin accepts requirement
2. Status → "ACCEPTED"
3. Admin clicks "Change Decision" or reviews again
4. Admin rejects
5. **Expected:** Status changes to "REVISION_REQUIRED"
6. **Expected:** User can resubmit

**Note:** This may require additional UI/API support.

---

### Edge Case 5: File Upload Failures

**Scenario:** File upload fails midway during batch upload

**Steps:**
1. Upload 10 files in Step 6
2. Simulate network error (disconnect WiFi during upload #5)
3. **Expected:** Error message shown
4. **Expected:** Successfully uploaded files (1-4) still saved
5. **Expected:** Can retry failed uploads
6. **Expected:** No data loss

---

### Edge Case 6: Concurrent Admin Reviews

**Scenario:** Two admins review same requirement simultaneously

**Steps:**
1. Admin A opens requirement for review
2. Admin B opens same requirement
3. Admin A accepts
4. Admin B tries to accept
5. **Expected:** Error or warning: "Requirement already reviewed"
6. **Expected:** No duplicate reviews

**Note:** Requires optimistic locking or status check before update.

---

## Visual Verification Checklist

### Colors & Icons

- [ ] **ACCEPTED** → Green badge, checkmark icon ✅
- [ ] **PENDING_REVIEW** → Yellow badge, clock icon ⏰
- [ ] **REVISION_REQUIRED** → Red badge, alert icon ❌
- [ ] **PENDING_SUBMISSION** → Blue badge, upload icon 📤

### Deadlines

- [ ] Admin deadline shown: "Admin has X days to review"
- [ ] Revision deadline shown: "Resubmit by [date]"
- [ ] Color coding: Green (>7 days), Yellow (3-7 days), Red (<3 days)

### Notifications

- [ ] User receives notification when requirement accepted
- [ ] User receives notification when requirement rejected
- [ ] User receives notification when Other Documents unlocked
- [ ] User receives notification when application voided
- [ ] Admin receives notification when new requirement submitted

### Responsiveness

- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Drag-and-drop upload works
- [ ] File previews work

---

## Performance Testing

### Load Test: Multiple Simultaneous Uploads

**Steps:**
1. Simulate 10 users uploading 10 documents each simultaneously
2. **Expected:** No timeouts
3. **Expected:** All uploads succeed
4. **Expected:** Database handles concurrent writes

**Tools:** Apache JMeter, Artillery, or k6

---

### Stress Test: Large Files

**Steps:**
1. Upload maximum file size (e.g., 50MB PDF)
2. **Expected:** Upload completes within reasonable time (<1 minute)
3. **Expected:** No memory issues
4. Upload 10 large files at once
5. **Expected:** All uploads succeed

---

## Security Testing

### Authorization

- [ ] User A cannot view User B's application
- [ ] User A cannot submit documents for User B's application
- [ ] Non-admin cannot access admin review APIs
- [ ] Non-admin cannot accept/reject requirements

### File Upload Security

- [ ] Only PDF files allowed (or configured formats)
- [ ] File size limit enforced (50MB max)
- [ ] No executable files (.exe, .sh, .bat) allowed
- [ ] Filename sanitization (no path traversal)

### API Security

- [ ] All endpoints require authentication
- [ ] CSRF protection enabled
- [ ] Rate limiting on upload endpoints
- [ ] SQL injection protected (using Prisma)

---

## Reporting Issues

If you encounter any bugs or issues:

1. **Document the issue:**
   - What you did (steps to reproduce)
   - What you expected
   - What actually happened
   - Screenshots if applicable

2. **Check logs:**
   - Browser console (F12)
   - Server logs (`npm run dev` output)
   - Database logs (Prisma queries)

3. **Create issue:**
   - Include all documentation above
   - Tag with `bug`, `testing`, `batch-upload`

---

## Success Criteria

The batch upload workflow is considered **fully tested** when:

✅ All automated tests pass
✅ All manual frontend tests completed
✅ All admin tests completed
✅ All deadline tests completed
✅ All edge cases handled gracefully
✅ No critical bugs found
✅ Performance is acceptable (<3 seconds for uploads)
✅ Security tests pass
✅ User experience is smooth and intuitive

---

## Quick Test Script

For rapid testing, run this sequence:

```bash
# 1. Reset database
npm run db:reset

# 2. Run automated tests
npx tsx tests/workflows/batch-upload-workflow.test.ts
npx tsx tests/api/acceptance-requirements.test.ts
npx tsx tests/api/other-documents.test.ts

# 3. Start dev server
npm run dev

# 4. Open browser and perform manual tests
# - Login as user: sagkurtkyle@gmail.com / SAGthesis101
# - Create application, upload docs, submit
# - Login as admin: admin@mgb.gov.ph / Admin@123
# - Review in parallel, accept/reject
# - Verify Other Documents unlock
# - Complete workflow
```

Expected total time: **30-45 minutes** for full test suite.

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
**Tested By:** [Your Name]
