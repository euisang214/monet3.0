'use client';

import { Card, Button } from './ui';
import React from 'react';
import { formatDateTime } from '@/lib/utils/date';

interface Call {
  id: string;
  startAt: string | Date;
  zoomJoinUrl?: string | null;
  professional: {
    email: string;
    professionalProfile?: {
      title: string | null;
      employer: string | null;
    } | null;
  };
}

export default function UpcomingCalls({ calls }: { calls: Call[] }) {
  return (
    <Card className="col" style={{ padding: 16 }}>
      <h3>Upcoming Calls</h3>
      <div className="col" style={{ gap: 12 }}>
        {calls.map((c) => (
          <div
            key={c.id}
            className="row"
            style={{ justifyContent: 'space-between' }}
          >
            <div className="col" style={{ gap: 2 }}>
              <strong>{`${c.professional.professionalProfile?.title} @ ${c.professional.professionalProfile?.employer}`}</strong>
              <span style={{ color: 'var(--text-muted)' }}>
                {formatDateTime(c.startAt)}
              </span>
            </div>
            <Button
              onClick={() =>
                c.zoomJoinUrl && window.open(c.zoomJoinUrl, '_blank')
              }
            >
              Join
            </Button>
          </div>
        ))}
        {calls.length === 0 && (
          <span style={{ color: 'var(--text-muted)' }}>No upcoming calls</span>
        )}
      </div>
    </Card>
  );
}

