'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from './ui';
import { addDays, addMinutes } from 'date-fns';
import { signIn } from 'next-auth/react';
import {
  TimeSlot,
  splitIntoSlots,
  convertTimeSlotTimezone,
  convertTimeSlotsTimezone,
  createTimeSlotFromDates,
  toUtcDateRange,
  formatDateInTimezone,
  startOfWeekInTimezone,
  resolveTimezone,
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
  const [busyEvents, setBusyEvents] = useState<CalendarSlot[]>([]);
  const [defaultBusy, setDefaultBusy] = useState<CalendarSlot[]>([]);
  const [defaultBusyRanges, setDefaultBusyRanges] = useState<{ day: number; start: string; end: string }[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekInTimezone(new Date(), resolveTimezone(null)),
  );
  const [isDragging, setIsDragging] = useState(false);
  const draggedSlots = useRef<Set<number>>(new Set());
  const lastSlot = useRef<number | null>(null);
  const [selected, setSelected] = useState<TimeSlot | null>(null);

  const formatInTimezone = (date: Date, pattern: string) =>
    formatDateInTimezone(date, timezone, pattern);

    try {
      setWeekStart(startOfWeekInTimezone(new Date(), timezone));
    } catch {
      setWeekStart(startOfWeekInTimezone(new Date(), resolveTimezone(null)));
    }
  }, [timezone]);

  useEffect(() => {
    setEvents((prev) => convertTimeSlotsTimezone(prev, timezone));
    setBusyEvents((prev) =>
      prev.map((slot) => ({
        ...convertTimeSlotTimezone(slot, timezone),
        sourceTimezone: slot.sourceTimezone,
      })),
    );
    setDefaultBusy((prev) =>
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
          if (Array.isArray(data.defaultBusy)) {
            setDefaultBusyRanges(data.defaultBusy);
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
          setBusyEvents(
            convertTimeSlotsTimezone(busyData, timezone).map(slot => ({ ...slot })),
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
      const busySlots: TimeSlot[] = Array.isArray(data.busy) ? data.busy : [];
      const converted = busySlots.flatMap(slot => {
        try {
          const displaySlot = convertTimeSlotTimezone(slot, timezone);
          return splitIntoSlots([displaySlot]).map(s => ({ ...s, sourceTimezone: slot.timezone }));
        } catch {
          return [];
        }
      });
      setBusyEvents(prev => {
        const manual = prev.filter(s => !s.sourceTimezone);
        return [...manual, ...converted];
      });
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
    setDefaultBusy(slots);
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

  const busyKeys = useMemo(() => {
    if (!isEdit) return new Set<number>();
    return new Set([...busyEvents, ...defaultBusy].map(slot => toUtcDateRange(slot).start.getTime()));
  }, [busyEvents, defaultBusy, isEdit]);

  const availableKeys = useMemo(
    () => new Set(events.map(slot => toUtcDateRange(slot).start.getTime())),
    [events]
  );

  const selectedKey = useMemo(() => (selected ? toUtcDateRange(selected).start.getTime() : null), [selected]);

  const isBusySlot = (date: Date) => isEdit && busyKeys.has(date.getTime());
  const isAvailableSlot = (date: Date) => availableKeys.has(date.getTime());

  const toggleSlot = (dateUtc: Date) => {
    if (!isEdit) return;
    const slotStart = dateUtc;
    const slotEnd = addMinutes(slotStart, 30);
    const slotKey = slotStart.getTime();
    const newSlot = createTimeSlotFromDates(slotStart, slotEnd, timezone);
    const available = isAvailableSlot(slotStart);

    flushSync(() => {
      if (isBusySlot(slotStart)) {
        setBusyEvents(prev => prev.filter(s => toUtcDateRange(s).start.getTime() !== slotKey));
      }

      if (available) {
        setEvents(prev => prev.filter(s => toUtcDateRange(s).start.getTime() !== slotKey));
      } else {
        setEvents(prev => [...prev, newSlot]);
      }
    });
  };

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

  const normalizeForSubmit = (slotsToSubmit: CalendarSlot[]): TimeSlot[] =>
    slotsToSubmit.map(slot => {
      if (slot.sourceTimezone) {
        return convertTimeSlotTimezone(slot, slot.sourceTimezone);
      }
      const { start, end, timezone: tz } = slot;
      return { start, end, timezone: tz };
    });

  const handleConfirm = async () => {
    if (isEdit) {
      const endLimit = addDays(new Date(), weeks * 7);
      const filtered = events
        .filter(e => toUtcDateRange(e).start < endLimit)
        .map(({ start, end, timezone: tz }) => ({ start, end, timezone: tz }));
      const busyPayload = [
        ...normalizeForSubmit(busyEvents),
        ...normalizeForSubmit(defaultBusy),
      ];
      if (onConfirm) {
        await onConfirm(filtered);
      } else {
        await fetch('/api/candidate/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: filtered, busy: busyPayload }),
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
              const busy = isBusySlot(slotStartUtc);
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
                    } else if (available) {
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
                            toggleSlot(new Date(t));
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
                      ? busy || available
                        ? '#f87171'
                        : 'transparent'
                      : isSelected
                      ? 'lightgreen'
                      : available
                      ? 'lightblue'
                      : 'transparent',
                    cursor: isEdit ? 'pointer' : available ? 'pointer' : 'default',
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
