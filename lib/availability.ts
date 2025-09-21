import { startOfWeek } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
  DateTime,
  TimeSlot,
  createTimeSlotFromDates as createTimeSlotFromDatesInternal,
  ensureTimezone as ensureTimezoneInternal,
  toUtcDateRange as toUtcDateRangeInternal,
  convertTimeSlotTimezone as convertTimeSlotTimezoneInternal,
  convertTimeSlotsTimezone as convertTimeSlotsTimezoneInternal,
  ISO_LOCAL_FORMAT,
} from './time-slot';

export type Slot = TimeSlot;

const DEFAULT_TIMEZONE = (() => {
  const fallback = process.env.DEFAULT_TIMEZONE || 'America/New_York';
  try {
    return ensureTimezoneInternal(fallback);
  } catch {
    return ensureTimezoneInternal('America/New_York');
  }
})();

export function ensureTimezone(timezone: string): string {
  return ensureTimezoneInternal(timezone);
}

export function getDefaultTimezone(): string {
  return DEFAULT_TIMEZONE;
}

export function resolveTimezone(timezone?: string | null): string {
  if (timezone) {
    try {
      return ensureTimezoneInternal(timezone);
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_TIMEZONE;
}

export function convertTimeSlotTimezone(slot: TimeSlot, targetTimezone: string): TimeSlot {
  return convertTimeSlotTimezoneInternal(slot, targetTimezone);
}

export function convertTimeSlotsTimezone(slots: TimeSlot[], targetTimezone: string): TimeSlot[] {
  return convertTimeSlotsTimezoneInternal(slots, targetTimezone);
}

export function createTimeSlotFromDates(start: Date, end: Date, timezone: string): TimeSlot {
  return createTimeSlotFromDatesInternal(start, end, timezone);
}

export function toUtcDateRange(slot: TimeSlot): { start: Date; end: Date } {
  return toUtcDateRangeInternal(slot);
}

export function normalizeSlots(slots: any[], fallbackTimezone?: string): TimeSlot[] {
  const fallback = fallbackTimezone ? resolveTimezone(fallbackTimezone) : DEFAULT_TIMEZONE;
  return (Array.isArray(slots) ? slots : []).map((slot) => {
    if (typeof slot?.start !== 'string' || typeof slot?.end !== 'string') {
      throw new Error('invalid_slot');
    }
    const timezoneInput = typeof slot?.timezone === 'string' ? slot.timezone : fallback;
    return {
      start: slot.start,
      end: slot.end,
      timezone: ensureTimezoneInternal(timezoneInput),
    } satisfies TimeSlot;
  });
}

export function formatDateInTimezone(date: Date, timezone: string, pattern: string): string {
  const tz = ensureTimezoneInternal(timezone);
  return formatInTimeZone(date, tz, pattern);
}

export function startOfWeekInTimezone(date: Date, timezone: string, weekStartsOn = 0): Date {
  const tz = ensureTimezoneInternal(timezone);
  const zonedDate = toZonedTime(date, tz);
  const start = startOfWeek(zonedDate, { weekStartsOn });
  const formatted = formatInTimeZone(start, tz, ISO_LOCAL_FORMAT);
  return fromZonedTime(formatted, tz);
}

export function mergeSlots(slots: Slot[]): Slot[] {
  if (!slots.length) return [];
  const grouped = new Map<string, Slot[]>();
  slots.forEach((slot) => {
    const timezone = ensureTimezone(slot.timezone);
    const list = grouped.get(timezone) ?? [];
    list.push({ ...slot, timezone });
    grouped.set(timezone, list);
  });

  const merged: Slot[] = [];
  grouped.forEach((group, timezone) => {
    const sorted = group
      .map((s) => toUtcDateRange(s))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    if (!sorted.length) return;
    const mergedRanges: { start: Date; end: Date }[] = [];
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const slot = sorted[i];
      if (slot.start.getTime() === current.end.getTime()) {
        current = { start: current.start, end: slot.end };
      } else {
        mergedRanges.push(current);
        current = slot;
      }
    }
    mergedRanges.push(current);
    merged.push(...mergedRanges.map((range) => createTimeSlotFromDates(range.start, range.end, timezone)));
  });

  return merged;
}

export function splitIntoSlots(ranges: Slot[], minutes = 30): Slot[] {
  const result: Slot[] = [];
  ranges.forEach((range) => {
    const timezone = ensureTimezone(range.timezone);
    const { start, end } = toUtcDateRange(range);
    for (let ts = start.getTime(); ts < end.getTime(); ts += minutes * 60 * 1000) {
      const slotStart = new Date(ts);
      const slotEnd = new Date(ts + minutes * 60 * 1000);
      result.push(createTimeSlotFromDates(slotStart, slotEnd, timezone));
    }
  });
  return result;
}

export { DateTime, TimeSlot, ISO_LOCAL_FORMAT };
