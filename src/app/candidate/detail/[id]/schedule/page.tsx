'use client';
import { useState } from 'react';
import AvailabilityCalendar from '../../../../../components/AvailabilityCalendar';
import { Card, Input } from '../../../../../components/ui';

export default function Schedule({ params }: { params: { id: string } }) {
  const [weeks, setWeeks] = useState(2);

  const handleConfirm = async (slots: any[]) => {
    await fetch('/api/bookings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionalId: params.id, slots, weeks }),
    });
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>
          We will share your selected availability for the next two weeks with this professional by
          default.
        </p>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <label htmlFor="weeks">Weeks to share:</label>
          <Input
            id="weeks"
            type="number"
            min={1}
            value={weeks}
            onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
            style={{ width: 80 }}
          />
        </div>
      </Card>
      <AvailabilityCalendar weeks={weeks} onConfirm={handleConfirm} />
    </div>
  );
}
