'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui';
import { addDays, addMinutes } from 'date-fns';
import { signIn } from 'next-auth/react';
import {
  TimeSlot,
  convertTimeSlotTimezone,
  convertTimeSlotsTimezone,
  createTimeSlotFromDates,
  toUtcDateRange,
  formatDateInTimezone,
  startOfWeekInTimezone,
  resolveTimezone,
  mergeSlots,
} from '@/lib/shared/time-slot';

interface AvailabilityCalendarProps {
  weeks?: number;
  onConfirm?: (slots: TimeSlot[]) => void;
  /**
   * edit – candidate selecting their availability
   * select – professional choosing one of the candidate's slots
   */
  mode?: 'edit' | 'select';
  /** preset slots for select mode */
  slots?: TimeSlot[];
  /** text for the confirm button in select mode */
  confirmText?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  weeks = 2,
  onConfirm,
  mode = 'edit',
  slots = [],
  confirmText = 'Confirm Booking',
}) => {
  const isEdit = mode === 'edit';
  const [timezone, setTimezone] = useState<string>(() => resolveTimezone(null));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [recurringBusyRanges, setRecurringBusyRanges] = useState<{
    day: number;
    start: string;
    end: string;
  }[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekInTimezone(new Date(), resolveTimezone(null)),
  );
  const [isDragging, setIsDragging] = useState(false);
  const draggedSlots = useRef<Set<number>>(new Set());
  const lastSlot = useRef<number | null>(null);
  const [selected, setSelected] = useState<TimeSlot | null>(null);

  const formatInTimezone = (date: Date, pattern: string) =>
    formatDateInTimezone(date, timezone, pattern);

  // Update week start when timezone changes
  useEffect(() => {
    try {
      setWeekStart(startOfWeekInTimezone(new Date(), timezone));
    } catch {
      setWeekStart(startOfWeekInTimezone(new Date(), resolveTimezone(null)));
    }
  }, [timezone]);

  // Convert all slots to new timezone when timezone changes
  useEffect(() => {
    setAvailableSlots((prev) => convertTimeSlotsTimezone(prev, timezone));
    setSelected((prev) => (prev ? convertTimeSlotTimezone(prev, timezone) : null));
  }, [timezone]);

  // Load settings (timezone + recurring busy ranges) for edit mode
  useEffect(() => {
    if (!isEdit) return;

    async function loadSettings() {
      try {
        const res = await fetch('/api/candidate/settings');
        if (res.ok) {
          const data = await res.json();
          const ranges = Array.isArray(data.defaultBusy) ? data.defaultBusy : [];
          setRecurringBusyRanges(ranges);

          if (typeof data.timezone === 'string') {
            setTimezone(resolveTimezone(data.timezone));
          }
        }
      } catch {
        setRecurringBusyRanges([]);
      }
    }
    loadSettings();
  }, [isEdit]);

  // Load professional's timezone for select mode
  useEffect(() => {
    if (isEdit) return;

    async function loadProfessionalTimezone() {
      try {
        const res = await fetch('/api/professional/settings');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.timezone === 'string') {
            setTimezone(resolveTimezone(data.timezone));
          }
        }
      } catch {
        // ignore load errors
      }
    }
    loadProfessionalTimezone();
  }, [isEdit]);

  // Load saved availability for edit mode (localStorage → API fallback)
  useEffect(() => {
    if (!isEdit) return;

    const loadAvailability = async () => {
      // Try localStorage first
      const saved = typeof window !== 'undefined' ? localStorage.getItem('candidateAvailability') : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const normalized = parsed
              .filter(slot => typeof slot?.start === 'string' && typeof slot?.end === 'string')
              .map((slot: any) => {
                const tz = typeof slot?.timezone === 'string' ? slot.timezone : timezone;
                return { start: slot.start, end: slot.end, timezone: tz } as TimeSlot;
              });
            setAvailableSlots(convertTimeSlotsTimezone(normalized, timezone));
            return;
          }
        } catch {
          localStorage.removeItem('candidateAvailability');
        }
      }

      // Fallback to API
      try {
        const res = await fetch('/api/candidate/availability');
        if (res.ok) {
          const data = await res.json();
          const eventsData: TimeSlot[] = Array.isArray(data.events) ? data.events : [];
          setAvailableSlots(convertTimeSlotsTimezone(eventsData, timezone));
        }
      } catch {
        // ignore load errors
      }
    };
    loadAvailability();
  }, [isEdit, timezone]);

  // Save to localStorage when availableSlots change (edit mode only)
  useEffect(() => {
    if (!isEdit) return;
    if (typeof window === 'undefined') return;
    localStorage.setItem('candidateAvailability', JSON.stringify(availableSlots));
  }, [availableSlots, isEdit]);

  // Load preset slots for select mode
  useEffect(() => {
    if (isEdit) return;
    setAvailableSlots(convertTimeSlotsTimezone(slots, timezone));
  }, [slots, isEdit, timezone]);

  // Cleanup drag state on mouse up
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      draggedSlots.current.clear();
      lastSlot.current = null;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Generate days and time rows
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const rows = useMemo(() => Array.from({ length: 48 }, (_, i) => i), []);

  // Build set of available slot keys for fast lookup
  const availableKeys = useMemo(
    () => new Set(availableSlots.map(slot => toUtcDateRange(slot).start.getTime())),
    [availableSlots],
  );

  // Build set of recurring busy slot keys (for pre-populating available slots)
  const recurringBusyKeys = useMemo(() => {
    const keys = new Set<number>();
    for (let w = 0; w < weeks; w++) {
      recurringBusyRanges.forEach(r => {
        const dayStartUtc = addDays(weekStart, r.day + w * 7);
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        for (let minute = startMinutes; minute < endMinutes; minute += 30) {
          const slotStartUtc = addMinutes(dayStartUtc, minute);
          keys.add(slotStartUtc.getTime());
        }
      });
    }
    return keys;
  }, [weekStart, weeks, recurringBusyRanges]);

  const selectedKey = useMemo(() => (selected ? toUtcDateRange(selected).start.getTime() : null), [selected]);

  const isAvailableSlot = (dateUtc: Date) => availableKeys.has(dateUtc.getTime());
  const isRecurringBusy = (dateUtc: Date) => recurringBusyKeys.has(dateUtc.getTime());

  // Sync with Google Calendar (manual only, not on mount)
  const handleSync = async () => {
    if (!isEdit) return;

    const res = await fetch('/api/candidate/busy');
    if (res.status === 401) {
      alert('Please connect your Google Calendar to sync availability.');
      await signIn('google', { callbackUrl: window.location.href });
      return;
    }
    if (!res.ok) return;

    try {
      const data = await res.json();
      const busyData: TimeSlot[] = Array.isArray(data.busy) ? data.busy : [];

      // Convert busy slots to UTC keys
      const busyKeys = new Set(
        convertTimeSlotsTimezone(busyData, timezone).map(
          slot => toUtcDateRange(slot).start.getTime()
        )
      );

      // Remove any available slots that conflict with Google Calendar busy times
      setAvailableSlots(prev =>
        prev.filter(slot => !busyKeys.has(toUtcDateRange(slot).start.getTime()))
      );
    } catch {
      // ignore sync errors
    }
  };

  const toggleSlot = (dateUtc: Date) => {
    if (!isEdit) return;

    const slotStart = dateUtc;
    const slotEnd = addMinutes(slotStart, 30);
    const slotKey = slotStart.getTime();
    const newSlot = createTimeSlotFromDates(slotStart, slotEnd, timezone);
    const isAvailable = availableKeys.has(slotKey);

    flushSync(() => {
      if (isAvailable) {
        // Remove from available
        setAvailableSlots(prev => prev.filter(s => toUtcDateRange(s).start.getTime() !== slotKey));
      } else {
        // Add to available (overrides recurring busy if needed)
        setAvailableSlots(prev => [...prev, newSlot]);
      }
    });
  };

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

  const handleConfirm = async () => {
    if (isEdit) {
      const endLimit = addDays(new Date(), weeks * 7);

      // Deduplicate and filter to current view range
      const uniqueAvailable = new Map<number, TimeSlot>();
      availableSlots.forEach(slot => {
        const key = toUtcDateRange(slot).start.getTime();
        if (!uniqueAvailable.has(key)) {
          uniqueAvailable.set(key, slot);
        }
      });

      const availableWithinRange = Array.from(uniqueAvailable.values()).filter(
        slot => toUtcDateRange(slot).start < endLimit,
      );

      // Merge consecutive 30-min slots into longer blocks
      const mergedAvailable = mergeSlots(availableWithinRange);

      if (onConfirm) {
        await onConfirm(mergedAvailable);
      } else {
        await fetch('/api/candidate/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: mergedAvailable }),
        });
      }
    } else if (onConfirm && selected) {
      await onConfirm([selected]);
    }
  };

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 8 }}>
        <Button onClick={prevWeek}>{'<'}</Button>
        <Button onClick={nextWeek}>{'>'}</Button>
        {isEdit && <Button onClick={handleSync}>Sync Google Calendar</Button>}
        {isEdit && <Button onClick={handleConfirm}>Confirm Availability</Button>}
      </div>
      <div
        className="calendar-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '60px repeat(7, 1fr)',
          gridTemplateRows: '30px repeat(48, 20px)',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          userSelect: 'none'
        }}
      >
        <div style={{ borderBottom: '1px solid var(--border)' }} />
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              borderLeft: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              padding: '4px',
              background: 'var(--muted)',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {formatInTimezone(d, 'EEE MMM d')}
          </div>
        ))}

        {rows.map(row => (
          <React.Fragment key={row}>
            <div
              style={{
                borderTop: '1px solid var(--border)',
                padding: '2px',
                fontSize: 12,
                textAlign: 'right',
                paddingRight: 4,
              }}
            >
              {row % 2 === 0 ? formatInTimezone(addMinutes(weekStart, row * 30), 'h a') : ''}
            </div>
            {days.map((day, col) => {
              const slotStartUtc = addMinutes(day, row * 30);
              const slotEndUtc = addMinutes(slotStartUtc, 30);
              const key = slotStartUtc.getTime();
              const available = isAvailableSlot(slotStartUtc);
              const isSelected = selectedKey === key;

              return (
                <div
                  key={`${col}-${row}`}
                  onMouseDown={() => {
                    if (isEdit) {
                      toggleSlot(slotStartUtc);
                      setIsDragging(true);
                      draggedSlots.current = new Set([key]);
                      lastSlot.current = key;
                    } else if (!isEdit && available) {
                      setSelected(createTimeSlotFromDates(slotStartUtc, slotEndUtc, timezone));
                    }
                  }}
                  onMouseEnter={() => {
                    if (isEdit && isDragging) {
                      const current = key;
                      const previous = lastSlot.current;
                      if (previous !== null) {
                        const step = 30 * 60 * 1000;
                        const diff = current - previous;
                        const dir = diff > 0 ? step : -step;
                        for (let t = previous + dir; dir > 0 ? t <= current : t >= current; t += dir) {
                          if (!draggedSlots.current.has(t)) {
                            const targetDate = new Date(t);
                            toggleSlot(targetDate);
                            draggedSlots.current.add(t);
                          }
                        }
                      } else if (!draggedSlots.current.has(current)) {
                        toggleSlot(slotStartUtc);
                        draggedSlots.current.add(current);
                      }
                      lastSlot.current = current;
                    }
                  }}
                  style={{
                    borderTop: '1px solid var(--border)',
                    borderLeft: '1px solid var(--border)',
                    background: isEdit
                      ? available
                        ? '#4ade80'  // Green: available
                        : 'transparent'  // Blank: not available
                      : isSelected
                      ? '#22c55e'  // Dark green: selected
                      : available
                      ? '#bbf7d0'  // Light green: selectable
                      : 'transparent',  // Blank: not available
                    cursor: isEdit
                      ? 'pointer'
                      : available
                      ? 'pointer'
                      : 'default',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {!isEdit && onConfirm && (
        <Button onClick={handleConfirm} disabled={!selected}>
          {confirmText}
        </Button>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
