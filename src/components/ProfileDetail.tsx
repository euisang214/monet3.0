'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Button, Card, Badge } from './ui';
import { ProfileResponse } from '../types/profile';

export default function ProfileDetail({
  profile,
  schedulePath,
}: {
  profile: ProfileResponse;
  schedulePath?: string;
}) {
  const [tab, setTab] = useState<'about' | 'reviews'>('about');
  const name = profile.identity?.redacted ? undefined : profile.identity?.name;
  const heading = name ?? (profile.title && profile.employer ? `${profile.title} at ${profile.employer}` : undefined);

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
            {profile.priceUSD !== undefined && (
              <span>{`Price per Session: $${profile.priceUSD}`}</span>
            )}
            <div className="row" style={{ alignItems: 'center', gap: 8 }}>
              {profile.verified && <Badge>Verified Expert</Badge>}
            </div>
          </div>
        </div>
        {schedulePath && (
          <Link href={schedulePath}>
            <Button>Schedule a Call</Button>
          </Link>
        )}
      </div>

      <div className="tabs">
        <button className={clsx('tab', { active: tab === 'about' })} onClick={() => setTab('about')}>
          About
        </button>
        <button className={clsx('tab', { active: tab === 'reviews' })} onClick={() => setTab('reviews')}>
          Reviews
        </button>
      </div>

      {tab === 'about' ? (
        <Card className="col" style={{ padding: 16, gap: 24 }}>
          <div className="col" style={{ gap: 8 }}>
            <h3>Summary</h3>
            {profile.bio ? (
              <p>{profile.bio}</p>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <h3>Experience</h3>
            {profile.experience && profile.experience.length > 0 ? (
              <ul>
                {profile.experience.map((item, idx) => {
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
            {profile.education && profile.education.length > 0 ? (
              <ul>
                {profile.education.map((item, idx) => {
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
            {profile.interests && profile.interests.length > 0 ? (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {profile.interests.map((interest) => (
                  <Badge key={interest}>{interest}</Badge>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No information available</p>
            )}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <h3>Activities</h3>
            {profile.activities && profile.activities.length > 0 ? (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {profile.activities.map((activity) => (
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
          {profile.reviews && profile.reviews.length > 0 ? (
            profile.reviews.map((r, idx) => (
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
