'use client';
import React from 'react';
import AvailabilityCalendar from '../../../components/AvailabilityCalendar';

export default function Availability(){
  return (
    <div className="col" style={{ gap: 16 }}>
      <AvailabilityCalendar />
    </div>
  );
}