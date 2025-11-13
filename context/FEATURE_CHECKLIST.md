# SAG Permit System - Feature Checklist & Implementation Guide

## 📋 MVP Feature Checklist

This document tracks all features to be implemented for the SAG Permit Online Application System MVP.

---

## ✅ Phase 1: Foundation & Authentication (Week 1)

### **1.1 Project Setup**
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Configure shadcn/ui components
- [ ] Set up Prisma with PostgreSQL
- [ ] Create database schema
- [ ] Set up environment variables
- [ ] Configure ESLint & Prettier
- [ ] Set up Git repository

### **1.2 Authentication System**
- [ ] Install and configure NextAuth.js v5
- [ ] Create User model (Prisma schema)
- [ ] Implement user registration page
  - [ ] Form validation (Zod schema)
  - [ ] Email verification flow
  - [ ] Government ID upload
  - [ ] Terms & conditions checkbox
- [ ] Implement login page
  - [ ] Email/password authentication
  - [ ] Remember me option
  - [ ] Error handling
- [ ] Implement password recovery
  - [ ] "Can't sign in" link
  - [ ] Recovery form (surname, email, birthdate)
  - [ ] Email with reset link
  - [ ] Reset password page
- [ ] Implement account management
  - [ ] Change password functionality
  - [ ] Update email/mobile number
  - [ ] Update recovery information
- [ ] Session management
  - [ ] 30-minute timeout
  - [ ] Secure logout
  - [ ] Session persistence

### **1.3 Basic UI Components**
- [ ] Install shadcn/ui components
- [ ] Create layout components
  - [ ] Header/Navbar
  - [ ] Sidebar (for dashboard)
  - [ ] Footer
- [ ] Create form components
  - [ ] Input fields
  - [ ] File upload component
  - [ ] Multi-step wizard wrapper
  - [ ] Progress indicator
- [ ] Create notification components
  - [ ] Toast notifications
  - [ ] Alert banners
- [ ] Responsive design
  - [ ] Mobile menu
  - [ ] Mobile-friendly forms

---

## ✅ Phase 2: Application Creation (Week 2)

### **2.1 Dashboard**
- [ ] User dashboard page
  - [ ] Application progress tracker
  - [ ] Notifications panel
  - [ ] Quick stats (pending, approved, returned)
  - [ ] "Start New Application" button
- [ ] Application list view
  - [ ] Filter by status
  - [ ] Filter by permit type (ISAG/CSAG)
  - [ ] Search functionality
  - [ ] Sort options

### **2.2 Application Creation Wizard**
- [ ] Step 1: Permit Type Selection
  - [ ] ISAG option
  - [ ] CSAG option
  - [ ] Information display (requirements preview)
- [ ] Step 2: Basic Project Information
  - [ ] Project name
  - [ ] Project area (numeric only, decimal allowed)
  - [ ] Footprint area
  - [ ] Number of employees
  - [ ] Project cost
  - [ ] Validation (no commas/spaces in numeric fields)
- [ ] Step 3: Proponent Information
  - [ ] Auto-fill from user profile
  - [ ] Editable fields
  - [ ] Company information (if applicable)
- [ ] Step 4: Project Details
  - [ ] Additional project information
  - [ ] Location details
- [ ] Step 5: Mandatory Requirements Upload
  - [ ] Document upload interface
  - [ ] Conditional display (EPEP for ISAG only)
  - [ ] File validation (PDF, 10MB max)
  - [ ] Preview uploaded files
  - [ ] Replace/delete functionality
  - [ ] Document list:
    - [ ] Application Form (MGB Form 8-4)
    - [ ] Survey Plan
    - [ ] Location Map
    - [ ] Work Program (1-year CSAG / 5-year ISAG)
    - [ ] IEE Report
    - [ ] EPEP (ISAG only)
    - [ ] Proof of Technical Competence
    - [ ] Proof of Financial Capability
    - [ ] Articles of Incorporation
    - [ ] Other Supporting Papers
- [ ] Step 6: Other Requirements Upload
  - [ ] Area Status & Clearance (CENRO/MGB)
  - [ ] Certificates of Posting (6 locations)
  - [ ] ECC
  - [ ] Sanggunian Endorsements (2 of 3)
  - [ ] Field Verification Report
  - [ ] Surety Bond (₱20,000.00)
- [ ] Step 7: Review & Submit
  - [ ] Summary view of all information
  - [ ] Document checklist
  - [ ] Completeness validation
  - [ ] Confirmation dialog
  - [ ] Submit button
  - [ ] Generate tracking number

### **2.3 Draft Management**
- [ ] Auto-save functionality
  - [ ] Save on step change
  - [ ] Save on field blur
  - [ ] Visual indicator (saved/unsaved)
- [ ] Resume draft application
  - [ ] "For Action" page
  - [ ] List of draft applications
  - [ ] Continue editing functionality
  - [ ] Delete draft option
- [ ] Multiple drafts support
  - [ ] Create multiple applications
  - [ ] Manage multiple drafts

### **2.4 Document Management**
- [ ] File upload component
  - [ ] Drag & drop support
  - [ ] Browse button
  - [ ] File type validation (PDF only)
  - [ ] File size validation (10MB max)
  - [ ] Upload progress indicator
- [ ] Document storage
  - [ ] Local file system storage
  - [ ] Secure file naming
  - [ ] File organization by application ID
- [ ] Document operations
  - [ ] View/download uploaded files
  - [ ] Replace document (overwrites previous)
  - [ ] Delete document
  - [ ] Document preview (PDF viewer)

---

## ✅ Phase 3: Workflow & Admin Panel (Week 3)

### **3.1 Application Status Tracking**
- [ ] Status workflow implementation
  - [ ] DRAFT → SUBMITTED → UNDER_REVIEW → etc.
  - [ ] Status transition validation
  - [ ] Status history logging
- [ ] Status display
  - [ ] Status badges (color-coded)
  - [ ] Status timeline view
  - [ ] Current status indicator
- [ ] Routing history
  - [ ] View application routing
  - [ ] Who handled the application
  - [ ] Timestamps for each status change

### **3.2 Admin Panel**
- [ ] Admin authentication
  - [ ] Admin login page
  - [ ] Role-based access control
  - [ ] Admin dashboard
- [ ] Admin dashboard
  - [ ] Summary statistics
    - [ ] Pending applications count
    - [ ] Approved applications count
    - [ ] Returned applications count
    - [ ] ISAG vs CSAG breakdown
  - [ ] Recent submissions
  - [ ] Pending actions
  - [ ] Quick filters

### **3.3 Application Management (Admin)**
- [ ] Application list view
  - [ ] All applications table
  - [ ] Filter by status
  - [ ] Filter by permit type
  - [ ] Filter by date range
  - [ ] Search by applicant name/application number
- [ ] Application detail view
  - [ ] View all application information
  - [ ] View all uploaded documents
  - [ ] Download documents
  - [ ] View status history
  - [ ] View comments/remarks

### **3.4 Initial Check Process**
- [ ] Initial check interface
  - [ ] Open application for review
  - [ ] Document verification checklist
  - [ ] Checkbox interface
  - [ ] Remarks field for each document
  - [ ] Complete/Incomplete status
- [ ] Evaluation checklist (ISAG)
  - [ ] Document verification section
  - [ ] Other requirements section
  - [ ] Technical review summary
  - [ ] Signature fields (Evaluated by, Reviewed by, Approved by)
- [ ] Evaluation checklist (CSAG)
  - [ ] Same as ISAG (without EPEP)
- [ ] Return to applicant
  - [ ] Select documents to return
  - [ ] Add remarks
  - [ ] Set revision deadline (optional)
  - [ ] Return action
  - [ ] Auto-notification to applicant

### **3.5 Technical Review**
- [ ] Technical review interface
  - [ ] Review work program
  - [ ] Review environmental documents
  - [ ] Review financial documents
  - [ ] Upload technical evaluation notes
  - [ ] Attach field verification results
- [ ] Technical review checklist
  - [ ] Coordinates verification
  - [ ] Survey and maps review
  - [ ] Work program feasibility
  - [ ] Environmental safeguards
  - [ ] Financial/technical capacity
  - [ ] LGU endorsements validation
- [ ] Forward for final approval
  - [ ] Generate summary evaluation report
  - [ ] Forward to PMRB/Regional Director

### **3.6 Final Approval**
- [ ] PMRB/Regional Director interface
  - [ ] View evaluation summary
  - [ ] Review all documents
  - [ ] Decision options:
    - [ ] Approve
    - [ ] Reject (with reason input)
    - [ ] Return for revision
- [ ] Approval workflow
  - [ ] Digital signature/approval
  - [ ] Approval date logging
  - [ ] Auto-notification

### **3.7 Comments & Remarks System**
- [ ] Comments interface
  - [ ] Add comment/remark
  - [ ] View all comments
  - [ ] Reply to comments (threaded)
  - [ ] Internal comments (admin-only)
- [ ] Remarks on documents
  - [ ] Add remarks to specific documents
  - [ ] View document remarks
- [ ] Activity feed
  - [ ] Recent activity display
  - [ ] Status changes
  - [ ] Comments added
  - [ ] Documents uploaded

---

## ✅ Phase 4: Notifications & Communication (Week 3-4)

### **4.1 Email Notifications**
- [ ] Set up email service (Resend)
- [ ] Email templates
  - [ ] Registration verification email
  - [ ] Password recovery email
  - [ ] Application submitted confirmation
  - [ ] Application returned notification
  - [ ] Application approved notification
  - [ ] Application rejected notification
  - [ ] Payment required notification
  - [ ] Permit ready notification
- [ ] Email queue system
  - [ ] Queue emails for sending
  - [ ] Retry failed emails
  - [ ] Email delivery tracking

### **4.2 In-App Notifications**
- [ ] Notification system
  - [ ] Create notifications on events
  - [ ] Mark as read functionality
  - [ ] Notification badge (unread count)
  - [ ] Notification dropdown/list
- [ ] Notification types
  - [ ] Application status changes
  - [ ] Comments added
  - [ ] Documents required
  - [ ] Payment reminders

### **4.3 "For Action" Inbox**
- [ ] For Action page (User)
  - [ ] List of applications requiring action
  - [ ] Returned applications
  - [ ] Applications needing revision
  - [ ] Approved applications (for download)
- [ ] Action interface
  - [ ] View required actions
  - [ ] Upload revised documents
  - [ ] Add remarks
  - [ ] Resubmit application

---

## ✅ Phase 5: Payment & Permit Issuance (Week 4)

### **5.1 Payment Process**
- [ ] Order of Payment generation
  - [ ] Generate PDF (manual or automated)
  - [ ] Display payment instructions
  - [ ] Send to applicant
- [ ] Payment confirmation
  - [ ] Upload payment receipt
  - [ ] Admin verification
  - [ ] Mark payment as verified
- [ ] Payment status tracking
  - [ ] Pending → Paid → Verified

### **5.2 Permit Issuance**
- [ ] Permit generation
  - [ ] Generate permit number (auto)
  - [ ] Create permit PDF template
  - [ ] Fill permit details
- [ ] Permit signing
  - [ ] Admin upload signed permit
  - [ ] Store permit PDF
- [ ] Permit download
  - [ ] User downloads approved permit
  - [ ] Download notarized version (if required)
  - [ ] Download payment receipt

---

## ✅ Phase 6: Reporting & Archiving (Week 4)

### **6.1 Archiving**
- [ ] Auto-archive approved applications
- [ ] Archive returned/rejected applications
- [ ] Archive view
  - [ ] Filter archived applications
  - [ ] Search archived applications

### **6.2 Basic Reporting (Admin)**
- [ ] Application statistics
  - [ ] Total applications (by type)
  - [ ] Approval rate
  - [ ] Average processing time
- [ ] Export functionality
  - [ ] Export application list (CSV/Excel)
  - [ ] Export evaluation reports (PDF)

---

## ✅ Phase 7: Testing & Polish (Week 4)

### **7.1 Testing**
- [ ] Unit tests (critical functions)
- [ ] Integration tests (workflows)
- [ ] User acceptance testing
  - [ ] Test registration flow
  - [ ] Test application submission
  - [ ] Test admin evaluation
  - [ ] Test status transitions
- [ ] Security testing
  - [ ] Authentication security
  - [ ] File upload security
  - [ ] SQL injection prevention
  - [ ] XSS prevention

### **7.2 Bug Fixes**
- [ ] Fix critical bugs
- [ ] Fix UI/UX issues
- [ ] Performance optimization
- [ ] Mobile responsiveness fixes

### **7.3 Documentation**
- [ ] User manual (5-10 pages)
  - [ ] Registration guide
  - [ ] Application submission guide
  - [ ] Status tracking guide
- [ ] Technical documentation
  - [ ] API documentation
  - [ ] Database schema documentation
  - [ ] Deployment guide
- [ ] Admin manual
  - [ ] Admin dashboard guide
  - [ ] Evaluation process guide
  - [ ] System management guide

---

## 🚫 NOT Included in MVP (Deferred)

### **Advanced Features**:
- [ ] Multi-level hierarchical routing
- [ ] Complex workflow automation
- [ ] Notarization tracking system
- [ ] Automated denial letter generation
- [ ] Advanced reporting and analytics
- [ ] Integration with external government systems
- [ ] Mobile application version
- [ ] Offline capabilities
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] API for third-party integration
- [ ] Payment gateway integration (manual process)
- [ ] Automated permit PDF generation (manual template)

---

## 📊 Progress Tracking

### **Overall Progress**: 0% (0/150+ tasks)

### **By Phase**:
- Phase 1: 0% (0/25 tasks)
- Phase 2: 0% (0/35 tasks)
- Phase 3: 0% (0/40 tasks)
- Phase 4: 0% (0/15 tasks)
- Phase 5: 0% (0/10 tasks)
- Phase 6: 0% (0/8 tasks)
- Phase 7: 0% (0/17 tasks)

---

## 🎯 Priority Features (Must Have)

1. ✅ User registration & authentication
2. ✅ Application creation wizard
3. ✅ Document upload system
4. ✅ Draft saving
5. ✅ Admin evaluation checklist
6. ✅ Status tracking
7. ✅ Email notifications
8. ✅ Basic admin dashboard

---

## 📝 Notes

- **File Size**: Standardize to 10MB for all uploads
- **File Type**: PDF only
- **Status Workflow**: Ensure consistency between user and admin views
- **Email Notifications**: Critical for user engagement
- **Draft Saving**: Essential for user experience (long forms)
- **Mobile Responsive**: Required for all pages

---

**Use this checklist to track development progress! ✅**

