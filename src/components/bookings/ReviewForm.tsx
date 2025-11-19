'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface ReviewFormProps {
  bookingId: string;
  professionalName: string;
  /** Optional callback after successful submission */
  onSubmit?: () => void;
}

export default function ReviewForm({ bookingId, professionalName, onSubmit }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || data.error || 'Failed to submit review');
        return;
      }

      setSuccess(true);
      if (onSubmit) {
        onSubmit();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 16, backgroundColor: 'var(--success-bg)', borderRadius: 8 }}>
        <p style={{ margin: 0, color: 'var(--success)' }}>
          Thank you for your review!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4 style={{ margin: '0 0 8px' }}>Rate your experience with {professionalName}</h4>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 24,
                padding: 4,
                color: star <= (hoverRating || rating) ? 'var(--warning)' : 'var(--text-muted)',
              }}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              {star <= (hoverRating || rating) ? '\u2605' : '\u2606'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-text" style={{ display: 'block', marginBottom: 8 }}>
          Your review
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience... (minimum 50 characters)"
          rows={4}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 4,
            border: '1px solid var(--border)',
            resize: 'vertical',
          }}
        />
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {text.length}/50 characters minimum
        </p>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading || rating === 0 || text.length < 50}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
