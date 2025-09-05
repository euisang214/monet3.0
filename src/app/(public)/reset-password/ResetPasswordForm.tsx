'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Button } from '../../../components/ui';

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setDone(true);
  }
  if (!token) {
    return <p>Invalid reset link.</p>;
  }
  if (done) {
    return <p>Password updated. You can now log in.</p>;
  }
  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Input
        type="password"
        name="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit">Reset Password</Button>
    </form>
  );
}
