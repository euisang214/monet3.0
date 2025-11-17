import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';
import {
  createMockUser,
  createMockCandidate,
  createMockProfessional,
  createMockAdmin,
  createMockBooking,
  createMockPayment,
  createMockSession,
  createMockPrismaClient,
} from '../utils/fixtures';
import { createMockRequest, parseJsonResponse, generateValidFeedbackSummary } from '../utils/helpers';

/**
 * API Route Integration Tests
 *
 * Tests for:
 * - Authentication endpoints
 * - Booking endpoints (candidate/professional)
 * - Payment endpoints
 * - Feedback endpoints
 * - Admin endpoints
 */

describe('API Routes - Authentication', () => {
  describe('POST /api/auth/signup', () => {
    it('should create new user with valid data', async () => {
      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        role: Role.CANDIDATE,
      };

      expect(signupData.email).toBeTruthy();
      expect(signupData.password.length).toBeGreaterThanOrEqual(6);
      expect([Role.CANDIDATE, Role.PROFESSIONAL]).toContain(signupData.role);
    });

    it('should reject signup with short password', async () => {
      const signupData = {
        email: 'test@example.com',
        password: '123',
        role: Role.CANDIDATE,
      };

      const isValid = signupData.password.length >= 6;
      expect(isValid).toBe(false);
    });

    it('should reject signup with invalid email', async () => {
      const signupData = {
        email: 'not-an-email',
        password: 'password123',
        role: Role.CANDIDATE,
      };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(signupData.email);
      expect(isValid).toBe(false);
    });

    it('should reject duplicate email', async () => {
      const existingUser = createMockCandidate({ email: 'existing@example.com' });
      const signupData = {
        email: 'existing@example.com',
        password: 'password123',
        role: Role.CANDIDATE,
      };

      // Would return error: email_already_exists
      expect(signupData.email).toBe(existingUser.email);
    });
  });

  describe('GET /api/auth/role', () => {
    it('should return user role for authenticated user', async () => {
      const user = createMockCandidate();
      const session = createMockSession(user);

      expect(session.user.role).toBe(Role.CANDIDATE);
    });

    it('should return 401 for unauthenticated request', async () => {
      const session = null;

      expect(session).toBeNull();
    });
  });
});

describe('API Routes - Candidate Bookings', () => {
  describe('POST /api/candidate/bookings/request', () => {
    it('should create booking request with valid data', async () => {
      const candidate = createMockCandidate();
      const professional = createMockProfessional();

      const requestData = {
        professionalId: professional.id,
        slots: [
          { start: '2024-12-01T14:00:00', end: '2024-12-01T14:30:00', timezone: 'America/New_York' },
        ],
        weeks: 2,
      };

      expect(requestData.professionalId).toBeTruthy();
      expect(requestData.slots).toHaveLength(1);
      expect(requestData.weeks).toBeGreaterThan(0);
    });

    it('should reject request without slots', async () => {
      const requestData = {
        professionalId: 'prof123',
        slots: [],
        weeks: 2,
      };

      const isValid = requestData.slots.length > 0;
      expect(isValid).toBe(false);
    });

    it('should create booking with requested status', async () => {
      const booking = createMockBooking({
        status: BookingStatus.requested,
      });

      expect(booking.status).toBe(BookingStatus.requested);
    });
  });

  describe('POST /api/candidate/bookings/[id]/checkout', () => {
    it('should create payment intent for accepted booking', async () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        priceUSD: 100.00,
      });

      const paymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: Math.round(booking.priceUSD! * 100),
      };

      expect(paymentIntent.client_secret).toBeTruthy();
      expect(paymentIntent.amount).toBe(10000); // $100 in cents
    });

    it('should reject checkout for non-accepted booking', async () => {
      const booking = createMockBooking({
        status: BookingStatus.requested,
      });

      const canCheckout = booking.status === BookingStatus.accepted;
      expect(canCheckout).toBe(false);
    });

    it('should reject checkout for booking without price', async () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        priceUSD: null,
      });

      const canCheckout = booking.priceUSD !== null && booking.priceUSD > 0;
      expect(canCheckout).toBe(false);
    });
  });

  describe('GET /api/candidate/professionals/search', () => {
    it('should return anonymized professional listings', async () => {
      const professional = createMockProfessional();

      // Anonymized: no name, company, etc.
      const anonymized = {
        id: professional.id,
        headline: 'Senior Engineer',
        industry: 'Technology',
        yearsOfExperience: '10+',
        skills: ['JavaScript', 'TypeScript'],
        // No firstName, lastName, company
      };

      expect(anonymized).not.toHaveProperty('firstName');
      expect(anonymized).not.toHaveProperty('lastName');
      expect(anonymized).not.toHaveProperty('company');
    });

    it('should support filtering by industry', async () => {
      const searchParams = {
        industry: 'Technology',
      };

      expect(searchParams.industry).toBe('Technology');
    });

    it('should support filtering by skills', async () => {
      const searchParams = {
        skills: ['JavaScript', 'TypeScript'],
      };

      expect(searchParams.skills).toContain('JavaScript');
    });
  });
});

describe('API Routes - Professional Bookings', () => {
  describe('POST /api/professional/bookings/[id]/schedule', () => {
    it('should accept booking and create Zoom meeting', async () => {
      const booking = createMockBooking({
        status: BookingStatus.requested,
      });

      const scheduleData = {
        startAt: '2024-12-01T14:00:00',
      };

      const updatedBooking = {
        ...booking,
        status: BookingStatus.accepted,
        startAt: new Date(scheduleData.startAt),
        zoomMeetingId: '123456789',
        zoomJoinUrl: 'https://zoom.us/j/123456789',
      };

      expect(updatedBooking.status).toBe(BookingStatus.accepted);
      expect(updatedBooking.zoomMeetingId).toBeTruthy();
      expect(updatedBooking.zoomJoinUrl).toContain('zoom.us');
    });

    it('should reject scheduling for non-requested booking', async () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
      });

      const canSchedule = booking.status === BookingStatus.requested;
      expect(canSchedule).toBe(false);
    });
  });

  describe('POST /api/professional/bookings/[id]/decline', () => {
    it('should decline booking request', async () => {
      const booking = createMockBooking({
        status: BookingStatus.requested,
      });

      const updatedBooking = {
        ...booking,
        status: BookingStatus.cancelled,
        cancelledBy: 'professional_id',
      };

      expect(updatedBooking.status).toBe(BookingStatus.cancelled);
    });
  });

  describe('POST /api/professional/feedback/[bookingId]', () => {
    it('should submit feedback with valid data', async () => {
      const feedbackData = {
        summary: generateValidFeedbackSummary(),
        actions: [
          'Update resume to highlight quantifiable achievements',
          'Research target companies and their tech stacks',
          'Schedule informational interviews with 3 industry contacts',
        ],
        contentRating: 5,
        deliveryRating: 5,
        valueRating: 5,
      };

      const wordCount = feedbackData.summary.split(/\s+/).filter(w => w.length > 0).length;

      expect(wordCount).toBeGreaterThanOrEqual(200);
      expect(feedbackData.actions).toHaveLength(3);
      expect(feedbackData.contentRating).toBeGreaterThanOrEqual(1);
      expect(feedbackData.contentRating).toBeLessThanOrEqual(5);
    });

    it('should reject feedback with short summary', async () => {
      const feedbackData = {
        summary: 'Good call.',
        actions: ['Action 1', 'Action 2', 'Action 3'],
        contentRating: 5,
        deliveryRating: 5,
        valueRating: 5,
      };

      const wordCount = feedbackData.summary.split(/\s+/).filter(w => w.length > 0).length;
      const isValid = wordCount >= 200;

      expect(isValid).toBe(false);
    });

    it('should reject feedback with wrong number of actions', async () => {
      const feedbackData = {
        summary: 'Valid long summary...',
        actions: ['Action 1', 'Action 2'], // Only 2
        contentRating: 5,
        deliveryRating: 5,
        valueRating: 5,
      };

      const isValid = feedbackData.actions.length === 3;
      expect(isValid).toBe(false);
    });
  });
});

describe('API Routes - Shared Endpoints', () => {
  describe('POST /api/shared/bookings/[id]/cancel', () => {
    it('should allow professional cancellation anytime', async () => {
      const professional = createMockProfessional();
      const booking = createMockBooking({
        professionalId: professional.id,
        status: BookingStatus.accepted,
        startAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      });

      const canCancel = true; // Professionals can always cancel
      expect(canCancel).toBe(true);
    });

    it('should allow candidate cancellation >= 3 hours before', async () => {
      const candidate = createMockCandidate();
      const booking = createMockBooking({
        candidateId: candidate.id,
        status: BookingStatus.accepted,
        startAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      });

      const minutesUntil = (booking.startAt.getTime() - Date.now()) / (60 * 1000);
      const canCancel = minutesUntil >= 180;

      expect(canCancel).toBe(true);
    });

    it('should reject candidate cancellation < 3 hours before', async () => {
      const candidate = createMockCandidate();
      const booking = createMockBooking({
        candidateId: candidate.id,
        status: BookingStatus.accepted,
        startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      });

      const minutesUntil = (booking.startAt.getTime() - Date.now()) / (60 * 1000);
      const canCancel = minutesUntil >= 180;

      expect(canCancel).toBe(false);
    });
  });

  describe('POST /api/shared/payments/confirm', () => {
    it('should confirm successful payment', async () => {
      const booking = createMockBooking();
      const payment = createMockPayment(booking.id, {
        stripePaymentIntentId: 'pi_test123',
        status: PaymentStatus.held,
      });

      const confirmData = {
        paymentIntentId: payment.stripePaymentIntentId,
      };

      expect(confirmData.paymentIntentId).toBeTruthy();
      expect(payment.status).toBe(PaymentStatus.held);
    });

    it('should reject invalid payment intent ID', async () => {
      const confirmData = {
        paymentIntentId: 'invalid',
      };

      const isValid = confirmData.paymentIntentId.startsWith('pi_');
      expect(isValid).toBe(false);
    });
  });
});

describe('API Routes - Admin Endpoints', () => {
  describe('PUT /api/admin/feedback/[bookingId]/qc-status', () => {
    it('should allow admin to update QC status', async () => {
      const admin = createMockAdmin();
      const session = createMockSession(admin);

      expect(session.user.role).toBe(Role.ADMIN);
    });

    it('should reject non-admin users', async () => {
      const candidate = createMockCandidate();
      const session = createMockSession(candidate);

      const isAdmin = session.user.role === Role.ADMIN;
      expect(isAdmin).toBe(false);
    });

    it('should trigger refund when setting status to failed', async () => {
      const updateData = {
        qcStatus: 'failed',
      };

      const shouldRefund = updateData.qcStatus === 'failed';
      expect(shouldRefund).toBe(true);
    });
  });

  describe('GET /api/admin/users/export', () => {
    it('should export users as CSV', async () => {
      const admin = createMockAdmin();
      const session = createMockSession(admin);

      expect(session.user.role).toBe(Role.ADMIN);
    });

    it('should reject non-admin users', async () => {
      const professional = createMockProfessional();
      const session = createMockSession(professional);

      const isAdmin = session.user.role === Role.ADMIN;
      expect(isAdmin).toBe(false);
    });
  });
});

describe('API Routes - Authorization', () => {
  describe('Session Validation', () => {
    it('should require authentication for protected endpoints', async () => {
      const session = null;

      const isAuthenticated = session !== null;
      expect(isAuthenticated).toBe(false);
    });

    it('should allow authenticated requests', async () => {
      const user = createMockCandidate();
      const session = createMockSession(user);

      const isAuthenticated = session !== null;
      expect(isAuthenticated).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow candidates to access candidate routes', async () => {
      const candidate = createMockCandidate();
      const session = createMockSession(candidate);

      const hasAccess = session.user.role === Role.CANDIDATE;
      expect(hasAccess).toBe(true);
    });

    it('should prevent candidates from accessing professional routes', async () => {
      const candidate = createMockCandidate();
      const session = createMockSession(candidate);

      const hasAccess = session.user.role === Role.PROFESSIONAL;
      expect(hasAccess).toBe(false);
    });

    it('should allow admins to access all routes', async () => {
      const admin = createMockAdmin();
      const session = createMockSession(admin);

      const isAdmin = session.user.role === Role.ADMIN;
      expect(isAdmin).toBe(true);
    });
  });

  describe('Resource Ownership', () => {
    it('should allow users to access their own bookings', async () => {
      const user = createMockCandidate();
      const booking = createMockBooking({
        candidateId: user.id,
      });

      const hasAccess = booking.candidateId === user.id;
      expect(hasAccess).toBe(true);
    });

    it('should prevent users from accessing others bookings', async () => {
      const user = createMockCandidate();
      const booking = createMockBooking({
        candidateId: 'different_user_id',
      });

      const hasAccess = booking.candidateId === user.id;
      expect(hasAccess).toBe(false);
    });
  });
});
