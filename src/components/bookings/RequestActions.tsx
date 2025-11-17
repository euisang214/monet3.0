'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui';

export default function RequestActions({ bookingId, candidateId }: { bookingId: string; candidateId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const decline = async () => {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/decline`, { method: 'POST' });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
      <Link href={`/professional/requests/${bookingId}`}>
        <Button style={{ backgroundColor: 'green', color: 'white' }}>Accept</Button>
      </Link>
      <Button variant="danger" onClick={decline} disabled={loading}>Reject</Button>
      <Link href={`/professional/detail/${candidateId}`}>
        <Button variant="primary">View Details</Button>
      </Link>
    </div>
  );
}
