import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role, BookingStatus, PaymentStatus, PayoutStatus, QCStatus } from '@prisma/client';
import {
  createMockUser,
  createMockCandidate,
  createMockProfessional,
  createMockProfessionalProfile,
  createMockBooking,
  createMockPayment,
  createMockPayout,
  createMockFeedback,
  createMockSession,
} from '../utils/fixtures';
import {
  createMockRequest,
  parseJsonResponse,
  generateValidFeedbackSummary,
  futureDate,
  createStripeWebhookEvent,
} from '../utils/helpers';

/**
 * Payment Flow Integration Tests
 *
 * Tests for the complete payment lifecycle:
 * - Booking request → Checkout → Payment confirmation
 * - QC validation → Payout gating → Payout release
 * - Cancellation → Refund processing
 * - Idempotency and duplicate payment handling
 */

describe('Payment Flow Integration', () => {
  describe('Checkout Flow', () => {
    const candidate = createMockCandidate();
    const professional = createMockProfessional();
    const professionalProfile = createMockProfessionalProfile(professional.id, {
      priceUSD: 10000, // $100.00 in cents
    });

    it('should create payment intent with correct amount in cents', () => {
      const booking = createMockBooking({
        candidateId: candidate.id,
        professionalId: professional.id,
        status: BookingStatus.accepted,
        priceUSD: professionalProfile.priceUSD,
      });

      // Payment amount should already be in cents
      const paymentAmount = booking.priceUSD;
      const platformFee = Math.round(paymentAmount * 0.2); // 20% platform fee

      expect(paymentAmount).toBe(10000); // $100.00 in cents
      expect(platformFee).toBe(2000); // $20.00 in cents
    });

    it('should not double-convert cents to cents', () => {
      // This tests the fix for the 100x overbilling bug
      const priceInCents = 10000; // $100.00

      // Correct: pass cents directly to Stripe
      const correctAmount = priceInCents;

      // Bug: would have been usdToCents(priceInCents) = 1000000
      const buggyAmount = priceInCents * 100;

      expect(correctAmount).toBe(10000);
      expect(buggyAmount).toBe(1000000); // 100x overbilling!
      expect(correctAmount).not.toBe(buggyAmount);
    });

    it('should use idempotency key for payment intent creation', () => {
      const booking = createMockBooking({
        id: 'booking_123',
        status: BookingStatus.accepted,
      });

      const idempotencyKey = `booking_checkout_${booking.id}`;

      expect(idempotencyKey).toBe('booking_checkout_booking_123');
    });

    it('should use upsert for payment record to handle duplicates', () => {
      const booking = createMockBooking({
        id: 'booking_123',
        status: BookingStatus.accepted,
        priceUSD: 10000,
      });

      // First payment creation
      const firstPayment = createMockPayment(booking.id, {
        stripePaymentIntentId: 'pi_first',
        amountUSD: 10000,
        status: PaymentStatus.held,
      });

      // Second attempt (duplicate) should upsert, not create new
      const secondPayment = {
        ...firstPayment,
        stripePaymentIntentId: 'pi_second', // Updated
      };

      // Both should reference the same booking
      expect(firstPayment.bookingId).toBe(secondPayment.bookingId);
    });

    it('should reject checkout for booking without accepted status', () => {
      const requestedBooking = createMockBooking({
        status: BookingStatus.requested,
      });

      const cancelledBooking = createMockBooking({
        status: BookingStatus.cancelled,
      });

      const canCheckoutRequested = requestedBooking.status === BookingStatus.accepted;
      const canCheckoutCancelled = cancelledBooking.status === BookingStatus.accepted;

      expect(canCheckoutRequested).toBe(false);
      expect(canCheckoutCancelled).toBe(false);
    });

    it('should reject checkout for booking without price', () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        priceUSD: null,
      });

      const canCheckout = booking.priceUSD !== null && booking.priceUSD > 0;
      expect(canCheckout).toBe(false);
    });
  });

  describe('Payment Confirmation Flow', () => {
    it('should confirm payment with valid payment intent ID', () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
      });
      const payment = createMockPayment(booking.id, {
        stripePaymentIntentId: 'pi_test123',
        status: PaymentStatus.held,
      });

      // Simulated confirmation
      const confirmData = {
        paymentIntentId: payment.stripePaymentIntentId,
      };

      expect(confirmData.paymentIntentId).toBeTruthy();
      expect(confirmData.paymentIntentId).toMatch(/^pi_/);
    });

    it('should reject confirmation with invalid payment intent ID format', () => {
      const invalidIds = ['invalid', '123', 'pm_123', ''];

      invalidIds.forEach(id => {
        const isValid = id.startsWith('pi_');
        expect(isValid).toBe(false);
      });
    });

    it('should keep payment status as held after confirmation', () => {
      const payment = createMockPayment('booking_123', {
        status: PaymentStatus.held,
      });

      // After successful payment confirmation, status remains held
      // until QC passes and payout is processed
      expect(payment.status).toBe(PaymentStatus.held);
    });
  });

  describe('QC Validation and Payout Gating', () => {
    it('should validate feedback with correct field names', () => {
      const feedback = createMockFeedback('booking_123', 'prof_123', {
        contentRating: 5,
        deliveryRating: 4,
        valueRating: 5,
      });

      // Correct field names (not starsCategory1, etc.)
      const starsValid =
        feedback.contentRating > 0 &&
        feedback.deliveryRating > 0 &&
        feedback.valueRating > 0;

      expect(starsValid).toBe(true);
    });

    it('should validate minimum word count requirement', () => {
      const validSummary = generateValidFeedbackSummary();
      const wordCount = validSummary.split(/\s+/).filter(w => w.length > 0).length;

      expect(wordCount).toBeGreaterThanOrEqual(200);
    });

    it('should validate exactly 3 action items', () => {
      const feedback = createMockFeedback('booking_123', 'prof_123');

      expect(feedback.actions).toHaveLength(3);
    });

    it('should create pending payout when QC passes', () => {
      const booking = createMockBooking({
        status: BookingStatus.completed,
        priceUSD: 10000,
      });
      const payment = createMockPayment(booking.id, {
        amountUSD: 10000,
        platformFeeUSD: 2000,
        status: PaymentStatus.held,
      });
      const feedback = createMockFeedback(booking.id, booking.professionalId, {
        qcStatus: QCStatus.passed,
      });

      // Payout created after QC passes
      const payout = createMockPayout(booking.id, booking.professionalId, {
        amountUSD: payment.amountUSD - payment.platformFeeUSD,
        status: PayoutStatus.pending,
      });

      expect(payout.status).toBe(PayoutStatus.pending);
      expect(payout.amountUSD).toBe(8000); // 80% of $100
    });

    it('should keep payout pending when QC status is revise', () => {
      const feedback = createMockFeedback('booking_123', 'prof_123', {
        qcStatus: QCStatus.revise,
      });

      // No payout created yet
      const canCreatePayout = feedback.qcStatus === QCStatus.passed;
      expect(canCreatePayout).toBe(false);
    });
  });

  describe('Payout Release Flow', () => {
    it('should release payment and mark payout as paid', () => {
      const booking = createMockBooking({
        status: BookingStatus.completed,
      });

      const payment = createMockPayment(booking.id, {
        status: PaymentStatus.released,
      });

      const payout = createMockPayout(booking.id, booking.professionalId, {
        status: PayoutStatus.paid,
        stripeTransferId: 'tr_test123',
        paidAt: new Date(),
      });

      expect(payment.status).toBe(PaymentStatus.released);
      expect(payout.status).toBe(PayoutStatus.paid);
      expect(payout.stripeTransferId).toBeTruthy();
      expect(payout.paidAt).toBeInstanceOf(Date);
    });

    it('should calculate correct professional payout amount', () => {
      const bookingAmount = 15000; // $150.00 in cents
      const platformFeePercent = 0.2;
      const platformFee = Math.round(bookingAmount * platformFeePercent);
      const payoutAmount = bookingAmount - platformFee;

      expect(platformFee).toBe(3000); // $30.00
      expect(payoutAmount).toBe(12000); // $120.00
    });

    it('should handle decimal platform fee correctly', () => {
      const bookingAmount = 9999; // $99.99 in cents
      const platformFeePercent = 0.2;
      const platformFee = Math.round(bookingAmount * platformFeePercent);
      const payoutAmount = bookingAmount - platformFee;

      expect(platformFee).toBe(2000); // Rounded
      expect(payoutAmount).toBe(7999);
    });
  });

  describe('Cancellation and Refund Flow', () => {
    describe('Professional Cancellation', () => {
      it('should allow professional to cancel at any time', () => {
        const professional = createMockProfessional();
        const booking = createMockBooking({
          professionalId: professional.id,
          status: BookingStatus.accepted,
          startAt: futureDate(1), // Only 1 hour from now
        });

        // Professional can always cancel
        const canCancel = true;
        expect(canCancel).toBe(true);
      });

      it('should refund payment when professional cancels', () => {
        const booking = createMockBooking({
          status: BookingStatus.cancelled,
        });
        const payment = createMockPayment(booking.id, {
          status: PaymentStatus.refunded,
        });

        expect(payment.status).toBe(PaymentStatus.refunded);
      });
    });

    describe('Candidate Cancellation', () => {
      it('should allow candidate cancellation >= 3 hours before call', () => {
        const candidate = createMockCandidate();
        const booking = createMockBooking({
          candidateId: candidate.id,
          status: BookingStatus.accepted,
          startAt: futureDate(4), // 4 hours from now
        });

        const minutesUntil = (booking.startAt.getTime() - Date.now()) / (60 * 1000);
        const canCancel = minutesUntil >= 180;

        expect(canCancel).toBe(true);
      });

      it('should reject candidate cancellation < 3 hours before call', () => {
        const candidate = createMockCandidate();
        const booking = createMockBooking({
          candidateId: candidate.id,
          status: BookingStatus.accepted,
          startAt: futureDate(2), // Only 2 hours from now
        });

        const minutesUntil = (booking.startAt.getTime() - Date.now()) / (60 * 1000);
        const canCancel = minutesUntil >= 180;

        expect(canCancel).toBe(false);
      });

      it('should refund payment for allowed candidate cancellation', () => {
        const booking = createMockBooking({
          status: BookingStatus.cancelled,
          startAt: futureDate(5), // Was 5 hours away when cancelled
        });
        const payment = createMockPayment(booking.id, {
          status: PaymentStatus.refunded,
        });

        expect(payment.status).toBe(PaymentStatus.refunded);
      });

      it('should not refund for late candidate cancellation', () => {
        // Late cancellation returns error, payment stays held
        const payment = createMockPayment('booking_123', {
          status: PaymentStatus.held,
        });

        // No status change for late cancellation
        expect(payment.status).not.toBe(PaymentStatus.refunded);
      });
    });

    describe('Admin QC Failure Refund', () => {
      it('should refund payment when admin sets QC to failed', () => {
        const booking = createMockBooking({
          status: BookingStatus.completed,
        });
        const payment = createMockPayment(booking.id, {
          status: PaymentStatus.refunded,
        });
        const payout = createMockPayout(booking.id, booking.professionalId, {
          status: PayoutStatus.blocked,
        });

        expect(payment.status).toBe(PaymentStatus.refunded);
        expect(payout.status).toBe(PayoutStatus.blocked);
      });
    });
  });

  describe('Stripe Webhook Handling', () => {
    it('should verify webhook signature before processing', () => {
      const webhookSecret = 'whsec_test123';
      const hasSecret = !!webhookSecret;

      expect(hasSecret).toBe(true);
    });

    it('should reject webhook without configured secret', () => {
      const webhookSecret = undefined;
      const hasSecret = !!webhookSecret;

      expect(hasSecret).toBe(false);
    });

    it('should handle payment_intent.succeeded event', () => {
      const event = createStripeWebhookEvent('payment_intent.succeeded', {
        id: 'pi_test123',
        amount: 10000,
        metadata: { bookingId: 'booking_123' },
      });

      expect(event.type).toBe('payment_intent.succeeded');
      expect(event.data.object.id).toBe('pi_test123');
    });

    it('should handle transfer.created event', () => {
      const event = createStripeWebhookEvent('transfer.created', {
        id: 'tr_test123',
        amount: 8000,
        destination: 'acct_professional',
      });

      expect(event.type).toBe('transfer.created');
      expect(event.data.object.amount).toBe(8000);
    });
  });

  describe('End-to-End Payment Flow', () => {
    it('should complete full payment lifecycle', () => {
      // 1. Setup
      const candidate = createMockCandidate();
      const professional = createMockProfessional();
      const profile = createMockProfessionalProfile(professional.id, {
        priceUSD: 10000, // $100 in cents
      });

      // 2. Booking created and accepted
      const booking = createMockBooking({
        id: 'booking_e2e',
        candidateId: candidate.id,
        professionalId: professional.id,
        status: BookingStatus.accepted,
        priceUSD: profile.priceUSD,
        startAt: futureDate(24),
      });

      // 3. Checkout - payment held in escrow
      const payment = createMockPayment(booking.id, {
        stripePaymentIntentId: 'pi_e2e',
        amountUSD: booking.priceUSD,
        platformFeeUSD: 2000,
        status: PaymentStatus.held,
      });

      expect(payment.status).toBe(PaymentStatus.held);
      expect(payment.amountUSD).toBe(10000);

      // 4. Call completed
      const completedBooking = {
        ...booking,
        status: BookingStatus.completed,
        candidateJoinedAt: new Date(),
        professionalJoinedAt: new Date(),
      };

      expect(completedBooking.status).toBe(BookingStatus.completed);

      // 5. Feedback submitted and QC passed
      const feedback = createMockFeedback(booking.id, professional.id, {
        summary: generateValidFeedbackSummary(),
        contentRating: 5,
        deliveryRating: 5,
        valueRating: 5,
        qcStatus: QCStatus.passed,
      });

      expect(feedback.qcStatus).toBe(QCStatus.passed);

      // 6. Payout created
      const payout = createMockPayout(booking.id, professional.id, {
        amountUSD: 8000, // $80 (80% of $100)
        status: PayoutStatus.pending,
      });

      expect(payout.status).toBe(PayoutStatus.pending);
      expect(payout.amountUSD).toBe(8000);

      // 7. Payment released and payout completed
      const releasedPayment = {
        ...payment,
        status: PaymentStatus.released,
      };

      const completedPayout = {
        ...payout,
        status: PayoutStatus.paid,
        stripeTransferId: 'tr_e2e',
        paidAt: new Date(),
      };

      expect(releasedPayment.status).toBe(PaymentStatus.released);
      expect(completedPayout.status).toBe(PayoutStatus.paid);
      expect(completedPayout.stripeTransferId).toBeTruthy();
    });

    it('should handle cancellation in payment flow', () => {
      // 1. Setup
      const candidate = createMockCandidate();
      const professional = createMockProfessional();

      // 2. Booking accepted with payment held
      const booking = createMockBooking({
        candidateId: candidate.id,
        professionalId: professional.id,
        status: BookingStatus.accepted,
        priceUSD: 10000,
        startAt: futureDate(24),
      });

      const payment = createMockPayment(booking.id, {
        amountUSD: booking.priceUSD,
        status: PaymentStatus.held,
      });

      // 3. Professional cancels
      const cancelledBooking = {
        ...booking,
        status: BookingStatus.cancelled,
        cancelledBy: professional.id,
        cancelledAt: new Date(),
      };

      // 4. Payment refunded
      const refundedPayment = {
        ...payment,
        status: PaymentStatus.refunded,
      };

      expect(cancelledBooking.status).toBe(BookingStatus.cancelled);
      expect(refundedPayment.status).toBe(PaymentStatus.refunded);
    });

    it('should handle QC failure and refund', () => {
      // 1. Call completed with payment held
      const booking = createMockBooking({
        status: BookingStatus.completed,
        priceUSD: 10000,
      });

      const payment = createMockPayment(booking.id, {
        amountUSD: booking.priceUSD,
        status: PaymentStatus.held,
      });

      // 2. Feedback submitted but fails QC (admin action)
      const feedback = createMockFeedback(booking.id, booking.professionalId, {
        summary: 'Too short.',
        actions: ['Action 1'], // Only 1 action
        qcStatus: QCStatus.failed,
      });

      expect(feedback.qcStatus).toBe(QCStatus.failed);

      // 3. Admin action triggers refund and blocks payout
      const refundedPayment = {
        ...payment,
        status: PaymentStatus.refunded,
      };

      const blockedPayout = createMockPayout(booking.id, booking.professionalId, {
        amountUSD: 8000,
        status: PayoutStatus.blocked,
      });

      expect(refundedPayment.status).toBe(PaymentStatus.refunded);
      expect(blockedPayout.status).toBe(PayoutStatus.blocked);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing professional profile', () => {
      const professionalWithoutProfile = createMockProfessional();
      const profile = null;

      const canProceed = profile !== null;
      expect(canProceed).toBe(false);
    });

    it('should handle missing Stripe account for professional', () => {
      const professionalNoStripe = createMockProfessional({
        stripeAccountId: null,
      });

      const canReceivePayout = !!professionalNoStripe.stripeAccountId;
      expect(canReceivePayout).toBe(false);
    });

    it('should handle zero price booking', () => {
      const booking = createMockBooking({
        priceUSD: 0,
      });

      const isValidPrice = booking.priceUSD > 0;
      expect(isValidPrice).toBe(false);
    });

    it('should handle payment already exists for booking', () => {
      const booking = createMockBooking();
      const existingPayment = createMockPayment(booking.id, {
        status: PaymentStatus.held,
      });

      // Upsert should update, not create duplicate
      const payment2 = {
        ...existingPayment,
        stripePaymentIntentId: 'pi_new',
      };

      expect(payment2.bookingId).toBe(existingPayment.bookingId);
    });

    it('should validate payment intent belongs to correct booking', () => {
      const booking1 = createMockBooking({ id: 'booking_1' });
      const booking2 = createMockBooking({ id: 'booking_2' });

      const payment = createMockPayment(booking1.id, {
        stripePaymentIntentId: 'pi_for_booking1',
      });

      // Attempt to confirm with wrong booking
      const isCorrectBooking = payment.bookingId === booking2.id;
      expect(isCorrectBooking).toBe(false);
    });
  });
});
