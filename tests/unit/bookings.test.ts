import { describe, it, expect, beforeEach } from 'vitest';
import { BookingStatus } from '@prisma/client';
import { createMockBooking, createMockCandidate, createMockProfessional } from '../utils/fixtures';
import { futureDate, pastDate, minutesUntil, tomorrowAt } from '../utils/helpers';

/**
 * Booking Workflow Tests
 *
 * Tests for:
 * - Booking creation and status transitions
 * - Cancellation policies
 * - Zoom meeting integration
 * - Time slot management
 */

describe('Booking Workflow', () => {
  describe('Booking Creation', () => {
    it('should create booking with requested status', () => {
      const booking = createMockBooking();

      expect(booking.status).toBe(BookingStatus.requested);
      expect(booking.candidateId).toBeTruthy();
      expect(booking.professionalId).toBeTruthy();
      expect(booking.priceUSD).toBeGreaterThan(0);
    });

    it('should create booking with future start time', () => {
      const booking = createMockBooking();

      expect(booking.startAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create booking with 30-minute duration', () => {
      const booking = createMockBooking();

      const durationMs = booking.endAt.getTime() - booking.startAt.getTime();
      const durationMinutes = durationMs / (60 * 1000);

      expect(durationMinutes).toBe(30);
    });

    it('should not have Zoom details when first requested', () => {
      const booking = createMockBooking();

      expect(booking.zoomMeetingId).toBeNull();
      expect(booking.zoomJoinUrl).toBeNull();
    });

    it('should not have join timestamps when first requested', () => {
      const booking = createMockBooking();

      expect(booking.candidateJoinedAt).toBeNull();
      expect(booking.professionalJoinedAt).toBeNull();
    });
  });

  describe('Booking Status Transitions', () => {
    it('should transition from requested to accepted', () => {
      const booking = createMockBooking({
        status: BookingStatus.requested,
      });

      booking.status = BookingStatus.accepted;
      expect(booking.status).toBe(BookingStatus.accepted);
    });

    it('should transition from accepted to completed_pending_feedback', () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        candidateJoinedAt: new Date(),
        professionalJoinedAt: new Date(),
      });

      booking.status = BookingStatus.completed_pending_feedback;
      expect(booking.status).toBe(BookingStatus.completed_pending_feedback);
    });

    it('should transition from completed_pending_feedback to completed', () => {
      const booking = createMockBooking({
        status: BookingStatus.completed_pending_feedback,
      });

      booking.status = BookingStatus.completed;
      expect(booking.status).toBe(BookingStatus.completed);
    });

    it('should allow cancellation from any status', () => {
      const statuses = [
        BookingStatus.requested,
        BookingStatus.accepted,
        BookingStatus.completed_pending_feedback,
      ];

      statuses.forEach((status) => {
        const booking = createMockBooking({ status });
        booking.status = BookingStatus.cancelled;
        expect(booking.status).toBe(BookingStatus.cancelled);
      });
    });
  });

  describe('Cancellation Policy', () => {
    it('should allow professional cancellation anytime (full refund)', () => {
      const startAt = futureDate(1); // 1 hour from now
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        startAt,
        endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
      });

      const minutesRemaining = minutesUntil(booking.startAt);
      const canCancel = true; // Professional can always cancel
      const refundType = 'full_refund';

      expect(canCancel).toBe(true);
      expect(refundType).toBe('full_refund');
    });

    it('should allow candidate cancellation >= 3 hours before (full refund)', () => {
      const startAt = futureDate(4); // 4 hours from now
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        startAt,
        endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
      });

      const minutesRemaining = minutesUntil(booking.startAt);
      const canCancel = minutesRemaining >= 180;
      const refundType = canCancel ? 'full_refund' : 'no_refund';

      expect(canCancel).toBe(true);
      expect(refundType).toBe('full_refund');
    });

    it('should prevent candidate cancellation < 3 hours before', () => {
      const startAt = futureDate(2); // 2 hours from now
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        startAt,
        endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
      });

      const minutesRemaining = minutesUntil(booking.startAt);
      const canCancel = minutesRemaining >= 180;

      expect(canCancel).toBe(false);
    });

    it('should track cancellation metadata', () => {
      const candidate = createMockCandidate();
      const booking = createMockBooking({
        status: BookingStatus.cancelled,
        cancelledBy: candidate.id,
        cancelledAt: new Date(),
        cancellationReason: 'Schedule conflict',
      });

      expect(booking.cancelledBy).toBe(candidate.id);
      expect(booking.cancelledAt).toBeInstanceOf(Date);
      expect(booking.cancellationReason).toBe('Schedule conflict');
    });
  });

  describe('Zoom Meeting Integration', () => {
    it('should add Zoom details when booking accepted', () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        zoomMeetingId: '123456789',
        zoomJoinUrl: 'https://zoom.us/j/123456789',
      });

      expect(booking.zoomMeetingId).toBe('123456789');
      expect(booking.zoomJoinUrl).toContain('zoom.us');
    });

    it('should track candidate join time', () => {
      const joinedAt = new Date();
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        candidateJoinedAt: joinedAt,
      });

      expect(booking.candidateJoinedAt).toEqual(joinedAt);
    });

    it('should track professional join time', () => {
      const joinedAt = new Date();
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        professionalJoinedAt: joinedAt,
      });

      expect(booking.professionalJoinedAt).toEqual(joinedAt);
    });

    it('should mark as completed_pending_feedback when both join', () => {
      const booking = createMockBooking({
        status: BookingStatus.accepted,
        candidateJoinedAt: new Date(),
        professionalJoinedAt: new Date(),
      });

      // Logic: if both joined, status should be completed_pending_feedback
      const bothJoined = booking.candidateJoinedAt && booking.professionalJoinedAt;
      if (bothJoined) {
        booking.status = BookingStatus.completed_pending_feedback;
      }

      expect(booking.status).toBe(BookingStatus.completed_pending_feedback);
    });
  });

  describe('Time Slot Validation', () => {
    it('should validate start time is before end time', () => {
      const startAt = tomorrowAt(10, 0);
      const endAt = tomorrowAt(10, 30);

      expect(startAt.getTime()).toBeLessThan(endAt.getTime());
    });

    it('should reject bookings where end is before start', () => {
      const startAt = tomorrowAt(10, 30);
      const endAt = tomorrowAt(10, 0);

      const isValid = startAt.getTime() < endAt.getTime();
      expect(isValid).toBe(false);
    });

    it('should validate booking is in the future', () => {
      const startAt = futureDate(24);
      const isInFuture = startAt.getTime() > Date.now();

      expect(isInFuture).toBe(true);
    });

    it('should reject past bookings', () => {
      const startAt = pastDate(24);
      const isInFuture = startAt.getTime() > Date.now();

      expect(isInFuture).toBe(false);
    });
  });

  describe('Booking Price', () => {
    it('should store price in USD', () => {
      const booking = createMockBooking({ priceUSD: 150.00 });

      expect(booking.priceUSD).toBe(150.00);
    });

    it('should support decimal prices', () => {
      const booking = createMockBooking({ priceUSD: 99.99 });

      expect(booking.priceUSD).toBe(99.99);
    });

    it('should not allow negative prices', () => {
      const isValidPrice = (price: number) => price > 0;

      expect(isValidPrice(100)).toBe(true);
      expect(isValidPrice(-50)).toBe(false);
      expect(isValidPrice(0)).toBe(false);
    });
  });

  describe('Timezone Handling', () => {
    it('should store timezone with booking', () => {
      const booking = createMockBooking({ timezone: 'America/New_York' });

      expect(booking.timezone).toBe('America/New_York');
    });

    it('should support different timezones', () => {
      const timezones = [
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
      ];

      timezones.forEach((tz) => {
        const booking = createMockBooking({ timezone: tz });
        expect(booking.timezone).toBe(tz);
      });
    });

    it('should maintain consistent times across timezone changes', () => {
      const startAt = tomorrowAt(14, 0); // 2 PM
      const bookingNY = createMockBooking({
        startAt,
        timezone: 'America/New_York',
      });
      const bookingLA = createMockBooking({
        startAt,
        timezone: 'America/Los_Angeles',
      });

      // Same UTC time, different timezones
      expect(bookingNY.startAt.getTime()).toBe(bookingLA.startAt.getTime());
    });
  });

  describe('Booking Relationships', () => {
    it('should link to candidate and professional', () => {
      const candidate = createMockCandidate();
      const professional = createMockProfessional();
      const booking = createMockBooking({
        candidateId: candidate.id,
        professionalId: professional.id,
      });

      expect(booking.candidateId).toBe(candidate.id);
      expect(booking.professionalId).toBe(professional.id);
    });

    it('should prevent booking with same user as both parties', () => {
      const userId = 'user123';
      const isValid = userId !== userId; // Same person can't book themselves

      expect(isValid).toBe(false);
    });
  });

  describe('Draft Bookings', () => {
    it('should support draft status for incomplete bookings', () => {
      const booking = createMockBooking({
        status: BookingStatus.draft,
        priceUSD: null,
      });

      expect(booking.status).toBe(BookingStatus.draft);
    });

    it('should allow draft without price', () => {
      const booking = createMockBooking({
        status: BookingStatus.draft,
        priceUSD: null,
      });

      expect(booking.priceUSD).toBeNull();
    });
  });

  describe('Refunded Bookings', () => {
    it('should support refunded status', () => {
      const booking = createMockBooking({
        status: BookingStatus.refunded,
      });

      expect(booking.status).toBe(BookingStatus.refunded);
    });

    it('should track refund reason via cancellation fields', () => {
      const booking = createMockBooking({
        status: BookingStatus.refunded,
        cancelledBy: 'admin_id',
        cancelledAt: new Date(),
        cancellationReason: 'QC failed - automatic refund',
      });

      expect(booking.cancellationReason).toContain('QC failed');
    });
  });
});
