# Automated Tests

This directory contains automated tests for the batch upload workflow with parallel review system.

## Directory Structure

```
tests/
├── workflows/
│   └── batch-upload-workflow.test.ts    # End-to-end workflow test
├── api/
│   ├── acceptance-requirements.test.ts   # Acceptance requirements API tests
│   └── other-documents.test.ts           # Other documents API tests
└── README.md                             # This file
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Or
npm run test:all
```

### Individual Tests

```bash
# Run workflow test only
npm run test:workflow

# Run acceptance requirements API test
npm run test:api:acceptance

# Run other documents API test
npm run test:api:other-docs
```

## Prerequisites

### 1. Database Setup

Ensure you have a clean database with test accounts:

```bash
npm run db:reset
```

This creates:
- User: `sagkurtkyle@gmail.com` / `SAGthesis101`
- Admin: `admin@mgb.gov.ph` / `Admin@123`

### 2. Environment Variables

Ensure `.env` has valid database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 3. Dependencies

Install all dependencies:

```bash
npm install
```

## Test Descriptions

### 1. Workflow Integration Test

**File:** `tests/workflows/batch-upload-workflow.test.ts`

**What it tests:**
- ✅ Application creation with coordinates
- ✅ Batch upload of ALL documents at once
- ✅ Application submission
- ✅ Admin parallel review (non-sequential)
- ✅ Document rejection with deadlines
- ✅ User resubmission of rejected documents
- ✅ Other Documents section unlock
- ✅ Other documents submission and review
- ✅ Complete workflow end-to-end

**Duration:** ~5-10 seconds

**Cleanup:** Automatically deletes test data

---

### 2. Acceptance Requirements API Test

**File:** `tests/api/acceptance-requirements.test.ts`

**What it tests:**
- ✅ Initialize API with batch uploaded documents
- ✅ Correct status assignment (PENDING_REVIEW vs PENDING_SUBMISSION)
- ✅ Deadline calculation (14 working days)
- ✅ Submit requirement API
- ✅ Admin accept requirement API
- ✅ Admin reject requirement API
- ✅ Resubmit rejected requirement API
- ✅ All accepted → Other Documents unlock

**Duration:** ~3-5 seconds

**Cleanup:** Automatically deletes test data

---

### 3. Other Documents API Test

**File:** `tests/api/other-documents.test.ts`

**What it tests:**
- ✅ GET other documents API
- ✅ Submit other document API
- ✅ Deadline assignment
- ✅ Admin accept other document API
- ✅ Admin reject other document API
- ✅ Resubmit rejected other document API
- ✅ All accepted → application moves to UNDER_REVIEW

**Duration:** ~3-5 seconds

**Cleanup:** Automatically deletes test data

---

## Understanding Test Results

### Success Output

```
╔════════════════════════════════════════════════════════╗
║              🎉 ALL TESTS PASSED! 🎉                   ║
╚════════════════════════════════════════════════════════╝

📊 Total: 3 | ✅ Passed: 3 | ❌ Failed: 0
```

### Failure Output

```
❌ Test failed: Expected status ACCEPTED, got PENDING_REVIEW

📊 Total: 3 | ✅ Passed: 2 | ❌ Failed: 1
```

## Writing New Tests

### Test Template

```typescript
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

class MyTestClass {
  async setup() {
    // Setup test data
  }

  async test1_MyTest() {
    console.log("\n📝 Test 1: Description")

    // Test logic
    const result = await someOperation()

    // Assertions
    if (result !== expected) {
      throw new Error("Test failed")
    }

    console.log("✅ Test passed")
  }

  async cleanup() {
    // Clean up test data
  }

  async runAll() {
    try {
      await this.setup()
      await this.test1_MyTest()
      console.log("\n✅ All tests passed!")
      await this.cleanup()
    } catch (error) {
      console.error("\n❌ Test failed:", error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
}

const tester = new MyTestClass()
tester.runAll()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
```

## Debugging Failed Tests

### 1. Check Database Connection

```bash
npm run db:studio
```

Verify:
- Database is accessible
- Test accounts exist
- Schema is up to date

### 2. Check Test Logs

Tests print detailed logs. Look for:
- ❌ Error messages
- Expected vs actual values
- Stack traces

### 3. Run Tests Individually

Isolate the failing test:

```bash
npm run test:workflow
# or
npm run test:api:acceptance
# or
npm run test:api:other-docs
```

### 4. Keep Test Data

Prevent automatic cleanup:

```bash
CLEANUP_AFTER_TEST=false npm run test:workflow
```

Then inspect database using Prisma Studio:

```bash
npm run db:studio
```

## Best Practices

### ✅ DO

- Run `npm run db:reset` before testing
- Write descriptive test names
- Use assertions for validation
- Clean up test data
- Log progress with emojis for readability

### ❌ DON'T

- Use production database for tests
- Skip cleanup (creates data pollution)
- Write tests that depend on each other
- Hard-code IDs or dates
- Leave console.log statements in production code

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Setup database
        run: npm run db:push

      - name: Reset database
        run: npm run db:reset

      - name: Run tests
        run: npm test
```

## Performance Benchmarks

Expected test durations on standard hardware:

| Test Suite | Duration | Operations |
|------------|----------|------------|
| Workflow | 5-10s | ~50 DB operations |
| Acceptance API | 3-5s | ~20 DB operations |
| Other Docs API | 3-5s | ~15 DB operations |
| **Total** | **11-20s** | **~85 DB operations** |

## Troubleshooting

### Error: "Test user not found"

**Solution:**
```bash
npm run db:reset
```

### Error: "Connection timeout"

**Solution:**
Check `DATABASE_URL` in `.env`

### Error: "Unique constraint violation"

**Solution:**
```bash
npm run db:reset
```

### Error: "Module not found"

**Solution:**
```bash
npm install
npx prisma generate
```

## Additional Resources

- [TESTING_GUIDE.md](../TESTING_GUIDE.md) - Complete testing guide including manual tests
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Support

If tests fail consistently:

1. Check database schema is up to date: `npm run db:push`
2. Verify environment variables are correct
3. Ensure PostgreSQL is running
4. Review test logs for specific errors
5. Consult TESTING_GUIDE.md for detailed instructions

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
