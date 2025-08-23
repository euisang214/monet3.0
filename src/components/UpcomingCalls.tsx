'use client';

import { Card, Button } from './ui';
import React from 'react';

interface Call {
  id: string;
  startAt: string | Date;
  zoomJoinUrl?: string | null;
  professional: {
    email: string;
    professionalProfile?: {
      title: string | null;
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
              <strong>{c.professional.email}</strong>
              <span style={{ color: 'var(--text-muted)' }}>
                {c.professional.professionalProfile?.title ?? ''}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {new Date(c.startAt).toLocaleString()}
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

