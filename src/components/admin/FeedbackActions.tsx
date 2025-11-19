'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface FeedbackActionsProps {
  bookingId: string;
  currentStatus: string;
}

export default function FeedbackActions({ bookingId, currentStatus }: FeedbackActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const handleRecheck = async () => {
    setLoading(true);
    try {
      await fetch(`/api/shared/qc/${bookingId}/recheck`, { method: 'POST' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (status: string) => {
    const reason = status === 'failed'
      ? window.prompt('Enter reason for failing this feedback:')
      : undefined;

    if (status === 'failed' && !reason) {
      return;
    }

    setStatusLoading(status);
    try {
      await fetch(`/api/admin/feedback/${bookingId}/qc-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qcStatus: status, reason }),
      });
      router.refresh();
    } finally {
      setStatusLoading(null);
    }
  };

  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
        <Button
          onClick={handleRecheck}
          disabled={loading}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          {loading ? 'Rechecking...' : 'Recheck'}
        </Button>
      </div>
      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
        {currentStatus !== 'passed' && (
          <Button
            variant="primary"
            onClick={() => handleSetStatus('passed')}
            disabled={statusLoading !== null}
            style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: 'var(--success)' }}
          >
            {statusLoading === 'passed' ? '...' : 'Pass'}
          </Button>
        )}
        {currentStatus !== 'revise' && (
          <Button
            onClick={() => handleSetStatus('revise')}
            disabled={statusLoading !== null}
            style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: 'var(--warning)' }}
          >
            {statusLoading === 'revise' ? '...' : 'Revise'}
          </Button>
        )}
        {currentStatus !== 'failed' && (
          <Button
            variant="danger"
            onClick={() => handleSetStatus('failed')}
            disabled={statusLoading !== null}
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          >
            {statusLoading === 'failed' ? '...' : 'Fail'}
          </Button>
        )}
      </div>
    </div>
  );
}
