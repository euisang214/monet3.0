'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';

interface ReviewFormProps {
  bookingId: string;
  hasExistingReview: boolean;
}

export default function ReviewForm({ bookingId, hasExistingReview }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (hasExistingReview || success) {
    return (
      <Card className="col" style={{ padding: 16, gap: 8, backgroundColor: 'var(--success-light)' }}>
        <p style={{ color: 'var(--success)', fontWeight: 500 }}>
          {success ? 'Thank you for your review!' : 'You have already submitted a review for this call.'}
        </p>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (text.length < 50) {
      setError('Review must be at least 50 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shared/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          text,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to submit review');
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError('An error occurred while submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col" style={{ padding: 16, gap: 16 }}>
      <h3>Rate This Professional</h3>
      <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="rating" style={{ fontWeight: 500 }}>Rating</label>
          <div className="row" style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: star <= rating ? 'var(--warning)' : 'var(--muted)',
                  padding: 0,
                }}
                aria-label={`Rate ${star} stars`}
              >
                ★
              </button>
            ))}
            <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
              {rating}/5
            </span>
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="review-text" style={{ fontWeight: 500 }}>
            Your Review
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
              (min 50 characters)
            </span>
          </label>
          <textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience with this professional..."
            rows={4}
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border)',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          />
          <span style={{ fontSize: '0.875rem', color: text.length < 50 ? 'var(--text-muted)' : 'var(--success)' }}>
            {text.length}/50 characters
          </span>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
        )}

        <Button type="submit" variant="primary" disabled={loading || text.length < 50}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Card>
  );
}
