'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { QCStatus } from '@prisma/client';

interface QCRecheckButtonProps {
  bookingId: string;
  qcStatus: QCStatus;
}

function getStatusColor(status: QCStatus): string {
  switch (status) {
    case 'passed':
      return 'var(--success)';
    case 'revise':
      return 'var(--warning)';
    case 'failed':
      return 'var(--error)';
    default:
      return 'var(--text-muted)';
  }
}

function getStatusLabel(status: QCStatus): string {
  switch (status) {
    case 'passed':
      return 'QC Passed';
    case 'revise':
      return 'Needs Revision';
    case 'failed':
      return 'QC Failed';
    case 'missing':
      return 'QC Pending';
    default:
      return status;
  }
}

export default function QCRecheckButton({ bookingId, qcStatus }: QCRecheckButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecheck = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/shared/qc/${bookingId}/recheck`, {
        method: 'POST',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || 'Failed to request QC recheck');
        return;
      }

      setSuccess(true);
      // Refresh the page after a short delay to show updated status
      setTimeout(() => router.refresh(), 2000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong>QC Status:</strong>
        <span
          style={{
            color: getStatusColor(qcStatus),
            fontWeight: 500,
          }}
        >
          {getStatusLabel(qcStatus)}
        </span>
      </div>

      {qcStatus === 'revise' && (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Your feedback needs revision. Please update it and request a recheck.
          </p>
          {error && (
            <div style={{ color: 'var(--error)', marginBottom: 8, fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: 'var(--success)', marginBottom: 8, fontSize: '0.875rem' }}>
              QC recheck requested! The page will refresh shortly.
            </div>
          )}
          <Button
            onClick={handleRecheck}
            disabled={loading || success}
          >
            {loading ? 'Requesting...' : 'Request QC Recheck'}
          </Button>
        </div>
      )}

      {qcStatus === 'passed' && (
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--success)' }}>
          Your feedback has been approved and the payout is ready.
        </p>
      )}

      {qcStatus === 'failed' && (
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--error)' }}>
          Your feedback did not meet quality standards. The candidate has been refunded.
        </p>
      )}
    </div>
  );
}
