'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Input, Button, Select } from '../../components/ui';

export default function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'CANDIDATE' | 'PROFESSIONAL' | ''>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value as 'CANDIDATE' | 'PROFESSIONAL';
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    setLoading(false);
    if (res.ok) {
      await signIn('credentials', { email, password, callbackUrl: role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard' });
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || 'Failed to sign up');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as 'CANDIDATE' | 'PROFESSIONAL')}
        required
      >
        <option value="" disabled>Select account type</option>
        <option value="CANDIDATE">Candidate</option>
        <option value="PROFESSIONAL">Professional</option>
      </Select>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit" disabled={loading}>Create Account</Button>
      <Button type="button" onClick={() => signIn('google', { callbackUrl: role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard' })} variant="muted" disabled={!role}>Sign up with Google</Button>
      <Button type="button" onClick={() => signIn('linkedin', { callbackUrl: role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard' })} variant="muted" disabled={!role}>Sign up with LinkedIn</Button>
    </form>
  );
}
