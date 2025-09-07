'use client';
import React, { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Button } from './ui';
import { addMinutes, addDays, startOfWeek, format } from 'date-fns';
import { signIn } from 'next-auth/react';

export type Slot = {
  start: string;
  end: string;
};

interface AvailabilityCalendarProps {
  weeks?: number;
  onConfirm?: (slots: Slot[]) => void;
  /**
   * edit – candidate selecting their availability
   * select – professional choosing one of the candidate's slots
   */
  mode?: 'edit' | 'select';
  /** preset slots for select mode */
  slots?: Slot[];
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
  const [events, setEvents] = useState<Slot[]>(isEdit ? [] : slots);
  const [busyEvents, setBusyEvents] = useState<Slot[]>([]);
  const [defaultBusy, setDefaultBusy] = useState<Slot[]>([]);
  const [defaultBusyRanges, setDefaultBusyRanges] = useState<{ day: number; start: string; end: string }[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [isDragging, setIsDragging] = useState(false);
  const draggedSlots = useRef<Set<number>>(new Set());
  const lastSlot = useRef<number | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);

  useEffect(() => {
    if (!isEdit) setEvents(slots);
  }, [slots, isEdit]);

  const handleConfirm = async () => {
    if (isEdit) {
      const end = addDays(new Date(), weeks * 7);
      const filtered = events.filter(e => new Date(e.start) < end);
      if (onConfirm) {
        await onConfirm(filtered);
      } else {
        await fetch('/api/candidate/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: filtered, busy: [...busyEvents, ...defaultBusy] }),
        });
      }
    } else if (onConfirm && selected) {
      await onConfirm([selected]);
    }
  };

  const handleSync = async () => {
    if (!isEdit) return;
    const res = await fetch('/api/candidate/busy');
    if(res.status === 401){
      alert('Please connect your Google Calendar to sync availability.');
      await signIn('google', { callbackUrl: window.location.href });
      return;
    }
    if(!res.ok) return;
    const data = await res.json();
    const fetched: Slot[] = [];
    (data.busy || []).forEach((b: any) => {
      const start = new Date(b.start);
      const end = new Date(b.end);
      for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 30)) {
        const slotStart = new Date(t);
        const slotEnd = new Date(t.getTime() + 30 * 60 * 1000);
        fetched.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
      }
    });
    setBusyEvents(fetched);
  };

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const saved = localStorage.getItem('candidateAvailability');
      if (saved) {
        setEvents(JSON.parse(saved));
      } else {
        const res = await fetch('/api/candidate/availability');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
          setBusyEvents(data.busy || []);
        }
      }
    };
    load();
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    localStorage.setItem('candidateAvailability', JSON.stringify(events));
  }, [events, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    handleSync();
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    async function loadDefaults() {
      try {
        const res = await fetch('/api/candidate/settings');
        if (res.ok) {
          const data = await res.json();
          setDefaultBusyRanges(data.defaultBusy || []);
        }
      } catch {
        setDefaultBusyRanges([]);
      }
    }
    loadDefaults();
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    const base = startOfWeek(weekStart, { weekStartsOn: 0 });
    const slots: Slot[] = [];
    for (let w = 0; w < weeks; w++) {
      defaultBusyRanges.forEach(r => {
        const day = addDays(base, r.day + w * 7);
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        const start = new Date(day);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(day);
        end.setHours(eh, em, 0, 0);
        for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 30)) {
          const slotStart = new Date(t);
          const slotEnd = new Date(t.getTime() + 30 * 60 * 1000);
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        }
      });
    }
    setDefaultBusy(slots);
  }, [weekStart, weeks, defaultBusyRanges, isEdit]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      draggedSlots.current.clear();
      lastSlot.current = null;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const times = Array.from({ length: 48 }, (_, i) => addMinutes(weekStart, i * 30));

  const isBusy = (date: Date) => {
    if (!isEdit) return false;
    const all = [...busyEvents, ...defaultBusy];
    return all.some(e => new Date(e.start).getTime() === date.getTime());
  };
  const isAvailable = (date: Date) => events.some(e => new Date(e.start).getTime() === date.getTime());

  const toggleSlot = (date: Date) => {
    if (!isEdit) return;
    const startIso = date.toISOString();
    const endIso = new Date(date.getTime() + 30 * 60 * 1000).toISOString();

    const available = isAvailable(date);

    flushSync(() => {
      if (isBusy(date)) {
        setBusyEvents(prev => prev.filter(e => new Date(e.start).getTime() !== date.getTime()));
      }

      if (available) {
        setEvents(prev => prev.filter(e => e.start !== startIso));
      } else {
        setEvents(prev => [...prev, { start: startIso, end: endIso }]);
      }
    });
  };

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

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
            {format(d, 'EEE MMM d')}
          </div>
        ))}

        {times.map((t, row) => (
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
              {row % 2 === 0 ? format(t, 'h a') : ''}
            </div>
            {days.map((d, col) => {
              const slotStart = new Date(d);
              slotStart.setHours(t.getHours(), t.getMinutes(), 0, 0);
              const busy = isBusy(slotStart);
              const available = isAvailable(slotStart);
              const key = slotStart.getTime();
              const startIso = slotStart.toISOString();
              const isSelected = selected && selected.start === startIso;
              return (
                <div
                  key={`${col}-${row}`}
                  onMouseDown={() => {
                    if (isEdit) {
                      toggleSlot(slotStart);
                      setIsDragging(true);
                      draggedSlots.current = new Set([key]);
                      lastSlot.current = key;
                    } else if (available) {
                      setSelected({ start: startIso, end: new Date(slotStart.getTime() + 30 * 60 * 1000).toISOString() });
                    }
                  }}
                  onMouseEnter={() => {
                    if (isEdit && isDragging) {
                      const current = key;
                      const previous = lastSlot.current;
                      if (previous !== null) {
                        const prevDate = new Date(previous);
                        const currDate = slotStart;
                        if (prevDate.toDateString() === currDate.toDateString()) {
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
                          toggleSlot(currDate);
                          draggedSlots.current.add(current);
                        }
                      } else {
                        if (!draggedSlots.current.has(current)) {
                          toggleSlot(slotStart);
                          draggedSlots.current.add(current);
                        }
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
