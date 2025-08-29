'use client';
import React, { useRef } from 'react';
import AvailabilityCalendar, { AvailabilityCalendarRef } from '../../../components/AvailabilityCalendar';
import { Button } from '../../../components/ui';

export default function Availability(){
  const calRef = useRef<AvailabilityCalendarRef>(null);

  const handleConfirm = async () => {
    const data = calRef.current?.getData();
    if(!data) return;
    await fetch('/api/candidate/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <AvailabilityCalendar ref={calRef} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button onClick={handleConfirm}>Confirm Availability</Button>
      </div>
    </div>
  );
}