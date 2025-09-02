'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Select } from '../../../../components/ui';

export default function DetailsForm({ initialRole }: { initialRole: 'CANDIDATE' | 'PROFESSIONAL' }) {
  const [role, setRole] = useState<'CANDIDATE' | 'PROFESSIONAL'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corporateEmail, setCorporateEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employer, setEmployer] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
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
      body.corporateEmail = corporateEmail;
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

  async function requestVerification() {
    setVerificationError(null);
    setVerifying(true);
    const res = await fetch('/api/verification/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corporateEmail }),
    });
    setVerifying(false);
    if (res.ok) {
      setVerificationSent(true);
    } else {
      const data = await res.json().catch(() => null);
      setVerificationError(data?.error || 'Failed to send verification');
    }
  }

  async function checkVerification() {
    setVerificationError(null);
    setChecking(true);
    const res = await fetch('/api/verification/status', { cache: 'no-store' });
    setChecking(false);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.verified) {
      setEmailVerified(true);
    } else if (!res.ok) {
      setVerificationError('Failed to check verification');
    } else {
      setVerificationError('Email not yet verified');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 12 }}>
      <Select value={role} onChange={(e) => setRole(e.target.value as 'CANDIDATE' | 'PROFESSIONAL')}>
        <option value="CANDIDATE">Candidate</option>
        <option value="PROFESSIONAL">Professional</option>
      </Select>

      <Input
        name="firstName"
        placeholder="First name"
        required
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <Input
        name="lastName"
        placeholder="Last name"
        required
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      {role === 'CANDIDATE' ? (
        <>
          <Input name="resumeUrl" placeholder="Resume URL" />
          <Input name="interests" placeholder="Interests (comma separated)" />
          <Input name="activities" placeholder="Activities (comma separated)" />
        </>
      ) : (
        <>
          <Input
            name="employer"
            placeholder="Employer"
            required
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
          />
          <Input
            name="title"
            placeholder="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            name="bio"
            placeholder="Bio"
            className="input"
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <Input
            name="priceUSD"
            type="number"
            placeholder="Price USD"
            required
            value={priceUSD}
            onChange={(e) => setPriceUSD(e.target.value)}
          />
          <Input
            name="corporateEmail"
            type="email"
            placeholder="Work email"
            required
            value={corporateEmail}
            onChange={(e) => {
              setCorporateEmail(e.target.value);
              setVerificationSent(false);
              setVerificationError(null);
              setEmailVerified(false);
            }}
          />
          <div className="row" style={{ gap: 8 }}>
            <Button
              type="button"
              onClick={requestVerification}
              disabled={!corporateEmail || verifying || emailVerified}
            >
              {emailVerified
                ? 'Email verified'
                : verificationSent
                  ? 'Verification sent'
                  : 'Verify work email'}
            </Button>
            <Button
              type="button"
              onClick={checkVerification}
              disabled={!verificationSent || checking || emailVerified}
            >
              {checking ? 'Checking...' : 'Check status'}
            </Button>
          </div>
          {verificationError && <p style={{ color: 'red' }}>{verificationError}</p>}
        </>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button
        type="submit"
        disabled={
          loading ||
          (role === 'CANDIDATE'
            ? !(firstName && lastName)
            : !(firstName && lastName && employer && title && bio && priceUSD && corporateEmail && emailVerified))
        }
      >
        Continue
      </Button>
    </form>
  );
}

