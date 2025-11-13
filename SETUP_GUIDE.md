# Quick Setup Guide - SAG Permit System

## ✅ Current Status

Your system is fully configured and ready to test!

- ✅ Database connected (Prisma Cloud)
- ✅ Schema created and synced
- ✅ Test users created
- ✅ SMTP configured (Gmail)
- ✅ Development server running
- ✅ Professional UI implemented

## 🔑 Test Credentials

### Admin Account
```
Email: admin@mgb.gov.ph
Password: Admin@123
URL: http://localhost:3000/login
```

### Evaluator Account
```
Email: evaluator@mgb.gov.ph
Password: Evaluator@123
URL: http://localhost:3000/login
```

### Test User Account
```
Email: test@example.com
Password: User@123
URL: http://localhost:3000/login
```

## 🧪 Testing Workflow

### 1. Test User Registration
1. Go to `http://localhost:3000/register`
2. Fill out the registration form
3. Check email for verification link (if SMTP is working)
4. Or manually verify in database using Prisma Studio

### 2. Test Application Creation
1. Login as test user
2. Go to Dashboard
3. Click "New Application"
4. Follow the 7-step wizard:
   - Step 1: Select permit type (ISAG or CSAG)
   - Step 2: Enter project name
   - Step 3: Enter proponent info
   - Step 4: Enter project details
   - Step 5: Upload mandatory documents
   - Step 6: Upload other requirements
   - Step 7: Review and submit

### 3. Test Admin Review
1. Logout and login as admin
2. Go to `/admin`
3. Click "View All Applications"
4. Click on an application
5. Click "Evaluate" button
6. Complete evaluation checklist
7. Approve, reject, or return application

## 📂 File Upload Testing

### Mandatory Documents
- All must be PDF format
- Maximum 10MB per file
- Required for ISAG:
  - Application Form
  - Survey Plan
  - Location Map
  - Work Program (5-year)
  - IEE Report
  - EPEP (required for ISAG only)
  - Proof of Technical Competence
  - Proof of Financial Capability
  - Articles of Incorporation

### Other Requirements
- Clearances
- Certificates of Posting
- ECC
- Endorsements
- Field Verification Report
- Surety Bond

## 🎨 UI Features

### Homepage
- Professional hero section
- Feature cards
- Permit type comparison
- Official footer

### Authentication Pages
- Clean login/register forms
- Password recovery
- Email verification
- Modern, professional design

### User Dashboard
- Application statistics
- Recent applications
- Quick actions
- For Action inbox

### Application Wizard
- 7-step guided process
- Auto-save drafts
- Progress indicator
- Document upload with preview

### Admin Panel
- Dashboard with stats
- Application table with filters
- Evaluation checklist
- Decision modals (approve/reject/return)
- Status timeline

## 🔧 Database Management

### Prisma Studio
Open visual database editor:
```bash
npm run db:studio
```

This opens `http://localhost:5555` where you can:
- View all tables
- Edit records
- Create test data
- Manually verify emails

### Reset Database
If you need to start fresh:
```bash
npm run db:push -- --force-reset
npm run db:seed
```

## 📧 Email Testing

### Check Email Logs
- Emails are sent via SMTP
- Check console logs for email status
- Verify credentials in `.env`

### Manual Email Verification
If emails aren't sending:
1. Run `npm run db:studio`
2. Open `users` table
3. Set `emailVerified` to `true`
4. User can now login

## 🌐 URLs

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **User Dashboard**: http://localhost:3000/dashboard
- **Admin Panel**: http://localhost:3000/admin
- **Prisma Studio**: http://localhost:5555 (when running)

## 🎯 Next Steps

1. **Test the system**
   - Register a new user
   - Create an application
   - Upload documents
   - Submit application

2. **Test admin features**
   - Login as admin
   - Review applications
   - Evaluate checklist
   - Approve/reject

3. **Customize**
   - Update branding (if needed)
   - Adjust email templates
   - Configure production URLs

4. **Deploy**
   - Push to GitHub
   - Deploy to Vercel
   - Configure production database
   - Update environment variables

## ⚠️ Important Notes

- **Email**: Update SMTP credentials in `.env` for email to work
- **Admin Login**: Emails containing @mgb, @pgin, or @admin are treated as admin logins
- **File Storage**: Files are stored in `storage/uploads/` directory
- **Session**: Auto-logout after 30 minutes of inactivity
- **Security**: Never commit `.env` file to git

## 🆘 Common Issues

### Cannot login
- Check email/password
- Verify user exists in database
- Check `emailVerified` status

### Email not sending
- Verify SMTP credentials
- Check email logs in console
- Test with Gmail App Password

### Upload failed
- Check file is PDF
- Verify file size < 10MB
- Check `storage/uploads/` directory exists

### Admin access denied
- Email must contain @mgb, @pgin, or @admin
- Or user must be in `admin_users` table

## 📞 Support

For issues or questions:
- Check console logs
- Review database in Prisma Studio
- Verify environment variables
- Check file permissions

---

**System Ready!** 🎉

Your SAG Permit Online Application System is fully configured and ready for testing.

Visit: http://localhost:3000

