'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from './ui';
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
} from '../../lib/availability';

type CalendarSlot = TimeSlot & { sourceTimezone?: string };

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
  const [events, setEvents] = useState<TimeSlot[]>([]);
  const [persistedBusySlots, setPersistedBusySlots] = useState<CalendarSlot[]>([]);
  const [defaultBusySlots, setDefaultBusySlots] = useState<CalendarSlot[]>([]);
  const [defaultBusyRanges, setDefaultBusyRanges] = useState<{
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

  useEffect(() => {
    try {
      setWeekStart(startOfWeekInTimezone(new Date(), timezone));
    } catch {
      setWeekStart(startOfWeekInTimezone(new Date(), resolveTimezone(null)));
    }
  }, [timezone]);

  useEffect(() => {
    setEvents((prev) => convertTimeSlotsTimezone(prev, timezone));
    setDefaultBusySlots((prev) =>
      prev.map((slot) => ({
        ...convertTimeSlotTimezone(slot, timezone),
        sourceTimezone: slot.sourceTimezone,
      })),
    );
    setPersistedBusySlots((prev) =>
      prev.map((slot) => ({
        ...convertTimeSlotTimezone(slot, timezone),
        sourceTimezone: slot.sourceTimezone,
      })),
    );
    setSelected((prev) => (prev ? convertTimeSlotTimezone(prev, timezone) : null));
  }, [timezone]);

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    async function loadDefaults() {
      try {
        const res = await fetch('/api/candidate/settings');
        if (res.ok) {
          const data = await res.json();
          const defaultRanges = Array.isArray(data.defaultBusy) ? data.defaultBusy : [];
          if (defaultRanges.length) {
            setDefaultBusyRanges(defaultRanges);
          } else {
            setDefaultBusyRanges([]);
          }
          if (typeof data.timezone === 'string') {
            setTimezone(resolveTimezone(data.timezone));
          }
        }
      } catch {
        setDefaultBusyRanges([]);
      }
    }
    loadDefaults();
  }, [isEdit]);

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

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
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
            setEvents(convertTimeSlotsTimezone(normalized, timezone));
            setPersistedBusySlots([]);
            return;
          }
        } catch {
          localStorage.removeItem('candidateAvailability');
        }
      }
      try {
        const res = await fetch('/api/candidate/availability');
        if (res.ok) {
          const data = await res.json();
          const eventsData: TimeSlot[] = Array.isArray(data.events) ? data.events : [];
          const busyData: TimeSlot[] = Array.isArray(data.busy) ? data.busy : [];
          setEvents(convertTimeSlotsTimezone(eventsData, timezone));
          setPersistedBusySlots(
            convertTimeSlotsTimezone(busyData, timezone).map((slot) => ({ ...slot })),
          );
        }
      } catch {
        // ignore load errors
      }
    };
    load();
  }, [isEdit, timezone]);

  useEffect(() => {
    if (!isEdit) return;
    if (typeof window === 'undefined') return;
    localStorage.setItem('candidateAvailability', JSON.stringify(events));
  }, [events, isEdit]);

  useEffect(() => {
    if (isEdit) {
      return;
    }
    setEvents(convertTimeSlotsTimezone(slots, timezone));
  }, [slots, isEdit, timezone]);

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
      const eventsData: TimeSlot[] = Array.isArray(data.events) ? data.events : [];
      const busyData: TimeSlot[] = Array.isArray(data.busy) ? data.busy : [];
      setEvents(convertTimeSlotsTimezone(eventsData, timezone));
      setPersistedBusySlots(
        convertTimeSlotsTimezone(busyData, timezone).map(slot => ({ ...slot })),
      );
    } catch {
      // ignore sync errors
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    handleSync();
  }, [isEdit, timezone]);

  useEffect(() => {
    if (!isEdit) return;
    const slots: CalendarSlot[] = [];
    for (let w = 0; w < weeks; w++) {
      defaultBusyRanges.forEach(r => {
        const dayStartUtc = addDays(weekStart, r.day + w * 7);
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        for (let minute = startMinutes; minute < endMinutes; minute += 30) {
          const slotStartUtc = addMinutes(dayStartUtc, minute);
          const slotEndUtc = addMinutes(slotStartUtc, 30);
          slots.push({ ...createTimeSlotFromDates(slotStartUtc, slotEndUtc, timezone) });
        }
      });
    }
    setDefaultBusySlots(slots);
  }, [weekStart, weeks, defaultBusyRanges, isEdit, timezone]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      draggedSlots.current.clear();
      lastSlot.current = null;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const rows = useMemo(() => Array.from({ length: 48 }, (_, i) => i), []);

  const manualKeys = useMemo(
    () => new Set(events.map(slot => toUtcDateRange(slot).start.getTime())),
    [events],
  );

  const defaultBusyKeys = useMemo(
    () => new Set(defaultBusySlots.map(slot => toUtcDateRange(slot).start.getTime())),
    [defaultBusySlots],
  );

  const persistedBusyKeys = useMemo(
    () =>
      new Set(
        persistedBusySlots.map((slot) => toUtcDateRange(slot).start.getTime()),
      ),
    [persistedBusySlots],
  );

  const selectedKey = useMemo(() => (selected ? toUtcDateRange(selected).start.getTime() : null), [selected]);

  const isDefaultBusySlot = (date: Date) => defaultBusyKeys.has(date.getTime());
  const isPersistedBusySlot = (date: Date) => persistedBusyKeys.has(date.getTime());
  const isManualSlot = (date: Date) => manualKeys.has(date.getTime());
  const isAvailableSlot = (date: Date) => isManualSlot(date);

  const toggleSlot = (dateUtc: Date) => {
    if (!isEdit) return;
    const slotStart = dateUtc;
    const slotEnd = addMinutes(slotStart, 30);
    const slotKey = slotStart.getTime();
    const newSlot = createTimeSlotFromDates(slotStart, slotEnd, timezone);
    const manual = isManualSlot(slotStart);
    const isDefaultBusy = isDefaultBusySlot(slotStart);
    const isPersistedBusy = isPersistedBusySlot(slotStart);

    flushSync(() => {
      if (isPersistedBusy && !manual) {
        return;
      }
      if (isDefaultBusy && !manual) {
        setEvents(prev => [...prev, newSlot]);
        return;
      }

      if (manual) {
        setEvents(prev => prev.filter(s => toUtcDateRange(s).start.getTime() !== slotKey));
      } else {
        setEvents(prev => [...prev, newSlot]);
      }
    });
  };

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

  const normalizeForSubmit = (slot: CalendarSlot): TimeSlot => {
    if (slot.sourceTimezone) {
      return convertTimeSlotTimezone(slot, slot.sourceTimezone);
    }
    const { start, end, timezone: tz } = slot;
    return { start, end, timezone: tz };
  };

  const handleConfirm = async () => {
    if (isEdit) {
      const endLimit = addDays(new Date(), weeks * 7);
      const allAvailable: CalendarSlot[] = events.map(slot => ({ ...slot }));

      const uniqueAvailable = new Map<number, CalendarSlot>();
      allAvailable.forEach(slot => {
        const key = toUtcDateRange(slot).start.getTime();
        if (!uniqueAvailable.has(key)) {
          uniqueAvailable.set(key, slot);
        }
      });

      const availableWithinRange = Array.from(uniqueAvailable.values()).filter(
        slot => toUtcDateRange(slot).start < endLimit,
      );
      const availableKeys = new Set(
        availableWithinRange.map(slot => toUtcDateRange(slot).start.getTime()),
      );
      const availablePayload = availableWithinRange.map(normalizeForSubmit);
      const mergedAvailablePayload = mergeSlots(availablePayload);

      const uniqueBusy = new Map<number, CalendarSlot>();
      defaultBusySlots.forEach(slot => {
        const key = toUtcDateRange(slot).start.getTime();
        if (!uniqueBusy.has(key)) {
          uniqueBusy.set(key, slot);
        }
      });

      const busyPayload = Array.from(uniqueBusy.values())
        .filter(slot => {
          const start = toUtcDateRange(slot).start;
          return start < endLimit && !availableKeys.has(start.getTime());
        })
        .map(normalizeForSubmit);
      const mergedBusyPayload = mergeSlots(busyPayload);

      if (onConfirm) {
        await onConfirm(mergedAvailablePayload);
      } else {
        await fetch('/api/candidate/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: mergedAvailablePayload, busy: mergedBusyPayload }),
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
              const manual = isManualSlot(slotStartUtc);
              const persistedBusy = isPersistedBusySlot(slotStartUtc);
              const defaultBusy = isDefaultBusySlot(slotStartUtc);
              const available = manual;
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
                      ? manual
                        ? '#4ade80'
                        : persistedBusy || defaultBusy
                        ? '#fecaca'
                        : 'transparent'
                      : isSelected
                      ? '#22c55e'
                      : available
                      ? '#bbf7d0'
                      : persistedBusy || defaultBusy
                      ? '#fecaca'
                      : 'transparent',
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
