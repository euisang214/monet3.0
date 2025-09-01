'use client';
import React, { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Button } from './ui';
import { addMinutes, addDays, startOfWeek, format } from 'date-fns';
import { signIn } from 'next-auth/react';

type Slot = {
  start: string;
  end: string;
};

interface AvailabilityCalendarProps {
  weeks?: number;
  onConfirm?: (slots: Slot[]) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ weeks = 2, onConfirm }) => {
  const [events, setEvents] = useState<Slot[]>([]);
  const [busyEvents, setBusyEvents] = useState<Slot[]>([]);
  const [defaultBusy, setDefaultBusy] = useState<Slot[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [isDragging, setIsDragging] = useState(false);
  const draggedSlots = useRef<Set<number>>(new Set());

  const handleConfirm = async () => {
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
  };

  const handleSync = async () => {
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
    const saved = localStorage.getItem('candidateAvailability');
    if(saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('candidateAvailability', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    handleSync();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('candidateDefaultBusy');
    if (!saved) {
      setDefaultBusy([]);
      return;
    }
    const ranges: { day: number; start: string; end: string }[] = JSON.parse(saved);
    const base = startOfWeek(weekStart, { weekStartsOn: 0 });
    const slots: Slot[] = [];
    for (let w = 0; w < weeks; w++) {
      ranges.forEach(r => {
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
  }, [weekStart]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      draggedSlots.current.clear();
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const times = Array.from({ length: 48 }, (_, i) => addMinutes(weekStart, i * 30));

  const isBusy = (date: Date) => {
    const all = [...busyEvents, ...defaultBusy];
    return all.some(e => new Date(e.start).getTime() === date.getTime());
  };
  const isAvailable = (date: Date) => events.some(e => new Date(e.start).getTime() === date.getTime());

  const toggleSlot = (date: Date) => {
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
        <Button onClick={handleSync}>Sync Google Calendar</Button>
        <Button onClick={handleConfirm}>Confirm Availability</Button>
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
              return (
                <div
                  key={`${col}-${row}`}
                  onMouseDown={() => {
                    toggleSlot(slotStart);
                    setIsDragging(true);
                    draggedSlots.current = new Set([key]);
                  }}
                  onMouseEnter={() => {
                    if (isDragging && !draggedSlots.current.has(key)) {
                      toggleSlot(slotStart);
                      draggedSlots.current.add(key);
                    }
                  }}
                  style={{
                    borderTop: '1px solid var(--border)',
                    borderLeft: '1px solid var(--border)',
                    background: busy || available ? '#f87171' : 'transparent',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
