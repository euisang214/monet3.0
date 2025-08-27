'use client';
import React, { useEffect, useState } from 'react';
import { Button } from './ui';
import { addMinutes, addDays, startOfWeek, format } from 'date-fns';

type Slot = {
  start: string;
  end: string;
};

export default function AvailabilityCalendar(){
  const [events, setEvents] = useState<Slot[]>([]);
  const [busyEvents, setBusyEvents] = useState<Slot[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('candidateAvailability');
    if(saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('candidateAvailability', JSON.stringify(events));
  }, [events]);

  const handleSync = async () => {
    const res = await fetch('/api/candidate/busy');
    if(!res.ok) return;
    const data = await res.json();
    const fetched: Slot[] = (data.busy || []).map((b: any) => ({
      start: b.start,
      end: b.end,
    }));
    setBusyEvents(fetched);
  };

  const start = startOfWeek(new Date(), { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const times = Array.from({ length: 48 }, (_, i) => addMinutes(start, i * 30));

  const isBusy = (date: Date) => busyEvents.some(e => date >= new Date(e.start) && date < new Date(e.end));
  const isAvailable = (date: Date) => events.some(e => new Date(e.start).getTime() === date.getTime());

  const toggleSlot = (date: Date) => {
    if(isBusy(date)) return;
    const startIso = date.toISOString();
    const endIso = new Date(date.getTime() + 30 * 60 * 1000).toISOString();
    if(isAvailable(date)){
      setEvents(prev => prev.filter(e => e.start !== startIso));
    } else {
      setEvents(prev => [...prev, { start: startIso, end: endIso }]);
    }
  };

  return (
    <div className="col" style={{ gap: 12 }}>
      <Button onClick={handleSync}>Sync Google Calendar</Button>
      <div
        className="calendar-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '60px repeat(7, 1fr)',
          gridTemplateRows: '30px repeat(48, 20px)',
          border: '1px solid var(--border)',
          overflowX: 'auto'
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
            {format(d, 'EEE d')}
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
              return (
                <div
                  key={`${col}-${row}`}
                  onClick={() => toggleSlot(slotStart)}
                  style={{
                    borderTop: '1px solid var(--border)',
                    borderLeft: '1px solid var(--border)',
                    background: busy ? '#f87171' : available ? '#86efac' : 'transparent',
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}