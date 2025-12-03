# SAG Permit System - Testing Guide

## Overview
Complete instructions for running automated test suites for Phase 1.

## Test Suites Summary

- **Suite 1: Unit Tests** (32 tests) - `tests/unit/`
- **Suite 2: API Tests** (50+ tests) - `tests/api/`
- **Suite 3: Component Tests** (32 tests) - `tests/components/`
- **Suite 4: E2E Tests** (5 tests) - `tests/e2e/`
- **Suite 5: Visual Tests** (5 tests) - `tests/visual/`

## Quick Start

```bash
# 1. Setup test database
createdb pgin_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pgin_test npx prisma db push

# 2. Run all tests
npm run test:all

# 3. View coverage
npm run test:coverage
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all Jest tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:api` | API integration tests |
| `npm run test:components` | Component tests |
| `npm run test:e2e` | E2E tests (requires running app) |
| `npm run test:all` | All Jest tests |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:watch` | Watch mode for development |

## Prerequisites

1. **Test Database**: Create `pgin_test` PostgreSQL database
2. **Environment**: Set `TEST_DATABASE_URL` in `.env.test`
3. **Dependencies**: All installed via `npm install --legacy-peer-deps`

## Coverage Goals

- API Routes: > 80%
- Utilities: > 90%
- Components: > 70%
- Critical Paths: 100% E2E

## CI/CD

Tests run automatically on GitHub Actions for:
- Push to main/develop
- Pull requests

View results in the **Actions** tab.

## Next Steps

After all Phase 1 tests pass, proceed to Phase 2 (Coordinates & Mapping).

For detailed documentation, see test file comments and plan document.
