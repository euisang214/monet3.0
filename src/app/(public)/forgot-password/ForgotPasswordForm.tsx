'use client';
import { useState } from 'react';
import { Input, Button } from '../../../components/ui';

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  }
  if (sent) {
    return <p>Check your email for a reset link.</p>;
  }
  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit">Send reset link</Button>
    </form>
  );
}
