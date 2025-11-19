'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface CancelButtonProps {
  bookingId: string;
  /** Role of the user canceling - affects messaging */
  role: 'candidate' | 'professional';
  /** Whether the booking is within 3 hours (only relevant for candidates) */
  startAt?: Date | string;
  /** Optional callback after successful cancellation */
  onCancel?: () => void;
}

export default function CancelButton({ bookingId, role, startAt, onCancel }: CancelButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if within 3-hour window for candidates
  const isWithin3Hours = startAt && role === 'candidate' &&
    (new Date(startAt).getTime() - Date.now()) < 180 * 60 * 1000;

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shared/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || 'Failed to cancel booking');
        setShowConfirm(false);
        return;
      }

      setShowConfirm(false);
      if (onCancel) {
        onCancel();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          {role === 'professional'
            ? 'Are you sure? The candidate will receive a full refund.'
            : 'Are you sure you want to cancel this booking?'}
        </p>
        {error && (
          <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <Button
            variant="danger"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Canceling...' : 'Yes, Cancel'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
          >
            No, Keep
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ color: 'var(--error)', marginBottom: 8, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <Button
        variant="danger"
        onClick={() => setShowConfirm(true)}
        disabled={isWithin3Hours}
        title={isWithin3Hours ? 'Cannot cancel within 3 hours of call' : undefined}
      >
        Cancel Booking
      </Button>
      {isWithin3Hours && (
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Cannot cancel within 3 hours
        </p>
      )}
    </div>
  );
}
