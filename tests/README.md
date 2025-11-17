# Monet 3.0 Test Suite

Comprehensive test suite for the Monet marketplace platform covering unit tests, integration tests, and end-to-end workflows.

## Overview

The test suite is organized into three main categories:

1. **Unit Tests** (`tests/unit/`) - Test individual modules and functions in isolation
2. **Integration Tests** (`tests/integration/`) - Test API routes and service integration
3. **E2E Tests** (`tests/e2e/`) - Test complete user workflows from start to finish

## Test Structure

```
tests/
├── setup.ts                          # Global test setup and mocks
├── utils/
│   ├── fixtures.ts                   # Test data factories
│   └── helpers.ts                    # Test utility functions
├── unit/
│   ├── auth.test.ts                  # Authentication & authorization
│   ├── bookings.test.ts              # Booking workflow logic
│   ├── payments.test.ts              # Payment & payout logic
│   ├── qc-validation.test.ts         # QC validation rules
│   └── availability-timezone.test.ts # Availability & timezone handling
├── integration/
│   └── api-routes.test.ts            # API route integration tests
└── e2e/
    └── booking-workflow.test.ts      # Complete booking workflows
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test tests/unit
```

### Integration Tests Only
```bash
npm test tests/integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

### With Coverage
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test tests/unit/auth.test.ts
```

### Specific Test Suite
```bash
npm test -- -t "Authentication"
```

## Test Coverage

### Unit Tests

#### Authentication (`auth.test.ts`)
- ✅ Session validation and creation
- ✅ Role-based access control
- ✅ Password hashing
- ✅ OAuth integration tracking
- ✅ Corporate email verification
- ✅ Stripe integration
- ✅ Timezone support

#### Bookings (`bookings.test.ts`)
- ✅ Booking creation and status transitions
- ✅ Cancellation policy (3-hour window)
- ✅ Zoom meeting integration
- ✅ Time slot validation
- ✅ Price validation
- ✅ Timezone handling
- ✅ Draft and refunded bookings

#### Payments (`payments.test.ts`)
- ✅ Payment creation with held status
- ✅ Platform fee calculation (20%)
- ✅ Payment status transitions
- ✅ Escrow pattern
- ✅ Payout gating (QC requirements)
- ✅ Payout status transitions
- ✅ Refund processing
- ✅ Payment/payout coordination

#### QC Validation (`qc-validation.test.ts`)
- ✅ Word count validation (min 200 words)
- ✅ Action items validation (exactly 3)
- ✅ Rating validation (1-5 stars)
- ✅ QC status management
- ✅ Complete validation logic
- ✅ Payout gating
- ✅ Feedback resubmission
- ✅ Automatic vs manual QC
- ✅ Nudge email logic

#### Availability & Timezone (`availability-timezone.test.ts`)
- ✅ Time slot merging
- ✅ Time slot splitting (30-min chunks)
- ✅ Timezone validation (IANA)
- ✅ Timezone conversions
- ✅ Multi-timezone scenarios
- ✅ Weekly availability
- ✅ Business hours validation
- ✅ Google Calendar integration
- ✅ Slot format and duration validation

### Integration Tests

#### API Routes (`api-routes.test.ts`)
- ✅ Authentication endpoints (signup, role check)
- ✅ Candidate booking endpoints (request, checkout, search)
- ✅ Professional booking endpoints (schedule, decline, feedback)
- ✅ Shared endpoints (cancel, payment confirm)
- ✅ Admin endpoints (QC status, exports)
- ✅ Session validation
- ✅ Role-based access control
- ✅ Resource ownership validation

### E2E Tests

#### Booking Workflow (`booking-workflow.test.ts`)
- ✅ Complete happy path (request → accept → pay → call → feedback → payout)
- ✅ Professional cancellation flow
- ✅ Candidate early cancellation (>= 3 hours)
- ✅ Candidate late cancellation rejection (< 3 hours)
- ✅ QC revise flow with nudge emails
- ✅ QC failure flow with automatic refund
- ✅ No-show scenarios
- ✅ Multiple bookings
- ✅ Identity reveal logic

## Test Utilities

### Fixtures (`tests/utils/fixtures.ts`)

Factory functions for creating test data:

```typescript
// User fixtures
createMockUser(overrides?)
createMockCandidate(overrides?)
createMockProfessional(overrides?)
createMockAdmin(overrides?)

// Booking fixtures
createMockBooking(overrides?)
createMockPayment(bookingId, overrides?)
createMockPayout(bookingId, professionalId, overrides?)
createMockFeedback(bookingId, professionalId, overrides?)

// Other fixtures
createMockProfessionalProfile(userId, overrides?)
createMockAvailability(userId, overrides?)
createMockSession(user)
createMockPrismaClient()
```

### Helpers (`tests/utils/helpers.ts`)

Utility functions for tests:

```typescript
// Date helpers
futureDate(hours = 24): Date
pastDate(hours = 24): Date
todayAt(hours, minutes): Date
tomorrowAt(hours, minutes): Date
minutesUntil(date): number
minutesSince(date): number

// Request helpers
createMockRequest(options): Request
parseJsonResponse(response): Promise<any>

// Other helpers
generateValidFeedbackSummary(): string
wait(ms): Promise<void>
withEnv(key, value, fn): void
```

## Mocking Strategy

### External Services

All external services are mocked in `tests/setup.ts`:

- ✅ Stripe API (payments, transfers, refunds)
- ✅ Zoom API (meeting creation, join tracking)
- ✅ Email sending (Nodemailer)
- ✅ Google Calendar API
- ✅ BullMQ queues

### Database

Tests use Prisma mocks created with `createMockPrismaClient()` for isolated unit tests.

For integration tests that need database access, consider using:
- In-memory SQLite database
- Test database with cleanup between tests

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test one thing per test** - keep tests focused
4. **Use fixtures for test data** - don't create data inline
5. **Mock external dependencies** - keep tests fast and isolated
6. **Test error cases** - not just happy paths

### Example Test Structure

```typescript
describe('Feature Name', () => {
  describe('Specific Behavior', () => {
    it('should do something specific when condition is met', () => {
      // Arrange
      const user = createMockCandidate();
      const booking = createMockBooking({ candidateId: user.id });

      // Act
      const result = someFunction(booking);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Test Organization

- Group related tests in `describe` blocks
- Use nested `describe` blocks for organization
- Name test suites clearly (e.g., "Authentication", "Booking Creation")
- Put unit tests in `tests/unit/`
- Put integration tests in `tests/integration/`
- Put E2E tests in `tests/e2e/`

## Continuous Integration

### Running in CI

Tests are designed to run in CI environments without external dependencies:

```bash
# In CI pipeline
npm ci
npm test
```

### Coverage Requirements

Aim for:
- **Unit test coverage**: 80%+
- **Integration test coverage**: 70%+
- **E2E test coverage**: Critical user flows

### Test Speed

- Unit tests: < 5 seconds total
- Integration tests: < 30 seconds total
- E2E tests: < 60 seconds total

## Debugging Tests

### Run Single Test
```bash
npm test tests/unit/auth.test.ts -- -t "should create valid session"
```

### Enable Verbose Output
```bash
npm test -- --reporter=verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/vitest run tests/unit/auth.test.ts
```

## Adding New Tests

### 1. Create Test File

Place in appropriate directory:
- Unit tests: `tests/unit/feature-name.test.ts`
- Integration tests: `tests/integration/feature-name.test.ts`
- E2E tests: `tests/e2e/feature-name.test.ts`

### 2. Import Utilities

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser, createMockBooking } from '../utils/fixtures';
import { futureDate, generateValidFeedbackSummary } from '../utils/helpers';
```

### 3. Write Tests

Follow the existing patterns in the test suite.

### 4. Run Tests

```bash
npm test tests/unit/feature-name.test.ts
```

## Common Issues

### Tests Timing Out

Increase timeout in `vitest.config.ts`:
```typescript
testTimeout: 10000, // 10 seconds
```

### Mock Not Working

Clear mocks between tests:
```typescript
afterEach(() => {
  vi.clearAllMocks();
});
```

### Environment Variables

Set in `tests/setup.ts`:
```typescript
process.env.VARIABLE_NAME = 'value';
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [CLAUDE.md](../CLAUDE.md) - Codebase documentation

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Update this README if needed
4. Maintain >80% coverage for new code

## Support

For questions about the test suite, refer to:
- This README
- Existing test files for examples
- Team documentation
