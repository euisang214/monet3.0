'use client';
import { useState } from 'react';
import { Input, Button } from "@/components/ui/ui";

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setError('Too many attempts. Please try again later.');
          return;
        }
        setError(data.error || data.message || 'Something went wrong. Please try again.');
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <p>Check your email for a reset link.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      {error && (
        <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send reset link'}
      </Button>
    </form>
  );
}
