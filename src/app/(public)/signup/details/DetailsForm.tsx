'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Select } from '../../../../components/ui';

export default function DetailsForm({ initialRole }: { initialRole: 'CANDIDATE' | 'PROFESSIONAL' }) {
  const [role, setRole] = useState<'CANDIDATE' | 'PROFESSIONAL'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body: any = {
      role,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
    };
    if (role === 'CANDIDATE') {
      body.resumeUrl = formData.get('resumeUrl') || undefined;
      body.interests = formData.get('interests') || '';
      body.activities = formData.get('activities') || '';
    } else {
      body.employer = formData.get('employer');
      body.title = formData.get('title');
      body.bio = formData.get('bio');
      body.priceUSD = Number(formData.get('priceUSD'));
    }
    setLoading(true);
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      if (role === 'PROFESSIONAL' && data?.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        router.push(role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard');
      }
    } else {
      setError(data?.error || 'Failed to save profile');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Select value={role} onChange={(e) => setRole(e.target.value as 'CANDIDATE' | 'PROFESSIONAL')}>
        <option value="CANDIDATE">Candidate</option>
        <option value="PROFESSIONAL">Professional</option>
      </Select>

      <Input name="firstName" placeholder="First name" required />
      <Input name="lastName" placeholder="Last name" required />

      {role === 'CANDIDATE' ? (
        <>
          <Input name="resumeUrl" placeholder="Resume URL" />
          <Input name="interests" placeholder="Interests (comma separated)" />
          <Input name="activities" placeholder="Activities (comma separated)" />
        </>
      ) : (
        <>
          <Input name="employer" placeholder="Employer" required />
          <Input name="title" placeholder="Title" required />
          <textarea name="bio" placeholder="Bio" className="input" required />
          <Input name="priceUSD" type="number" placeholder="Price USD" required />
        </>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit" disabled={loading}>Continue</Button>
    </form>
  );
}

