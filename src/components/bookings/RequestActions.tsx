'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui';

interface RequestActionsProps {
  bookingId: string;
  candidateId: string;
  status?: string;
}

export default function RequestActions({ bookingId, candidateId, status = 'requested' }: RequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const decline = async () => {
    setLoading(true);
    await fetch(`/api/professional/bookings/${bookingId}/decline`, { method: 'POST' });
    setLoading(false);
    router.refresh();
  };

  const cancel = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? The candidate will be refunded.'
    );
    if (!confirmed) return;

    setCancelLoading(true);
    await fetch(`/api/shared/bookings/${bookingId}/cancel`, { method: 'POST' });
    setCancelLoading(false);
    router.refresh();
  };

  // Show different actions based on status
  if (status === 'accepted') {
    return (
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <Button variant="danger" onClick={cancel} disabled={cancelLoading}>
          {cancelLoading ? 'Cancelling...' : 'Cancel'}
        </Button>
        <Link href={`/professional/detail/${candidateId}`}>
          <Button variant="primary">View Details</Button>
        </Link>
      </div>
    );
  }

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
