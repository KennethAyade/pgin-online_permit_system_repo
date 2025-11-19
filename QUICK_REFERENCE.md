# Acceptance Requirements - Quick Reference Guide

## 🚀 Quick Start Checklist

### For Users
- [x] Register with Account Type (INDIVIDUAL/CORPORATE)
- [x] Fill Address with cascading dropdowns
- [x] Create new ISAG or CSAG application
- [x] Wait for admin to initialize acceptance requirements
- [x] Submit requirements ONE AT A TIME in sequence
- [x] Each requirement unlocks after previous is accepted
- [x] If rejected: resubmit within 14 days or application voids

### For Admins
- [x] Initialize requirements when application ready
- [x] Review pending requirements in queue
- [x] Accept requirement (unlocks next) OR
- [x] Reject requirement (gives user 14-day revision window)
- [x] Monitor deadlines in queue

### For Developers
- [x] All API endpoints implemented ✓
- [x] UI components fully integrated ✓
- [x] Database schema migrated ✓
- [x] Build compiles without errors ✓
- [ ] Configure CRON_SECRET environment variable
- [ ] Schedule daily cron jobs for deadline checking

---

## 📊 Requirements by Permit Type

### ISAG (Large Scale - 11 Requirements)
```
1. Project Coordinates (Text Input)
2. Application Form (File)
3. Survey Plan (File)
4. Location Map (File)
5. Work Program (File)
6. IEE Report (File)
7. EPEP (File)
8. Technical Competence (File)
9. Financial Capability (File)
10. Articles of Incorporation (File)
11. Supporting Papers (File)
```

### CSAG (Small Scale - 10 Requirements)
```
1. Project Coordinates (Text Input)
2. Application Form (File)
3. Survey Plan (File)
4. Location Map (File)
5. Work Program (File)
6. IEE Report (File)
7. Technical Competence (File)
8. Financial Capability (File)
9. Articles of Incorporation (File)
10. Supporting Papers (File)
```

---

## ⏱️ Key Deadlines

| Event | Duration | Action |
|-------|----------|--------|
| Auto-Accept if not reviewed | 10 days | System auto-accepts |
| Revision deadline | 14 days | Application voids if expired |

---

## 📍 Key Status Transitions

```
PENDING_SUBMISSION (Initial)
         ↓
(User Submits)
         ↓
PENDING_REVIEW (Waiting for Admin)
    ↙            ↘
ACCEPTED      REVISION_REQUIRED
  ↓                 ↓
Next Req       (User Resubmits)
               ↓ (Goes back to PENDING_REVIEW)
           [Repeat cycle]

If REVISION deadline expires:
    REVISION_REQUIRED → VOIDED (Application VOIDED)
```

---

## 🎯 Important Rules

### User Cannot
- ❌ Submit multiple requirements at once
- ❌ Skip requirements
- ❌ Access locked future requirements
- ❌ Recover voided applications

### Requirements Can Be In These States
- 🟦 **PENDING_SUBMISSION**: Waiting to submit
- 🟨 **PENDING_REVIEW**: Submitted, waiting for admin
- 🟩 **ACCEPTED**: Approved, can proceed
- 🟧 **REVISION_REQUIRED**: Rejected, can resubmit
- ⬜ **REJECTED**: Final rejection (rare)

### Locked vs Unlocked
- 🔓 **UNLOCKED**: User can select and submit
- 🔒 **LOCKED**: User cannot select (previous not complete)

---

## 📁 Important Files

### User Components
- `components/application/acceptance-requirements-section.tsx` - Submission UI
- `components/forms/registration-form.tsx` - Cascading address dropdowns

### Admin Components
- `components/admin/acceptance-requirements-queue.tsx` - Review queue

### API Routes
- `POST /api/acceptanceRequirements/initialize` - Create requirements
- `POST /api/acceptanceRequirements/submit` - User submits requirement
- `GET /api/acceptanceRequirements/[id]` - Fetch all requirements
- `POST /api/admin/acceptanceRequirements/review` - Admin reviews
- `GET /api/admin/acceptanceRequirements/pending` - List pending

### Cron Jobs
- `GET /api/cron/checkAutoAcceptDeadlines` - Auto-accept expired
- `GET /api/cron/checkRevisionDeadlines` - Void expired revisions

### Data
- `lib/constants/philippines-divisions.ts` - Address data (17 regions)

---

## 🔧 Setup Steps

### 1. Environment Variables
```bash
CRON_SECRET=your_secret_here
```

### 2. Schedule Cron Jobs
Daily execution required:
- `GET https://your-app.com/api/cron/checkAutoAcceptDeadlines?secret=CRON_SECRET`
- `GET https://your-app.com/api/cron/checkRevisionDeadlines?secret=CRON_SECRET`

Options:
- Vercel Cron (if deployed on Vercel)
- GitHub Actions
- AWS Lambda
- External cron service (cron-job.org, etc.)

### 3. Database Migration
```bash
npx prisma db push
```
✓ Already completed

---

## 🧪 Quick Test Scenarios

### Test 1: User Registration
1. Visit `/register`
2. Select "INDIVIDUAL"
3. Fill address with cascading dropdowns
4. Create account ✓

### Test 2: Submit First Requirement
1. Create ISAG application
2. Admin initializes requirements
3. Navigate to Acceptance Requirements tab
4. Submit Requirement #1 (coordinates)
5. Verify Requirement #2 unlocks ✓

### Test 3: Admin Approval
1. Login as admin
2. Go to Admin Dashboard → Acceptance Requirements Queue
3. Click "Review" on pending requirement
4. Click "Accept Requirement"
5. Verify user can see next requirement ✓

### Test 4: Admin Rejection
1. Admin rejects a requirement
2. User sees rejection with remarks
3. User resubmits within 14 days
4. Goes back to admin for re-review ✓

### Test 5: Auto-Accept (Optional - Manual)
1. Manually manipulate deadline in database (set to past date)
2. Run `GET /api/cron/checkAutoAcceptDeadlines?secret=CRON_SECRET`
3. Verify requirement auto-accepts ✓

### Test 6: Application Voiding (Optional - Manual)
1. Set revision deadline to past date
2. Run `GET /api/cron/checkRevisionDeadlines?secret=CRON_SECRET`
3. Verify application status = VOIDED ✓

---

## 📊 Database Schema Snapshot

### AcceptanceRequirement Fields
```javascript
{
  id: String,
  applicationId: String,
  requirementType: Enum,
  requirementName: String,
  order: Int,
  status: Enum,  // PENDING_SUBMISSION | PENDING_REVIEW | ACCEPTED | REVISION_REQUIRED
  submittedData: String?,
  submittedFileUrl: String?,
  submittedFileName: String?,
  submittedAt: DateTime,
  submittedBy: String,
  reviewedAt: DateTime?,
  reviewedBy: String?,
  adminRemarks: String?,
  revisionDeadline: DateTime?,
  autoAcceptDeadline: DateTime?,
  isAutoAccepted: Boolean,
  isVoided: Boolean,
  voidedAt: DateTime?,
  voidReason: String?
}
```

### Application Fields
```javascript
{
  currentAcceptanceRequirementId: String?,  // Points to next requirement
  acceptanceRequirementsStartedAt: DateTime?
}
```

### User Fields
```javascript
{
  accountType: Enum,  // INDIVIDUAL | CORPORATE
  companyName: String?,
  region: String,
  province: String,
  city: String,
  barangay: String
}
```

---

## 🎨 UI Pages & Routes

### User Pages
| Route | Component | Feature |
|-------|-----------|---------|
| `/register` | RegistrationForm | Account type + address dropdowns |
| `/applications/new` | ApplicationForm | Create new application |
| `/applications/[id]` | ApplicationDetails | View all tabs including Acceptance Requirements |
| `/applications/[id]` → Tab 2 | AcceptanceRequirementsSection | Submit requirements step-by-step |

### Admin Pages
| Route | Component | Feature |
|-------|-----------|---------|
| `/admin` | AdminDashboard | Dashboard + Queue |
| `/admin` → Tab 2 | AdminAcceptanceRequirementsQueue | Review pending requirements |
| `/admin/applications` | Applications List | All applications |

---

## 🔔 Notification Types

| Type | When | Message |
|------|------|---------|
| REQUIREMENT_PENDING_REVIEW | User submits | "Requirement submitted for review" |
| REQUIREMENT_ACCEPTED | Admin accepts | "Requirement accepted, proceed to next" |
| REQUIREMENT_REVISION_NEEDED | Admin rejects | "Requirement rejected, resubmit by [date]" |
| REQUIREMENT_AUTO_ACCEPTED | 10-day deadline expires | "Auto-accepted due to deadline" |
| APPLICATION_VOIDED | 14-day revision deadline expires | "Application voided, submit new" |

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Cron jobs not running | Check CRON_SECRET in environment variables |
| Requirements not unlocking | Check previous requirement status is ACCEPTED |
| Missing address dropdowns | Ensure philippines-divisions.ts is imported |
| Build fails | Run `npm run build` - should now pass all checks |
| User can't resubmit | Requirement must be in REVISION_REQUIRED status |
| Admin deadline warning not showing | Calculate days: (deadline - now) / (24 * 60 * 60 * 1000) |

---

## 📞 Support References

### Documentation Files
1. **ACCEPTANCE_REQUIREMENTS_CHECKLIST.md** - Complete checklist (70+ items)
2. **SEQUENTIAL_WORKFLOW_GUIDE.md** - Step-by-step user journey with examples
3. **QUICK_REFERENCE.md** - This file

### File Locations
- API Routes: `/app/api/acceptanceRequirements/` & `/app/api/admin/acceptanceRequirements/`
- Components: `/components/application/` & `/components/admin/`
- Database: `/prisma/schema.prisma`
- Constants: `/lib/constants/philippines-divisions.ts`

---

## ✅ Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | Migrated to PostgreSQL |
| User Registration | ✅ Complete | Account type + cascading dropdowns |
| Acceptance Requirements Section | ✅ Complete | Sequential submission UI |
| Admin Queue | ✅ Complete | Review interface with deadline warnings |
| All API Routes | ✅ Complete | 7 endpoints implemented |
| Cron Jobs | ✅ Complete | Need external scheduler |
| Build | ✅ Complete | Zero errors, ready for deployment |
| UI Integration | ✅ Complete | Fully integrated in user & admin dashboards |

---

## 🚀 Next Actions

1. **Configure Environment**
   - Set `CRON_SECRET` in `.env`

2. **Schedule Cron**
   - Configure daily cron job execution

3. **Test**
   - Run through all test scenarios above

4. **Monitor**
   - Check cron logs
   - Monitor deadline auto-actions
   - Verify notification delivery

5. **Deploy**
   - Push to production
   - Monitor first cycle of requirements

---

**Last Updated**: 2025-11-19
**Status**: ✅ Ready for Production
**Deadline Implementation**: ✅ Complete (Manual Testing Required)
