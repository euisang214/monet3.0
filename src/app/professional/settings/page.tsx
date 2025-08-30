"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "../../../components/ui";

export default function ProSettings() {
  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/stripe/account");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStatus(data.status || "not_connected");
      } catch {
        setError("Failed to load Stripe status");
      }
    }
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/account", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.onboardingUrl) throw new Error();
      setMessage("Redirecting to Stripe...");
      window.location.href = data.onboardingUrl;
    } catch {
      setError("Failed to start Stripe onboarding");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel =
    status === "complete"
      ? "Connected"
      : status === "pending"
      ? "Pending verification"
      : status === "incomplete"
      ? "Incomplete"
      : status === "loading"
      ? "Loading..."
      : "Not connected";

  const canConnect =
    status === "not_connected" || status === "incomplete";

  return (
    <Card style={{ padding: 16 }}>
      <h2>Settings</h2>
      <div className="grid grid-2">
        <div className="col" style={{ gap: 12 }}>
          <h3>Profile</h3>
          <label>Full name</label>
          <Input defaultValue="First Last" />
          <label>Email</label>
          <Input defaultValue="pro1@monet.local" />
          <label>Timezone</label>
          <Input defaultValue="America/New_York" />

          <h3>Calendar</h3>
          <p>Connect your calendar to automatically block out busy times.</p>
          <Button>Connect Calendar</Button>
        </div>
        <div className="col" style={{ gap: 12 }}>
          <h3>Payment</h3>
          <p>Onboard to Stripe Connect to receive payouts.</p>
          {canConnect && (
            <Button onClick={handleConnect} disabled={loading}>
              {loading
                ? "Loading..."
                : status === "incomplete"
                ? "Resume Onboarding"
                : "Connect Stripe"}
            </Button>
          )}
          <p>Account status: {statusLabel}</p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}
          <h3>Verification Status</h3>
          <p>Corporate email not yet verified.</p>
        </div>
      </div>
    </Card>
  );
}
