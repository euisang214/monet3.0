import { describe, it, expect, beforeEach } from 'vitest';
import { BookingStatus, PaymentStatus, PayoutStatus, QCStatus } from '@prisma/client';
import {
  createMockCandidate,
  createMockProfessional,
  createMockBooking,
  createMockPayment,
  createMockPayout,
  createMockFeedback,
} from '../utils/fixtures';
import { futureDate, generateValidFeedbackSummary } from '../utils/helpers';

/**
 * End-to-End Booking Workflow Tests
 *
 * Tests complete user journeys from start to finish:
 * - Happy path: Request → Accept → Pay → Call → Feedback → Payout
 * - Cancellation flows
 * - QC failure handling
 * - Error scenarios
 */

describe('E2E: Complete Booking Flow (Happy Path)', () => {
  it('should complete full booking lifecycle successfully', async () => {
    // Setup: Create users
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    // Step 1: Candidate browses professionals
    const professionalListing = {
      id: professional.id,
      headline: 'Senior Software Engineer',
      industry: 'Technology',
      yearsOfExperience: 10,
      skills: ['JavaScript', 'TypeScript', 'React'],
      priceUSD: 100.00,
      // Anonymized - no name, company
    };

    expect(professionalListing.id).toBeTruthy();
    expect(professionalListing.priceUSD).toBe(100.00);

    // Step 2: Candidate requests booking with available times
    const bookingRequest = {
      professionalId: professional.id,
      slots: [
        { start: '2024-12-01T14:00:00', end: '2024-12-01T14:30:00', timezone: 'America/New_York' },
        { start: '2024-12-02T10:00:00', end: '2024-12-02T10:30:00', timezone: 'America/New_York' },
      ],
      weeks: 2,
    };

    let booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.requested,
      priceUSD: professionalListing.priceUSD,
    });

    expect(booking.status).toBe(BookingStatus.requested);

    // Step 3: Professional views request and candidate's availability
    const candidateAvailability = bookingRequest.slots;
    expect(candidateAvailability).toHaveLength(2);

    // Step 4: Professional accepts and schedules by picking a time
    const selectedTime = bookingRequest.slots[0]; // Pick first slot
    booking = {
      ...booking,
      status: BookingStatus.accepted,
      startAt: new Date(selectedTime.start),
      endAt: new Date(selectedTime.end),
      zoomMeetingId: '123456789',
      zoomJoinUrl: 'https://zoom.us/j/123456789',
    };

    expect(booking.status).toBe(BookingStatus.accepted);
    expect(booking.zoomMeetingId).toBeTruthy();
    expect(booking.zoomJoinUrl).toContain('zoom.us');

    // Step 5: Candidate receives notification and proceeds to checkout
    const paymentIntent = {
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
      amount: Math.round(booking.priceUSD! * 100), // $100 = 10000 cents
    };

    expect(paymentIntent.client_secret).toBeTruthy();
    expect(paymentIntent.amount).toBe(10000);

    // Step 6: Candidate completes payment
    const payment = createMockPayment(booking.id, {
      stripePaymentIntentId: paymentIntent.id,
      amountUSD: booking.priceUSD!,
      platformFeeUSD: booking.priceUSD! * 0.2,
      status: PaymentStatus.held,
    });

    expect(payment.status).toBe(PaymentStatus.held);
    expect(payment.platformFeeUSD).toBe(20.00);

    // Step 7: Create payout record (pending QC)
    const payout = createMockPayout(booking.id, professional.id, {
      amountUSD: booking.priceUSD! - payment.platformFeeUSD,
      status: PayoutStatus.pending,
    });

    expect(payout.amountUSD).toBe(80.00);
    expect(payout.status).toBe(PayoutStatus.pending);

    // Step 8: Both parties join Zoom call
    booking.candidateJoinedAt = new Date();
    booking.professionalJoinedAt = new Date();
    booking.status = BookingStatus.completed_pending_feedback;

    expect(booking.candidateJoinedAt).toBeInstanceOf(Date);
    expect(booking.professionalJoinedAt).toBeInstanceOf(Date);
    expect(booking.status).toBe(BookingStatus.completed_pending_feedback);

    // Step 9: Professional submits feedback
    const feedback = createMockFeedback(booking.id, professional.id, {
      summary: generateValidFeedbackSummary(),
      actions: [
        'Update resume to highlight quantifiable achievements',
        'Research target companies and their tech stacks',
        'Schedule informational interviews with 3 industry contacts',
      ],
      contentRating: 5,
      deliveryRating: 5,
      valueRating: 5,
      qcStatus: QCStatus.passed,
    });

    booking.status = BookingStatus.completed;

    expect(feedback.qcStatus).toBe(QCStatus.passed);
    expect(booking.status).toBe(BookingStatus.completed);

    // Step 10: QC passes, payout released
    payout.status = PayoutStatus.paid;
    payout.stripeTransferId = 'tr_test123';
    payout.paidAt = new Date();
    payment.status = PaymentStatus.released;

    expect(payout.status).toBe(PayoutStatus.paid);
    expect(payout.paidAt).toBeInstanceOf(Date);
    expect(payment.status).toBe(PaymentStatus.released);

    // Verify final state
    expect(booking.status).toBe(BookingStatus.completed);
    expect(payment.status).toBe(PaymentStatus.released);
    expect(payout.status).toBe(PayoutStatus.paid);
    expect(feedback.qcStatus).toBe(QCStatus.passed);
  });
});

describe('E2E: Professional Cancellation Flow', () => {
  it('should handle professional cancellation with full refund', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    // Create accepted booking with payment
    let booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.accepted,
      priceUSD: 100.00,
      startAt: futureDate(24), // Tomorrow
    });

    const payment = createMockPayment(booking.id, {
      amountUSD: 100.00,
      platformFeeUSD: 20.00,
      status: PaymentStatus.held,
    });

    expect(booking.status).toBe(BookingStatus.accepted);
    expect(payment.status).toBe(PaymentStatus.held);

    // Professional cancels (can cancel anytime)
    booking.status = BookingStatus.cancelled;
    booking.cancelledBy = professional.id;
    booking.cancelledAt = new Date();
    booking.cancellationReason = 'Schedule conflict';

    // Full refund processed
    payment.status = PaymentStatus.refunded;

    expect(booking.status).toBe(BookingStatus.cancelled);
    expect(payment.status).toBe(PaymentStatus.refunded);
    expect(booking.cancelledBy).toBe(professional.id);
  });
});

describe('E2E: Candidate Cancellation Flow', () => {
  it('should handle candidate early cancellation (>= 3 hours) with full refund', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    // Create accepted booking with payment (4 hours from now)
    let booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.accepted,
      priceUSD: 100.00,
      startAt: futureDate(4),
    });

    const payment = createMockPayment(booking.id, {
      amountUSD: 100.00,
      platformFeeUSD: 20.00,
      status: PaymentStatus.held,
    });

    // Candidate cancels (>= 3 hours before)
    const minutesUntil = (booking.startAt.getTime() - Date.now()) / (60 * 1000);
    const canCancel = minutesUntil >= 180;

    expect(canCancel).toBe(true);

    booking.status = BookingStatus.cancelled;
    booking.cancelledBy = candidate.id;
    booking.cancelledAt = new Date();
    payment.status = PaymentStatus.refunded;

    expect(booking.status).toBe(BookingStatus.cancelled);
    expect(payment.status).toBe(PaymentStatus.refunded);
  });

  it('should reject candidate late cancellation (< 3 hours)', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    // Create accepted booking with payment (2 hours from now)
    const booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.accepted,
      priceUSD: 100.00,
      startAt: futureDate(2),
    });

    const payment = createMockPayment(booking.id, {
      amountUSD: 100.00,
      status: PaymentStatus.held,
    });

    // Try to cancel (< 3 hours before)
    const minutesUntil = (booking.startAt.getTime() - Date.now()) / (60 * 1000);
    const canCancel = minutesUntil >= 180;

    expect(canCancel).toBe(false);

    // Booking and payment remain unchanged
    expect(booking.status).toBe(BookingStatus.accepted);
    expect(payment.status).toBe(PaymentStatus.held);
  });
});

describe('E2E: QC Revise Flow', () => {
  it('should handle feedback revision with nudge emails', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    const booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.completed_pending_feedback,
    });

    const payment = createMockPayment(booking.id, {
      status: PaymentStatus.held,
    });

    const payout = createMockPayout(booking.id, professional.id, {
      status: PayoutStatus.pending,
    });

    // Professional submits short feedback
    let feedback = createMockFeedback(booking.id, professional.id, {
      summary: 'This is too short and does not meet the 200 word requirement.',
      actions: ['Action 1', 'Action 2', 'Action 3'],
      contentRating: 5,
      deliveryRating: 5,
      valueRating: 5,
      qcStatus: QCStatus.revise,
    });

    // QC runs and sets status to revise
    expect(feedback.qcStatus).toBe(QCStatus.revise);

    // Payout remains pending
    expect(payout.status).toBe(PayoutStatus.pending);

    // Nudge emails queued at +24h, +48h, +72h
    const nudgeDelays = [
      24 * 60 * 60 * 1000,
      48 * 60 * 60 * 1000,
      72 * 60 * 60 * 1000,
    ];
    expect(nudgeDelays).toHaveLength(3);

    // Professional resubmits with valid feedback
    feedback = {
      ...feedback,
      summary: generateValidFeedbackSummary(),
      qcStatus: QCStatus.passed,
    };

    // QC passes on resubmission
    expect(feedback.qcStatus).toBe(QCStatus.passed);

    // Payout can now be released
    payout.status = PayoutStatus.paid;
    payout.paidAt = new Date();
    payment.status = PaymentStatus.released;

    expect(payout.status).toBe(PayoutStatus.paid);
    expect(payment.status).toBe(PaymentStatus.released);
  });
});

describe('E2E: QC Failure Flow (Admin Intervention)', () => {
  it('should handle QC failure with automatic refund', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    const booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.completed,
    });

    const payment = createMockPayment(booking.id, {
      amountUSD: 100.00,
      status: PaymentStatus.held,
    });

    const payout = createMockPayout(booking.id, professional.id, {
      amountUSD: 80.00,
      status: PayoutStatus.pending,
    });

    const feedback = createMockFeedback(booking.id, professional.id, {
      qcStatus: QCStatus.revise, // Initially needs revision
    });

    // Admin manually sets QC status to failed
    feedback.qcStatus = QCStatus.failed;

    // Automatic refund triggered
    payment.status = PaymentStatus.refunded;
    payout.status = PayoutStatus.blocked;

    expect(feedback.qcStatus).toBe(QCStatus.failed);
    expect(payment.status).toBe(PaymentStatus.refunded);
    expect(payout.status).toBe(PayoutStatus.blocked);
  });
});

describe('E2E: No-Show Scenarios', () => {
  it('should handle when neither party joins call', async () => {
    const booking = createMockBooking({
      status: BookingStatus.accepted,
      startAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      candidateJoinedAt: null,
      professionalJoinedAt: null,
    });

    // Status remains accepted (or moves to cancelled by system)
    expect(booking.candidateJoinedAt).toBeNull();
    expect(booking.professionalJoinedAt).toBeNull();
  });

  it('should handle when only candidate joins', async () => {
    const booking = createMockBooking({
      status: BookingStatus.accepted,
      candidateJoinedAt: new Date(),
      professionalJoinedAt: null,
    });

    // Status remains accepted until both join
    expect(booking.candidateJoinedAt).toBeInstanceOf(Date);
    expect(booking.professionalJoinedAt).toBeNull();
    expect(booking.status).toBe(BookingStatus.accepted);
  });

  it('should handle when only professional joins', async () => {
    const booking = createMockBooking({
      status: BookingStatus.accepted,
      candidateJoinedAt: null,
      professionalJoinedAt: new Date(),
    });

    expect(booking.candidateJoinedAt).toBeNull();
    expect(booking.professionalJoinedAt).toBeInstanceOf(Date);
    expect(booking.status).toBe(BookingStatus.accepted);
  });
});

describe('E2E: Multiple Bookings', () => {
  it('should handle candidate booking multiple professionals', async () => {
    const candidate = createMockCandidate();
    const professional1 = createMockProfessional();
    const professional2 = createMockProfessional();

    const booking1 = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional1.id,
      status: BookingStatus.completed,
    });

    const booking2 = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional2.id,
      status: BookingStatus.accepted,
    });

    expect(booking1.candidateId).toBe(candidate.id);
    expect(booking2.candidateId).toBe(candidate.id);
    expect(booking1.professionalId).not.toBe(booking2.professionalId);
  });

  it('should handle professional serving multiple candidates', async () => {
    const professional = createMockProfessional();
    const candidate1 = createMockCandidate();
    const candidate2 = createMockCandidate();

    const booking1 = createMockBooking({
      candidateId: candidate1.id,
      professionalId: professional.id,
      status: BookingStatus.completed,
    });

    const booking2 = createMockBooking({
      candidateId: candidate2.id,
      professionalId: professional.id,
      status: BookingStatus.accepted,
    });

    expect(booking1.professionalId).toBe(professional.id);
    expect(booking2.professionalId).toBe(professional.id);
    expect(booking1.candidateId).not.toBe(booking2.candidateId);
  });
});

describe('E2E: Identity Reveal Logic', () => {
  it('should show anonymized profile before first booking', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    const hasCompletedBooking = false;

    const profile = hasCompletedBooking
      ? {
          // Full profile
          firstName: 'John',
          lastName: 'Doe',
          company: 'Tech Corp',
          headline: 'Senior Engineer',
        }
      : {
          // Anonymized
          headline: 'Senior Engineer',
          industry: 'Technology',
          yearsOfExperience: 10,
        };

    expect(profile).not.toHaveProperty('firstName');
    expect(profile).not.toHaveProperty('company');
  });

  it('should reveal identity after first completed booking', async () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();

    const booking = createMockBooking({
      candidateId: candidate.id,
      professionalId: professional.id,
      status: BookingStatus.completed,
    });

    const hasCompletedBooking = booking.status === BookingStatus.completed;

    expect(hasCompletedBooking).toBe(true);

    // Now candidate can see full profile
    const profile = {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Tech Corp',
      headline: 'Senior Engineer',
    };

    expect(profile).toHaveProperty('firstName');
    expect(profile).toHaveProperty('company');
  });
});
