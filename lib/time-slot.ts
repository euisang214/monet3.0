import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { timezones } from './timezones';

export type DateTime = string;

export type TimeSlot = {
  start: DateTime;
  end: DateTime;
  timezone: string;
};

const ISO_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

export function ensureTimezone(timezone: string): string {
  if (!timezones.includes(timezone)) {
    throw new Error(`Unsupported timezone: ${timezone}`);
  }
  return timezone;
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

export function convertTimeSlotsTimezone(slots: TimeSlot[], targetTimezone: string): TimeSlot[] {
  return slots.map((slot) => convertTimeSlotTimezone(slot, targetTimezone));
}

export { ISO_LOCAL_FORMAT };
