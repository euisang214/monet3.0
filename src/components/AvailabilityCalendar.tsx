'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { Button } from './ui';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';

const Calendar = dynamic(() => import('@toast-ui/react-calendar'), { ssr: false });

type Event = {
  id: string;
  calendarId: string;
  title: string;
  start: string | Date;
  end: string | Date;
  category: string;
  isReadOnly?: boolean;
};

export default function AvailabilityCalendar(){
  const [events, setEvents] = useState<Event[]>([]);
  const [busyEvents, setBusyEvents] = useState<Event[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('candidateAvailability');
    if(saved) setEvents(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('candidateAvailability', JSON.stringify(events));
  }, [events]);

  const calendars = [
    { id: 'available', name: 'Available', backgroundColor: '#86efac' },
    { id: 'busy', name: 'Busy', backgroundColor: '#f87171' },
  ];

  const handleSync = async () => {
    const res = await fetch('/api/candidate/busy');
    if(!res.ok) return;
    const data = await res.json();
    const fetched: Event[] = (data.busy || []).map((b: any, i: number) => ({
      id: `busy-${i}-${b.start}`,
      calendarId: 'busy',
      title: 'Busy',
      start: b.start,
      end: b.end,
      category: 'time',
      isReadOnly: true,
    }));
    setBusyEvents(fetched);
  };

  return (
    <div className="col" style={{ gap: 12 }}>
      <Button onClick={handleSync}>Sync Google Calendar</Button>
      <Calendar
        height="800px"
        view="week"
        calendars={calendars}
        events={[...events, ...busyEvents]}
        onBeforeCreateEvent={(ev: any) => {
          const { start, end } = ev;
          const e: Event = {
            id: String(Date.now()),
            calendarId: 'available',
            title: 'Available',
            start,
            end,
            category: 'time'
          };
          setEvents(prev => [...prev, e]);
        }}
        onBeforeUpdateEvent={(ev: any) => {
          const { event, changes } = ev;
          setEvents(prev => prev.map(e => e.id === event.id ? { ...e, start: changes.start, end: changes.end } : e));
        }}
        onBeforeDeleteEvent={(ev: any) => {
          const { id } = ev.event;
          setEvents(prev => prev.filter(e => e.id !== id));
        }}
      />
    </div>
  );
}