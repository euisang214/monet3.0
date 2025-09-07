'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui';

export default function StripeSection() {
  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/stripe/account');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStatus(data.status || 'not_connected');
      } catch {
        setError('Failed to load Stripe status');
      }
    }
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/account', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.onboardingUrl) throw new Error();
      setMessage('Redirecting to Stripe...');
      window.location.href = data.onboardingUrl;
    } catch {
      setError('Failed to open Stripe');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel =
    status === 'complete'
      ? 'Connected'
      : status === 'pending'
      ? 'Pending verification'
      : status === 'incomplete'
      ? 'Incomplete'
      : status === 'loading'
      ? 'Loading...'
      : 'Not connected';

  return (
    <>
      <h3>Payment</h3>
      <p>Onboard to Stripe Connect to receive payouts.</p>
      <Button onClick={handleConnect} disabled={loading || status === 'loading'}>
        {loading || status === 'loading'
          ? 'Loading...'
          : status === 'incomplete'
          ? 'Resume Onboarding'
          : status === 'not_connected'
          ? 'Connect Stripe'
          : 'Edit Stripe'}
      </Button>
      <p>Account status: {statusLabel}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
    </>
  );
}
