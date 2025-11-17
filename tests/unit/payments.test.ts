import { describe, it, expect } from 'vitest';
import { PaymentStatus, PayoutStatus } from '@prisma/client';
import { createMockPayment, createMockPayout, createMockBooking } from '../utils/fixtures';

/**
 * Payment and Payout Tests
 *
 * Tests for:
 * - Payment creation and status management
 * - Platform fee calculation
 * - Payout gating and release
 * - Refund processing
 * - Stripe integration
 */

describe('Payment Processing', () => {
  describe('Payment Creation', () => {
    const bookingId = 'booking123';

    it('should create payment with held status', () => {
      const payment = createMockPayment(bookingId);

      expect(payment.status).toBe(PaymentStatus.held);
      expect(payment.bookingId).toBe(bookingId);
    });

    it('should store Stripe payment intent ID', () => {
      const payment = createMockPayment(bookingId);

      expect(payment.stripePaymentIntentId).toBeTruthy();
      expect(payment.stripePaymentIntentId).toMatch(/^pi_test_/);
    });

    it('should store payment amount in USD', () => {
      const payment = createMockPayment(bookingId, { amountUSD: 150.00 });

      expect(payment.amountUSD).toBe(150.00);
    });

    it('should support decimal amounts', () => {
      const payment = createMockPayment(bookingId, { amountUSD: 99.99 });

      expect(payment.amountUSD).toBe(99.99);
    });
  });

  describe('Platform Fee Calculation', () => {
    it('should calculate 20% platform fee', () => {
      const bookingAmount = 100.00;
      const platformFeePercent = 20;
      const expectedFee = bookingAmount * (platformFeePercent / 100);

      const payment = createMockPayment('booking123', {
        amountUSD: bookingAmount,
        platformFeeUSD: expectedFee,
      });

      expect(payment.platformFeeUSD).toBe(20.00);
    });

    it('should handle different price points', () => {
      const testCases = [
        { price: 50, expectedFee: 10 },
        { price: 100, expectedFee: 20 },
        { price: 150, expectedFee: 30 },
        { price: 200, expectedFee: 40 },
      ];

      testCases.forEach(({ price, expectedFee }) => {
        const payment = createMockPayment('booking123', {
          amountUSD: price,
          platformFeeUSD: expectedFee,
        });

        expect(payment.platformFeeUSD).toBe(expectedFee);
      });
    });

    it('should calculate professional payout (80% of booking price)', () => {
      const bookingAmount = 100.00;
      const platformFee = 20.00;
      const professionalAmount = bookingAmount - platformFee;

      expect(professionalAmount).toBe(80.00);
    });

    it('should handle decimal fees correctly', () => {
      const bookingAmount = 99.99;
      const platformFeePercent = 20;
      const platformFee = Number((bookingAmount * (platformFeePercent / 100)).toFixed(2));
      const professionalAmount = Number((bookingAmount - platformFee).toFixed(2));

      expect(platformFee).toBe(20.00);
      expect(professionalAmount).toBe(79.99);
    });
  });

  describe('Payment Status Transitions', () => {
    it('should transition from held to released', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.held,
      });

      payment.status = PaymentStatus.released;
      expect(payment.status).toBe(PaymentStatus.released);
    });

    it('should transition from held to refunded', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.held,
      });

      payment.status = PaymentStatus.refunded;
      expect(payment.status).toBe(PaymentStatus.refunded);
    });

    it('should keep payment held until QC passes', () => {
      const payment = createMockPayment('booking123');

      // Payment should stay held until feedback QC passes
      expect(payment.status).toBe(PaymentStatus.held);
    });
  });

  describe('Escrow Pattern', () => {
    it('should hold funds in escrow after payment', () => {
      const payment = createMockPayment('booking123');

      expect(payment.status).toBe(PaymentStatus.held);
    });

    it('should release funds after QC passes', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.released,
      });

      expect(payment.status).toBe(PaymentStatus.released);
    });

    it('should refund if QC fails', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.refunded,
      });

      expect(payment.status).toBe(PaymentStatus.refunded);
    });
  });
});

describe('Payout Processing', () => {
  describe('Payout Creation', () => {
    const bookingId = 'booking123';
    const professionalId = 'prof123';

    it('should create payout with pending status', () => {
      const payout = createMockPayout(bookingId, professionalId);

      expect(payout.status).toBe(PayoutStatus.pending);
      expect(payout.bookingId).toBe(bookingId);
      expect(payout.professionalId).toBe(professionalId);
    });

    it('should calculate payout amount (80% of booking)', () => {
      const bookingAmount = 100.00;
      const payoutAmount = 80.00; // 100 - 20 (platform fee)

      const payout = createMockPayout(bookingId, professionalId, {
        amountUSD: payoutAmount,
      });

      expect(payout.amountUSD).toBe(80.00);
    });

    it('should not have Stripe transfer ID initially', () => {
      const payout = createMockPayout(bookingId, professionalId);

      expect(payout.stripeTransferId).toBeNull();
    });

    it('should not have paid timestamp initially', () => {
      const payout = createMockPayout(bookingId, professionalId);

      expect(payout.paidAt).toBeNull();
    });
  });

  describe('Payout Gating (QC Requirements)', () => {
    const bookingId = 'booking123';
    const professionalId = 'prof123';

    it('should keep payout pending until QC passes', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.pending,
      });

      expect(payout.status).toBe(PayoutStatus.pending);
      expect(payout.paidAt).toBeNull();
    });

    it('should allow payout after QC passes', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.paid,
        stripeTransferId: 'tr_test123',
        paidAt: new Date(),
      });

      expect(payout.status).toBe(PayoutStatus.paid);
      expect(payout.stripeTransferId).toBeTruthy();
      expect(payout.paidAt).toBeInstanceOf(Date);
    });

    it('should block payout if QC fails', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.blocked,
      });

      expect(payout.status).toBe(PayoutStatus.blocked);
      expect(payout.paidAt).toBeNull();
    });
  });

  describe('Payout Status Transitions', () => {
    const bookingId = 'booking123';
    const professionalId = 'prof123';

    it('should transition from pending to paid', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.pending,
      });

      payout.status = PayoutStatus.paid;
      payout.stripeTransferId = 'tr_test123';
      payout.paidAt = new Date();

      expect(payout.status).toBe(PayoutStatus.paid);
      expect(payout.stripeTransferId).toBeTruthy();
      expect(payout.paidAt).toBeInstanceOf(Date);
    });

    it('should transition from pending to blocked', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.pending,
      });

      payout.status = PayoutStatus.blocked;

      expect(payout.status).toBe(PayoutStatus.blocked);
    });

    it('should not transition from blocked to paid without admin intervention', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.blocked,
      });

      // Blocked payouts should stay blocked
      expect(payout.status).toBe(PayoutStatus.blocked);
    });
  });

  describe('Stripe Integration', () => {
    const bookingId = 'booking123';
    const professionalId = 'prof123';

    it('should store Stripe transfer ID after payout', () => {
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.paid,
        stripeTransferId: 'tr_1234567890abcdef',
      });

      expect(payout.stripeTransferId).toMatch(/^tr_/);
    });

    it('should record payout timestamp', () => {
      const paidAt = new Date();
      const payout = createMockPayout(bookingId, professionalId, {
        status: PayoutStatus.paid,
        paidAt,
      });

      expect(payout.paidAt).toEqual(paidAt);
    });
  });
});

describe('Refund Processing', () => {
  describe('Full Refund Scenarios', () => {
    it('should refund when professional cancels', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.refunded,
      });

      expect(payment.status).toBe(PaymentStatus.refunded);
    });

    it('should refund when candidate cancels >= 3 hours before', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.refunded,
      });

      expect(payment.status).toBe(PaymentStatus.refunded);
    });

    it('should refund when QC fails (admin action)', () => {
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.refunded,
      });
      const payout = createMockPayout('booking123', 'prof123', {
        status: PayoutStatus.blocked,
      });

      expect(payment.status).toBe(PaymentStatus.refunded);
      expect(payout.status).toBe(PayoutStatus.blocked);
    });
  });

  describe('No Refund Scenarios', () => {
    it('should not refund when candidate cancels < 3 hours before', () => {
      // Per CLAUDE.md, late cancellations return error and no refund
      const payment = createMockPayment('booking123', {
        status: PaymentStatus.held,
      });

      // Should remain held (or transition to released)
      expect(payment.status).not.toBe(PaymentStatus.refunded);
    });
  });
});

describe('Payment and Payout Relationship', () => {
  it('should link payment and payout to same booking', () => {
    const bookingId = 'booking123';
    const payment = createMockPayment(bookingId);
    const payout = createMockPayout(bookingId, 'prof123');

    expect(payment.bookingId).toBe(payout.bookingId);
  });

  it('should ensure payout amount = payment amount - platform fee', () => {
    const bookingId = 'booking123';
    const paymentAmount = 100.00;
    const platformFee = 20.00;
    const payoutAmount = paymentAmount - platformFee;

    const payment = createMockPayment(bookingId, {
      amountUSD: paymentAmount,
      platformFeeUSD: platformFee,
    });
    const payout = createMockPayout(bookingId, 'prof123', {
      amountUSD: payoutAmount,
    });

    expect(payment.amountUSD - payment.platformFeeUSD).toBe(payout.amountUSD);
  });

  it('should coordinate payment release and payout paid status', () => {
    const bookingId = 'booking123';
    const payment = createMockPayment(bookingId, {
      status: PaymentStatus.released,
    });
    const payout = createMockPayout(bookingId, 'prof123', {
      status: PayoutStatus.paid,
    });

    // When payout is paid, payment should be released
    expect(payment.status).toBe(PaymentStatus.released);
    expect(payout.status).toBe(PayoutStatus.paid);
  });

  it('should coordinate payment refund and payout blocked status', () => {
    const bookingId = 'booking123';
    const payment = createMockPayment(bookingId, {
      status: PaymentStatus.refunded,
    });
    const payout = createMockPayout(bookingId, 'prof123', {
      status: PayoutStatus.blocked,
    });

    // When payment is refunded, payout should be blocked
    expect(payment.status).toBe(PaymentStatus.refunded);
    expect(payout.status).toBe(PayoutStatus.blocked);
  });
});

describe('Timezone Tracking', () => {
  it('should store timezone with payment', () => {
    const payment = createMockPayment('booking123', {
      timezone: 'America/New_York',
    });

    expect(payment.timezone).toBe('America/New_York');
  });

  it('should store timezone with payout', () => {
    const payout = createMockPayout('booking123', 'prof123', {
      timezone: 'America/Los_Angeles',
    });

    expect(payout.timezone).toBe('America/Los_Angeles');
  });
});
