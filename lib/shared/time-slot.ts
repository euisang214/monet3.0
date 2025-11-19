import { startOfWeek } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { timezones } from '@/lib/utils/timezones';

export type DateTime = string;

export type TimeSlot = {
  start: DateTime;
  end: DateTime;
  timezone: string;
};

const ISO_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

const DEFAULT_TIMEZONE = (() => {
  const fallback = process.env.DEFAULT_TIMEZONE || 'America/New_York';
  try {
    return ensureTimezone(fallback);
  } catch {
    return ensureTimezone('America/New_York');
  }
})();

export function ensureTimezone(timezone: string): string {
  if (!timezones.includes(timezone)) {
    throw new Error(`Unsupported timezone: ${timezone}`);
  }
  return timezone;
}

export function getDefaultTimezone(): string {
  return DEFAULT_TIMEZONE;
}

export function resolveTimezone(timezone?: string | null): string {
  if (timezone) {
    try {
      return ensureTimezone(timezone);
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_TIMEZONE;
}

export function convertTimeSlotTimezone(slot: TimeSlot, targetTimezone: string): TimeSlot {
  const timezone = ensureTimezone(targetTimezone);
  ensureTimezone(slot.timezone);
  const { start, end } = toUtcDateRange(slot);
  return {
    start: formatInTimeZone(start, timezone, ISO_LOCAL_FORMAT),
    end: formatInTimeZone(end, timezone, ISO_LOCAL_FORMAT),
    timezone,
  };
}

export function convertTimeSlotsTimezone(slots: TimeSlot[], targetTimezone: string): TimeSlot[] {
  return slots.map((slot) => convertTimeSlotTimezone(slot, targetTimezone));
}

export function createTimeSlotFromDates(start: Date, end: Date, timezone: string): TimeSlot {
  const tz = ensureTimezone(timezone);
  return {
    start: formatInTimeZone(start, tz, ISO_LOCAL_FORMAT),
    end: formatInTimeZone(end, tz, ISO_LOCAL_FORMAT),
    timezone: tz,
  };
}

export function toUtcDateRange(slot: TimeSlot): { start: Date; end: Date } {
  const tz = ensureTimezone(slot.timezone);
  return {
    start: fromZonedTime(slot.start, tz),
    end: fromZonedTime(slot.end, tz),
  };
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
      timezone: ensureTimezone(timezoneInput),
    } satisfies TimeSlot;
  });
}

export function formatDateInTimezone(date: Date, timezone: string, pattern: string): string {
  const tz = ensureTimezone(timezone);
  return formatInTimeZone(date, tz, pattern);
}

export function startOfWeekInTimezone(date: Date, timezone: string, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0): Date {
  const tz = ensureTimezone(timezone);
  const zonedDate = toZonedTime(date, tz);
  const start = startOfWeek(zonedDate, { weekStartsOn });
  const formatted = formatInTimeZone(start, tz, ISO_LOCAL_FORMAT);
  return fromZonedTime(formatted, tz);
}

export function mergeSlots(slots: TimeSlot[]): TimeSlot[] {
  if (!slots.length) return [];
  const grouped = new Map<string, TimeSlot[]>();
  slots.forEach((slot) => {
    const timezone = ensureTimezone(slot.timezone);
    const list = grouped.get(timezone) ?? [];
    list.push({ ...slot, timezone });
    grouped.set(timezone, list);
  });

  const merged: TimeSlot[] = [];
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

export function splitIntoSlots(ranges: TimeSlot[], minutes = 30): TimeSlot[] {
  const result: TimeSlot[] = [];
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

export { ISO_LOCAL_FORMAT };

