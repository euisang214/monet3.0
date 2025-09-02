'use client';
import { useState } from 'react';
import { signIn, type SignInResponse } from 'next-auth/react';
import { z } from 'zod';
import { Input, Button } from '../../../components/ui';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  async function getCallbackUrl(email: string) {
    const schema = z.string().email();
    if (!email || !schema.safeParse(email).success) return '/signup';
    try {
      const res = await fetch(`/api/auth/role?email=${encodeURIComponent(email)}`);
      if (!res.ok) return '/candidate/dashboard';
      const data = await res.json();
      return data.role === 'PROFESSIONAL'
        ? '/professional/dashboard'
        : '/candidate/dashboard';
    } catch {
      return '/candidate/dashboard';
    }
  }

  async function handleOAuth(provider: 'google' | 'linkedin') {
    const callbackUrl = await getCallbackUrl(email);
    const res = await signIn(provider, {
      callbackUrl,
      redirect: false,
    });
    if (res?.url) {
      window.location.href = res.url;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const emailVal = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const callbackUrl = await getCallbackUrl(emailVal);
    const res: SignInResponse | undefined = await signIn('credentials', {
      email: emailVal,
      password,
      callbackUrl,
      redirect: false,
    });
    if (res?.error) {
      setError('Invalid credentials');
    } else if (res?.url) {
      window.location.href = res.url;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Input
        name="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input name="password" type="password" placeholder="Password" required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit">Log In</Button>
      <Button
        type="button"
        onClick={() => void handleOAuth('google')}
        variant="muted"
      >
        Log in with Google
      </Button>
      <Button
        type="button"
        onClick={() => void handleOAuth('linkedin')}
        variant="muted"
      >
        Log in with LinkedIn
      </Button>
    </form>
  );
}
