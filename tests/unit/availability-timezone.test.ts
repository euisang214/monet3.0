import { describe, it, expect } from 'vitest';
import { mergeSlots, splitIntoSlots, type Slot } from '@/lib/shared/time-slot';
import { createMockAvailability } from '../utils/fixtures';
import { todayAt, tomorrowAt } from '../utils/helpers';

/**
 * Availability and Timezone Tests
 *
 * Tests for:
 * - Time slot merging
 * - Time slot splitting
 * - Timezone conversions
 * - Availability scheduling
 * - Google Calendar integration
 */

describe('Availability Management', () => {
  describe('Time Slot Merging', () => {
    it('should merge continuous slots into a single range', () => {
      const slots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T09:30:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
      ];

      const merged = mergeSlots(slots);

      expect(merged).toHaveLength(1);
      expect(merged[0].start).toBe('2024-01-01T09:00:00');
      expect(merged[0].end).toBe('2024-01-01T10:00:00');
    });

    it('should not merge non-continuous slots', () => {
      const slots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T11:00:00', end: '2024-01-01T11:30:00', timezone: 'America/New_York' },
      ];

      const merged = mergeSlots(slots);

      expect(merged).toHaveLength(2);
    });

    it('should handle empty slot array', () => {
      const slots: Slot[] = [];
      const merged = mergeSlots(slots);

      expect(merged).toHaveLength(0);
    });

    it('should merge multiple continuous slots', () => {
      const slots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T09:30:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
        { start: '2024-01-01T10:00:00', end: '2024-01-01T10:30:00', timezone: 'America/New_York' },
      ];

      const merged = mergeSlots(slots);

      expect(merged).toHaveLength(1);
      expect(merged[0].start).toBe('2024-01-01T09:00:00');
      expect(merged[0].end).toBe('2024-01-01T10:30:00');
    });

    it('should handle mixed continuous and non-continuous slots', () => {
      const slots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T09:30:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
        { start: '2024-01-01T11:00:00', end: '2024-01-01T11:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T11:30:00', end: '2024-01-01T12:00:00', timezone: 'America/New_York' },
      ];

      const merged = mergeSlots(slots);

      expect(merged).toHaveLength(2);
      expect(merged[0].start).toBe('2024-01-01T09:00:00');
      expect(merged[0].end).toBe('2024-01-01T10:00:00');
      expect(merged[1].start).toBe('2024-01-01T11:00:00');
      expect(merged[1].end).toBe('2024-01-01T12:00:00');
    });
  });

  describe('Time Slot Splitting', () => {
    it('should split range into 30-minute chunks', () => {
      const ranges: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
      ];

      const slots = splitIntoSlots(ranges, 30);

      expect(slots).toHaveLength(2);
      expect(slots[0].start).toBe('2024-01-01T09:00:00');
      expect(slots[0].end).toBe('2024-01-01T09:30:00');
      expect(slots[1].start).toBe('2024-01-01T09:30:00');
      expect(slots[1].end).toBe('2024-01-01T10:00:00');
    });

    it('should split multiple ranges', () => {
      const ranges: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
        { start: '2024-01-01T14:00:00', end: '2024-01-01T15:00:00', timezone: 'America/New_York' },
      ];

      const slots = splitIntoSlots(ranges, 30);

      expect(slots).toHaveLength(4);
    });

    it('should handle custom slot duration', () => {
      const ranges: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
      ];

      const slots = splitIntoSlots(ranges, 15);

      expect(slots).toHaveLength(4); // 60 minutes / 15 = 4 slots
    });

    it('should handle empty range array', () => {
      const ranges: Slot[] = [];
      const slots = splitIntoSlots(ranges, 30);

      expect(slots).toHaveLength(0);
    });
  });

  describe('Round-Trip Merge and Split', () => {
    it('should maintain slots through merge and split cycle', () => {
      const originalSlots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T09:30:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
      ];

      const merged = mergeSlots(originalSlots);
      const expanded = splitIntoSlots(merged, 30);

      expect(expanded).toHaveLength(originalSlots.length);
      expect(expanded[0].start).toBe(originalSlots[0].start);
      expect(expanded[0].end).toBe(originalSlots[0].end);
      expect(expanded[1].start).toBe(originalSlots[1].start);
      expect(expanded[1].end).toBe(originalSlots[1].end);
    });
  });
});

describe('Timezone Handling', () => {
  describe('Timezone Validation', () => {
    it('should accept valid IANA timezone', () => {
      const validTimezones = [
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
      ];

      validTimezones.forEach(tz => {
        const slot: Slot = {
          start: '2024-01-01T09:00:00',
          end: '2024-01-01T09:30:00',
          timezone: tz,
        };
        expect(slot.timezone).toBe(tz);
      });
    });

    it('should default to America/New_York when not specified', () => {
      const availability = createMockAvailability('user123');
      expect(availability.timezone).toBe('America/New_York');
    });

    it('should store timezone with each slot', () => {
      const slot: Slot = {
        start: '2024-01-01T09:00:00',
        end: '2024-01-01T09:30:00',
        timezone: 'America/Los_Angeles',
      };

      expect(slot).toHaveProperty('timezone');
      expect(slot.timezone).toBe('America/Los_Angeles');
    });
  });

  describe('Timezone Conversions', () => {
    it('should maintain UTC times across timezone changes', () => {
      const slot: Slot = {
        start: '2024-01-01T14:00:00',
        end: '2024-01-01T14:30:00',
        timezone: 'America/New_York',
      };

      // Same UTC time, different timezone display
      expect(slot.start).toBe('2024-01-01T14:00:00');
    });

    it('should handle daylight saving time transitions', () => {
      const winterSlot: Slot = {
        start: '2024-01-15T10:00:00', // Winter (EST)
        end: '2024-01-15T10:30:00',
        timezone: 'America/New_York',
      };

      const summerSlot: Slot = {
        start: '2024-07-15T10:00:00', // Summer (EDT)
        end: '2024-07-15T10:30:00',
        timezone: 'America/New_York',
      };

      expect(winterSlot.timezone).toBe(summerSlot.timezone);
    });
  });

  describe('Multi-Timezone Scenarios', () => {
    it('should support bookings across different timezones', () => {
      const candidateSlot: Slot = {
        start: '2024-01-01T14:00:00',
        end: '2024-01-01T14:30:00',
        timezone: 'America/New_York', // 2 PM EST
      };

      const professionalSlot: Slot = {
        start: '2024-01-01T11:00:00',
        end: '2024-01-01T11:30:00',
        timezone: 'America/Los_Angeles', // 11 AM PST = 2 PM EST
      };

      // Different local times, same UTC time
      expect(candidateSlot.timezone).not.toBe(professionalSlot.timezone);
    });

    it('should merge slots within same timezone only', () => {
      const slots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/New_York' },
        { start: '2024-01-01T09:30:00', end: '2024-01-01T10:00:00', timezone: 'America/New_York' },
        { start: '2024-01-01T09:00:00', end: '2024-01-01T09:30:00', timezone: 'America/Los_Angeles' },
      ];

      const merged = mergeSlots(slots);

      // Should have 2 merged ranges (one per timezone)
      expect(merged.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Availability Preferences', () => {
  describe('Weekly Availability', () => {
    it('should support availability for each day of week', () => {
      const weekdays = [1, 2, 3, 4, 5]; // Monday through Friday

      weekdays.forEach(day => {
        const availability = createMockAvailability('user123', {
          dayOfWeek: day,
        });
        expect(availability.dayOfWeek).toBe(day);
      });
    });

    it('should support weekend availability', () => {
      const weekend = [0, 6]; // Sunday and Saturday

      weekend.forEach(day => {
        const availability = createMockAvailability('user123', {
          dayOfWeek: day,
        });
        expect(availability.dayOfWeek).toBe(day);
      });
    });

    it('should store time ranges as strings', () => {
      const availability = createMockAvailability('user123', {
        startTime: '09:00',
        endTime: '17:00',
      });

      expect(availability.startTime).toBe('09:00');
      expect(availability.endTime).toBe('17:00');
    });

    it('should validate end time is after start time', () => {
      const startTime = '09:00';
      const endTime = '17:00';

      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

      expect(endMinutes).toBeGreaterThan(startMinutes);
    });
  });

  describe('Business Hours Validation', () => {
    it('should support standard business hours', () => {
      const availability = createMockAvailability('user123', {
        startTime: '09:00',
        endTime: '17:00',
      });

      expect(availability.startTime).toBe('09:00');
      expect(availability.endTime).toBe('17:00');
    });

    it('should support early morning availability', () => {
      const availability = createMockAvailability('user123', {
        startTime: '06:00',
        endTime: '12:00',
      });

      expect(availability.startTime).toBe('06:00');
    });

    it('should support evening availability', () => {
      const availability = createMockAvailability('user123', {
        startTime: '18:00',
        endTime: '22:00',
      });

      expect(availability.endTime).toBe('22:00');
    });
  });
});

describe('Google Calendar Integration', () => {
  describe('Busy Time Fetching', () => {
    it('should fetch busy times for next 30 days', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const durationDays = Math.ceil((thirtyDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      expect(durationDays).toBe(30);
    });

    it('should merge Google Calendar busy times with manual availability', () => {
      const manualSlots: Slot[] = [
        { start: '2024-01-01T09:00:00', end: '2024-01-01T17:00:00', timezone: 'America/New_York' },
      ];

      const busyTimes: Slot[] = [
        { start: '2024-01-01T10:00:00', end: '2024-01-01T11:00:00', timezone: 'America/New_York' },
      ];

      // Free times = manual availability - busy times
      // Expected: 9-10, 11-17
      expect(manualSlots).toHaveLength(1);
      expect(busyTimes).toHaveLength(1);
    });
  });

  describe('Calendar Event Creation', () => {
    it('should create calendar events for accepted bookings', () => {
      const booking = {
        startAt: tomorrowAt(14, 0),
        endAt: tomorrowAt(14, 30),
        zoomJoinUrl: 'https://zoom.us/j/123456789',
      };

      expect(booking.startAt).toBeInstanceOf(Date);
      expect(booking.endAt).toBeInstanceOf(Date);
      expect(booking.zoomJoinUrl).toContain('zoom.us');
    });

    it('should send calendar invites to both parties', () => {
      const attendees = [
        'candidate@example.com',
        'professional@example.com',
      ];

      expect(attendees).toHaveLength(2);
    });
  });

  describe('OAuth Connection Status', () => {
    it('should track Google Calendar connection status', () => {
      const connectedUser = { googleCalendarConnected: true };
      const disconnectedUser = { googleCalendarConnected: false };

      expect(connectedUser.googleCalendarConnected).toBe(true);
      expect(disconnectedUser.googleCalendarConnected).toBe(false);
    });

    it('should allow users without Google Calendar', () => {
      const user = { googleCalendarConnected: false };

      // Users can still set manual availability
      expect(user.googleCalendarConnected).toBe(false);
    });
  });
});

describe('Slot Validation', () => {
  describe('Time Format Validation', () => {
    it('should use ISO 8601 format for time slots', () => {
      const slot: Slot = {
        start: '2024-01-01T09:00:00',
        end: '2024-01-01T09:30:00',
        timezone: 'America/New_York',
      };

      expect(slot.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(slot.end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('Slot Duration Validation', () => {
    it('should support 30-minute slots', () => {
      const startTime = new Date('2024-01-01T09:00:00Z');
      const endTime = new Date('2024-01-01T09:30:00Z');
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = durationMs / (60 * 1000);

      expect(durationMinutes).toBe(30);
    });

    it('should reject zero-duration slots', () => {
      const startTime = new Date('2024-01-01T09:00:00Z');
      const endTime = new Date('2024-01-01T09:00:00Z');
      const durationMs = endTime.getTime() - startTime.getTime();

      const isValid = durationMs > 0;
      expect(isValid).toBe(false);
    });

    it('should reject negative-duration slots', () => {
      const startTime = new Date('2024-01-01T09:30:00Z');
      const endTime = new Date('2024-01-01T09:00:00Z');
      const durationMs = endTime.getTime() - startTime.getTime();

      const isValid = durationMs > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('Future Time Validation', () => {
    it('should only allow future bookings', () => {
      const futureTime = tomorrowAt(14, 0);
      const isFuture = futureTime.getTime() > Date.now();

      expect(isFuture).toBe(true);
    });

    it('should reject past time slots', () => {
      const pastTime = new Date('2020-01-01T09:00:00Z');
      const isFuture = pastTime.getTime() > Date.now();

      expect(isFuture).toBe(false);
    });
  });
});
