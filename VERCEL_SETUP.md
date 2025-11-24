# Vercel Deployment Setup Guide

## Step 1: Resolve Environment Variable Conflict

**IMPORTANT**: You're seeing an error because `DATABASE_URL` already exists in your Vercel project. You need to remove it first so Vercel can create it from the database connection.

### Solution: Remove Existing DATABASE_URL First

1. Click **"Cancel"** on the database connection modal

2. Go to your Vercel project dashboard:
   - Click on your project name
   - Go to **Settings** → **Environment Variables**

3. Find the existing `DATABASE_URL` variable
   - Check which environments it's set for (Development/Preview/Production)
   - **Delete** it (or note its value if you need to keep it temporarily)

4. Also check for and delete `DIRECT_URL` if it exists (we'll recreate it)

5. Go back to the database connection page and click **"Connect Database"** again

6. In the connection modal:
   - Set Custom Prefix to **"DATABASE"** (you already have this)
   - Select your environments (Development, Preview, Production)
   - Click **"Connect"**

7. After connecting, Vercel will automatically create `DATABASE_URL` with the correct connection string

### Alternative: Manual Setup (If You Prefer)

If you want to keep manual control:

1. Click **"Cancel"** on the modal
2. Go to **Settings** → **Environment Variables**
3. Update the existing `DATABASE_URL` with your Prisma Postgres connection string
4. Create/update `DIRECT_URL` with the same value
5. Skip the Vercel database connection (you can connect it later if needed)

## Step 2: Add Environment Variables in Vercel

After connecting the database, go to your Vercel project settings and add these environment variables:

### Required Database Variables
- `DATABASE_URL` - Should be auto-created from the database connection
- `DIRECT_URL` - Copy the same value as `DATABASE_URL` (or set separately if using connection pooling)

### Required NextAuth Variables
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL (e.g., `https://your-project.vercel.app`)

### Required File Storage Variables (for production)
- `BLOB_READ_WRITE_TOKEN` - Auto-created when you set up Vercel Blob Storage
  - Go to **Storage** → Create **Blob** store
  - Vercel will automatically add this token

### Required Email Variables (if using email features)
- `MAIL_HOST` - Your SMTP host (e.g., `smtp.gmail.com`)
- `MAIL_PORT` - SMTP port (e.g., `587` for TLS)
- `MAIL_USERNAME` - Your email address
- `MAIL_PASSWORD` - Your email app password
- `MAIL_FROM_ADDRESS` - Sender email address
- `MAIL_ENCRYPTION` - `tls` or `ssl`

## Step 3: Set Environment-Specific Values

In Vercel, you can set different values for each environment:

### Production Environment
```
DATABASE_URL=<production-db-url>
DIRECT_URL=<production-db-url>
NEXTAUTH_SECRET=<production-secret>
NEXTAUTH_URL=https://your-project.vercel.app
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_ENCRYPTION=tls
```

### Preview Environment
Use the same database or a separate preview database.

### Development Environment
Use your local `.env` file for development.

## Step 4: Deploy

After setting up environment variables:

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Check the build logs to ensure Prisma generates correctly
4. Run migrations if needed: `npx prisma migrate deploy`

## Step 5: Set Up Vercel Blob Storage (For File Uploads)

**IMPORTANT**: Vercel serverless functions have a read-only filesystem. You need to use Vercel Blob Storage for file uploads in production.

### Option A: Enable Vercel Blob Storage (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → Select **Blob**
3. Create a new Blob store (or use existing)
4. Go to **Settings** → **Environment Variables**
5. Add the `BLOB_READ_WRITE_TOKEN` variable (Vercel should auto-create this when you create a Blob store)

The application will automatically:
- Use Blob Storage in production (when `BLOB_READ_WRITE_TOKEN` is set)
- Fall back to local filesystem in development

### Option B: Use Local Storage (Development Only)

If you're only testing locally, the current setup will work. But **file uploads will fail in production** unless you set up Blob Storage.

## Step 6: Initialize Database Schema

After first deployment, you need to push your Prisma schema:

```bash
# Connect to your production database
npx prisma db push --skip-generate

# Or run migrations
npx prisma migrate deploy
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly in Vercel
- Check that `DIRECT_URL` matches `DATABASE_URL` (or is the direct connection URL)
- Ensure database allows connections from Vercel IPs

### Build Failures
- Check that `vercel.json` includes Prisma generate step
- Verify all environment variables are set
- Check build logs for specific errors

### Prisma Client Errors
- Ensure `postinstall` script runs: `prisma generate`
- Check that `DATABASE_URL` is accessible during build

## Quick Checklist

- [ ] Database connected in Vercel (with empty prefix)
- [ ] `DATABASE_URL` environment variable set
- [ ] `DIRECT_URL` environment variable set
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] **Vercel Blob Storage created** (for file uploads)
- [ ] `BLOB_READ_WRITE_TOKEN` environment variable set (auto-created)
- [ ] Email variables configured (if needed)
- [ ] Database schema pushed/migrated
- [ ] First deployment successful
- [ ] File upload tested in production

