'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button, Card, Badge } from '../../../../components/ui';
import { ProfessionalResponse } from './types';

export default function DetailClient({ pro }: { pro: ProfessionalResponse }) {
  const [tab, setTab] = useState<'about' | 'reviews'>('about');
  const name = pro.identity.redacted ? undefined : pro.identity.name;
  const heading = name ?? `${pro.title} at ${pro.employer}`;
  const activeStyle = {
    background: 'var(--gray-900)',
    color: 'white',
    cursor: 'pointer',
  } as const;
  const inactiveStyle = { cursor: 'pointer' } as const;

  return (
    <section className="col" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--gray-200)',
            }}
          >
            <Image src="/globe.svg" alt={heading || 'avatar'} width={80} height={80} />
          </div>
          <div className="col" style={{ gap: 4 }}>
            {heading && <h2>{heading}</h2>}
            <span>{`Price per Session: $${pro.priceUSD}`}</span>
            <div className="row" style={{ alignItems: 'center', gap: 8 }}>
              {pro.verified && <Badge>Verified Expert</Badge>}
            </div>
          </div>
        </div>
        <Button>Schedule a Call</Button>
      </div>

      <div className="row" style={{ gap: 16 }}>
        <button
          className="badge"
          style={tab === 'about' ? activeStyle : inactiveStyle}
          onClick={() => setTab('about')}
        >
          About
        </button>
        <button
          className="badge"
          style={tab === 'reviews' ? activeStyle : inactiveStyle}
          onClick={() => setTab('reviews')}
        >
          Reviews
        </button>
      </div>

      {tab === 'about' ? (
        <Card className="col" style={{ padding: 16, gap: 24 }}>
          <div className="col" style={{ gap: 8 }}>
            <h3>Summary</h3>
            {pro.bio ? (
              <p>{pro.bio}</p>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <h3>Experience</h3>
            {pro.experience && pro.experience.length > 0 ? (
              <ul>
                {pro.experience.map((item, idx) => {
                  const period =
                    item.startDate && item.endDate
                      ? `${new Date(item.startDate).getFullYear()}-${new Date(item.endDate).getFullYear()}`
                      : '';
                  return (
                    <li key={idx}>
                      {item.title} at {item.firm}
                      {period ? ` (${period})` : ''}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <h3>Education</h3>
            {pro.education && pro.education.length > 0 ? (
              <ul>
                {pro.education.map((item, idx) => {
                  const period =
                    item.startDate && item.endDate
                      ? `${new Date(item.startDate).getFullYear()}-${new Date(item.endDate).getFullYear()}`
                      : '';
                  return (
                    <li key={idx}>
                      {item.title}, {item.school}
                      {period ? ` (${period})` : ''}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <h3>Interests</h3>
            {pro.interests && pro.interests.length > 0 ? (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {pro.interests.map((interest) => (
                  <Badge key={interest}>{interest}</Badge>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <h3>Activities</h3>
            {pro.activities && pro.activities.length > 0 ? (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {pro.activities.map((activity) => (
                  <Badge key={activity}>{activity}</Badge>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>
        </Card>
      ) : (
        <Card className="col" style={{ padding: 16, gap: 16 }}>
          {pro.reviews && pro.reviews.length > 0 ? (
            pro.reviews.map((r, idx) => (
              <div key={idx} className="col" style={{ gap: 4 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{r.candidate}</strong>
                  <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p>{r.text}</p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
          )}
        </Card>
      )}
    </section>
  );
}
