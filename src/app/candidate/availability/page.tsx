'use client';
import React from 'react';
import AvailabilityCalendar from '../../../components/AvailabilityCalendar';
import { Button } from '../../../components/ui';

export default function Availability(){
  return (
    <div className="col" style={{ gap: 16 }}>
      <AvailabilityCalendar />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button>Confirm Availability</Button>
      </div>
    </div>
  );
}
