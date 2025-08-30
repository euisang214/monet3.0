import { Card, Button, Input } from "../../../components/ui";
import { auth } from "../../../../auth";
import { getProfessionalSettings } from "../../api/professional/settings";
import { useState, useEffect } from "react";

export default async function ProSettings() {
  const session = await auth();
  const data = session?.user
    ? await getProfessionalSettings(session.user.id)
    : null;

  return (
    <Card style={{ padding: 16 }}>
      <h2>Settings</h2>
      <div className="grid grid-2">
        <div className="col" style={{ gap: 12 }}>
          <h3>Profile</h3>
          <label>Full name</label>
          <Input defaultValue={data?.fullName ?? ""} />
          <label>Email</label>
          <Input defaultValue={data?.email ?? ""} />
          <label>Timezone</label>
          <Input defaultValue={data?.timezone ?? ""} />

          <h3>Calendar</h3>
          <p>Connect your calendar to automatically block out busy times.</p>
          <Button>Connect Calendar</Button>
        </div>
        <div className="col" style={{ gap: 12 }}>
          <StripeSection />
          <h3>Verification Status</h3>
          <p>
            {data?.verified
              ? "Corporate email verified."
              : "Corporate email not yet verified."}
          </p>
        </div>
      </div>
    </Card>
  );
}

function StripeSection() {
  'use client';
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
      setError('Failed to start Stripe onboarding');
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

  const canConnect =
    status === 'not_connected' || status === 'incomplete';

  return (
    <>
      <h3>Payment</h3>
      <p>Onboard to Stripe Connect to receive payouts.</p>
      {canConnect && (
        <Button onClick={handleConnect} disabled={loading}>
          {loading
            ? 'Loading...'
            : status === 'incomplete'
            ? 'Resume Onboarding'
            : 'Connect Stripe'}
        </Button>
      )}
      <p>Account status: {statusLabel}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
    </>
  );
}

