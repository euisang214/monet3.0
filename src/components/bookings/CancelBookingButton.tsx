'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface CancelBookingButtonProps {
  bookingId: string;
  startAt: Date;
  status: string;
  variant?: 'inline' | 'standalone';
}

export default function CancelBookingButton({
  bookingId,
  startAt,
  status,
  variant = 'standalone'
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only allow cancellation for certain statuses
  const canCancel = ['requested', 'accepted'].includes(status);

  // Calculate if within 3-hour window
  const minutesUntilCall = (new Date(startAt).getTime() - Date.now()) / 60000;
  const isWithin3Hours = minutesUntilCall < 180 && minutesUntilCall > 0;

  if (!canCancel) {
    return null;
  }

  const handleCancel = async () => {
    if (isWithin3Hours) {
      setError('Cannot cancel within 3 hours of scheduled call time');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? This action cannot be undone.'
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/shared/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to cancel booking');
        return;
      }

      router.refresh();
    } catch (err) {
      setError('An error occurred while cancelling');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col" style={{ gap: 4 }}>
      <Button
        variant="danger"
        onClick={handleCancel}
        disabled={loading || isWithin3Hours}
        style={variant === 'inline' ? { padding: '4px 8px', fontSize: '0.875rem' } : undefined}
      >
        {loading ? 'Cancelling...' : 'Cancel'}
      </Button>
      {isWithin3Hours && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
          Cannot cancel within 3 hours
        </span>
      )}
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
