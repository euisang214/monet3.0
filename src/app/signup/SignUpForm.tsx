'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Input, Button } from '../../components/ui';

export default function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (res.ok) {
      await signIn('credentials', { email, password, callbackUrl: '/candidate/dashboard' });
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || 'Failed to sign up');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit" disabled={loading}>Create Account</Button>
      <Button type="button" onClick={() => signIn('google')} variant="muted">Sign up with Google</Button>
      <Button type="button" onClick={() => signIn('linkedin')} variant="muted">Sign up with LinkedIn</Button>
    </form>
  );
}
