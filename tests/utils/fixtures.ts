import { Role, BookingStatus, PaymentStatus, PayoutStatus, QCStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';

/**
 * Test data fixtures for creating consistent test data
 */

export const createMockUser = (overrides: any = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  hashedPassword: '$2a$10$test.hashed.password',
  role: Role.CANDIDATE,
  googleCalendarConnected: false,
  linkedinConnected: false,
  corporateEmailVerified: false,
  timezone: 'America/New_York',
  stripeCustomerId: null,
  stripeAccountId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCandidate = (overrides: any = {}) => createMockUser({
  role: Role.CANDIDATE,
  stripeCustomerId: 'cus_test_candidate',
  ...overrides,
});

export const createMockProfessional = (overrides: any = {}) => createMockUser({
  role: Role.PROFESSIONAL,
  stripeAccountId: 'acct_test_professional',
  corporateEmailVerified: true,
  ...overrides,
});

export const createMockAdmin = (overrides: any = {}) => createMockUser({
  role: Role.ADMIN,
  email: 'admin@monet.local',
  ...overrides,
});

export const createMockProfessionalProfile = (userId: string, overrides: any = {}) => ({
  id: uuid(),
  userId,
  firstName: 'John',
  lastName: 'Doe',
  headline: 'Senior Software Engineer',
  company: 'Tech Corp',
  yearsOfExperience: 10,
  industry: 'Technology',
  skills: ['JavaScript', 'TypeScript', 'React'],
  bio: 'Experienced software engineer with 10 years in the industry.',
  priceUSD: 100.00,
  timezone: 'America/New_York',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBooking = (overrides: any = {}) => {
  const now = new Date();
  const startAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000); // +30 minutes

  return {
    id: uuid(),
    candidateId: uuid(),
    professionalId: uuid(),
    status: BookingStatus.requested,
    priceUSD: 100.00,
    startAt,
    endAt,
    timezone: 'America/New_York',
    zoomMeetingId: null,
    zoomJoinUrl: null,
    candidateJoinedAt: null,
    professionalJoinedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const createMockPayment = (bookingId: string, overrides: any = {}) => ({
  id: uuid(),
  bookingId,
  stripePaymentIntentId: 'pi_test_' + uuid().slice(0, 8),
  amountUSD: 100.00,
  platformFeeUSD: 20.00,
  status: PaymentStatus.held,
  createdAt: new Date(),
  updatedAt: new Date(),
  timezone: 'America/New_York',
  ...overrides,
});

export const createMockPayout = (bookingId: string, professionalId: string, overrides: any = {}) => ({
  id: uuid(),
  bookingId,
  professionalId,
  amountUSD: 80.00,
  status: PayoutStatus.pending,
  stripeTransferId: null,
  paidAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  timezone: 'America/New_York',
  ...overrides,
});

export const createMockFeedback = (bookingId: string, professionalId: string, overrides: any = {}) => ({
  id: uuid(),
  bookingId,
  professionalId,
  summary: 'This is a detailed summary of the call with the candidate. We discussed their career goals, current challenges, and potential strategies for advancement. I provided specific insights based on my industry experience and recommended several concrete next steps for them to consider. The conversation was productive and the candidate was engaged throughout.',
  actions: [
    'Update resume to highlight quantifiable achievements',
    'Research target companies and their tech stacks',
    'Schedule informational interviews with 3 industry contacts',
  ],
  contentRating: 5,
  deliveryRating: 5,
  valueRating: 5,
  qcStatus: QCStatus.passed,
  submittedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  timezone: 'America/New_York',
  ...overrides,
});

export const createMockAvailability = (userId: string, overrides: any = {}) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(9, 0, 0, 0);
  const end = new Date(now);
  end.setHours(17, 0, 0, 0);

  return {
    id: uuid(),
    userId,
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'America/New_York',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const createMockSession = (user: any) => ({
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.email.split('@')[0],
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
});

export const createMockPrismaClient = () => {
  const mockData = {
    users: new Map(),
    bookings: new Map(),
    payments: new Map(),
    payouts: new Map(),
    feedback: new Map(),
    professionalProfiles: new Map(),
    availabilities: new Map(),
  };

  return {
    user: {
      findUnique: vi.fn((args) => {
        const user = Array.from(mockData.users.values()).find((u: any) =>
          u.id === args.where.id || u.email === args.where.email
        );
        return Promise.resolve(user || null);
      }),
      findFirst: vi.fn((args) => {
        const user = Array.from(mockData.users.values()).find((u: any) =>
          Object.entries(args.where).every(([key, value]) => (u as any)[key] === value)
        );
        return Promise.resolve(user || null);
      }),
      findMany: vi.fn(() => Promise.resolve(Array.from(mockData.users.values()))),
      create: vi.fn((args) => {
        const user = { ...args.data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
        mockData.users.set(user.id, user);
        return Promise.resolve(user);
      }),
      update: vi.fn((args) => {
        const user = mockData.users.get(args.where.id);
        if (!user) throw new Error('User not found');
        const updated = { ...user, ...args.data, updatedAt: new Date() };
        mockData.users.set(args.where.id, updated);
        return Promise.resolve(updated);
      }),
      delete: vi.fn((args) => {
        const user = mockData.users.get(args.where.id);
        mockData.users.delete(args.where.id);
        return Promise.resolve(user);
      }),
    },
    booking: {
      findUnique: vi.fn((args) => {
        return Promise.resolve(mockData.bookings.get(args.where.id) || null);
      }),
      findFirst: vi.fn((args) => {
        const booking = Array.from(mockData.bookings.values()).find((b: any) =>
          Object.entries(args.where).every(([key, value]) => (b as any)[key] === value)
        );
        return Promise.resolve(booking || null);
      }),
      findMany: vi.fn(() => Promise.resolve(Array.from(mockData.bookings.values()))),
      create: vi.fn((args) => {
        const booking = { ...args.data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
        mockData.bookings.set(booking.id, booking);
        return Promise.resolve(booking);
      }),
      update: vi.fn((args) => {
        const booking = mockData.bookings.get(args.where.id);
        if (!booking) throw new Error('Booking not found');
        const updated = { ...booking, ...args.data, updatedAt: new Date() };
        mockData.bookings.set(args.where.id, updated);
        return Promise.resolve(updated);
      }),
      delete: vi.fn((args) => {
        const booking = mockData.bookings.get(args.where.id);
        mockData.bookings.delete(args.where.id);
        return Promise.resolve(booking);
      }),
    },
    payment: {
      findUnique: vi.fn((args) => {
        return Promise.resolve(mockData.payments.get(args.where.id) || null);
      }),
      findFirst: vi.fn((args) => {
        const payment = Array.from(mockData.payments.values()).find((p: any) =>
          Object.entries(args.where).every(([key, value]) => (p as any)[key] === value)
        );
        return Promise.resolve(payment || null);
      }),
      create: vi.fn((args) => {
        const payment = { ...args.data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
        mockData.payments.set(payment.id, payment);
        return Promise.resolve(payment);
      }),
      update: vi.fn((args) => {
        const payment = mockData.payments.get(args.where.id);
        if (!payment) throw new Error('Payment not found');
        const updated = { ...payment, ...args.data, updatedAt: new Date() };
        mockData.payments.set(args.where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    payout: {
      findUnique: vi.fn((args) => {
        return Promise.resolve(mockData.payouts.get(args.where.id) || null);
      }),
      findFirst: vi.fn((args) => {
        const payout = Array.from(mockData.payouts.values()).find((p: any) =>
          Object.entries(args.where).every(([key, value]) => (p as any)[key] === value)
        );
        return Promise.resolve(payout || null);
      }),
      create: vi.fn((args) => {
        const payout = { ...args.data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
        mockData.payouts.set(payout.id, payout);
        return Promise.resolve(payout);
      }),
      update: vi.fn((args) => {
        const payout = mockData.payouts.get(args.where.id);
        if (!payout) throw new Error('Payout not found');
        const updated = { ...payout, ...args.data, updatedAt: new Date() };
        mockData.payouts.set(args.where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    feedback: {
      findUnique: vi.fn((args) => {
        return Promise.resolve(mockData.feedback.get(args.where.id) || null);
      }),
      findFirst: vi.fn((args) => {
        const feedback = Array.from(mockData.feedback.values()).find((f: any) =>
          Object.entries(args.where).every(([key, value]) => (f as any)[key] === value)
        );
        return Promise.resolve(feedback || null);
      }),
      create: vi.fn((args) => {
        const feedback = { ...args.data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
        mockData.feedback.set(feedback.id, feedback);
        return Promise.resolve(feedback);
      }),
      update: vi.fn((args) => {
        const feedback = mockData.feedback.get(args.where.id);
        if (!feedback) throw new Error('Feedback not found');
        const updated = { ...feedback, ...args.data, updatedAt: new Date() };
        mockData.feedback.set(args.where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    professionalProfile: {
      findUnique: vi.fn((args) => {
        return Promise.resolve(mockData.professionalProfiles.get(args.where.id) || null);
      }),
      findFirst: vi.fn((args) => {
        const profile = Array.from(mockData.professionalProfiles.values()).find((p: any) =>
          Object.entries(args.where).every(([key, value]) => (p as any)[key] === value)
        );
        return Promise.resolve(profile || null);
      }),
      create: vi.fn((args) => {
        const profile = { ...args.data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
        mockData.professionalProfiles.set(profile.id, profile);
        return Promise.resolve(profile);
      }),
      update: vi.fn((args) => {
        const profile = mockData.professionalProfiles.get(args.where.id);
        if (!profile) throw new Error('Profile not found');
        const updated = { ...profile, ...args.data, updatedAt: new Date() };
        mockData.professionalProfiles.set(args.where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    $transaction: vi.fn((callback) => callback(mockData)),
  };
};

// Import vi from vitest
import { vi } from 'vitest';
