'use client';
import { useState } from 'react';
import { signIn, type SignInResponse } from 'next-auth/react';
import { Input, Button } from '../../../components/ui';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const res: SignInResponse | undefined = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/candidate/dashboard',
      redirect: false,
    });
    if (res?.error) {
      setError('Invalid credentials');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit">Log In</Button>
      <Button type="button" onClick={() => signIn('google')} variant="muted">Log in with Google</Button>
      <Button type="button" onClick={() => signIn('linkedin')} variant="muted">Log in with LinkedIn</Button>
    </form>
  );
}
