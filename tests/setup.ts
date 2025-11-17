import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/monet_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.PLATFORM_FEE = '20';
process.env.CALL_DURATION_MINUTES = '30';
process.env.DEFAULT_TIMEZONE = 'America/New_York';

// Mock external services by default
vi.mock('@/lib/integrations/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      cancel: vi.fn(),
    },
    transfers: {
      create: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    accounts: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
  createPaymentIntent: vi.fn(),
  processRefund: vi.fn(),
  processPayout: vi.fn(),
}));

vi.mock('@/lib/integrations/zoom', () => ({
  createZoomMeeting: vi.fn(),
  recordZoomJoin: vi.fn(),
}));

vi.mock('@/lib/integrations/email', () => ({
  sendEmail: vi.fn(),
  sendBookingRequestEmail: vi.fn(),
  sendBookingAcceptedEmail: vi.fn(),
  sendBookingCancelledEmail: vi.fn(),
  sendFeedbackReminderEmail: vi.fn(),
}));

vi.mock('@/lib/integrations/calendar/google', () => ({
  getGoogleCalendarBusyTimes: vi.fn(),
  createGoogleCalendarEvent: vi.fn(),
}));

vi.mock('@/lib/queues', () => ({
  addQCJob: vi.fn(),
  addNudgeJob: vi.fn(),
  addPayoutJob: vi.fn(),
}));

// Global test lifecycle hooks
beforeAll(async () => {
  // Setup code that runs once before all tests
});

afterAll(async () => {
  // Cleanup code that runs once after all tests
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});
