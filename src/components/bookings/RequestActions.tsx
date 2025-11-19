'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui';

export default function RequestActions({ bookingId, candidateId }: { bookingId: string; candidateId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/professional/bookings/${bookingId}/decline`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Failed to decline booking');
        return;
      }
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: 'var(--error)', marginBottom: 8, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <Link href={`/professional/requests/${bookingId}`}>
          <Button style={{ backgroundColor: 'green', color: 'white' }}>Accept</Button>
        </Link>
        <Button variant="danger" onClick={decline} disabled={loading}>
          {loading ? 'Declining...' : 'Reject'}
        </Button>
        <Link href={`/professional/detail/${candidateId}`}>
          <Button variant="primary">View Details</Button>
        </Link>
      </div>
    </div>
  );
}
