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
  const [resumeUrl, setResumeUrl] = useState('');
  const [interests, setInterests] = useState<string[]>(['']);
  const [activities, setActivities] = useState<string[]>(['']);
  const [experience, setExperience] = useState<
    { firm: string; title: string; startDate: string; endDate: string }[]
  >([{ firm: '', title: '', startDate: '', endDate: '' }]);
  const [education, setEducation] = useState<
    { school: string; title: string; startDate: string; endDate: string }[]
  >([{ school: '', title: '', startDate: '', endDate: '' }]);
  const router = useRouter();

  const addInterest = () => setInterests([...interests, '']);
  const updateInterest = (i: number, val: string) => {
    const copy = [...interests];
    copy[i] = val;
    setInterests(copy);
  };
  const removeInterest = (i: number) =>
    setInterests(interests.filter((_, idx) => idx !== i));

  const addActivity = () => setActivities([...activities, '']);
  const updateActivity = (i: number, val: string) => {
    const copy = [...activities];
    copy[i] = val;
    setActivities(copy);
  };
  const removeActivity = (i: number) =>
    setActivities(activities.filter((_, idx) => idx !== i));

  const addExperience = () =>
    setExperience([
      ...experience,
      { firm: '', title: '', startDate: '', endDate: '' },
    ]);
  const updateExperience = (
    i: number,
    field: 'firm' | 'title' | 'startDate' | 'endDate',
    val: string,
  ) => {
    const copy = [...experience];
    copy[i] = { ...copy[i], [field]: val };
    setExperience(copy);
  };
  const removeExperience = (i: number) =>
    setExperience(experience.filter((_, idx) => idx !== i));

  const addEducation = () =>
    setEducation([
      ...education,
      { school: '', title: '', startDate: '', endDate: '' },
    ]);
  const updateEducation = (
    i: number,
    field: 'school' | 'title' | 'startDate' | 'endDate',
    val: string,
  ) => {
    const copy = [...education];
    copy[i] = { ...copy[i], [field]: val };
    setEducation(copy);
  };
  const removeEducation = (i: number) =>
    setEducation(education.filter((_, idx) => idx !== i));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body: any = {
      role,
      firstName,
      lastName,
      interests: interests.map((s) => s.trim()),
      activities: activities.map((s) => s.trim()),
      experience: experience.map((e) => ({
        firm: e.firm,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
      education: education.map((e) => ({
        school: e.school,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
    };
    if (role === 'CANDIDATE') {
      body.resumeUrl = resumeUrl || undefined;
    } else {
      body.employer = employer;
      body.title = title;
      body.bio = bio;
      body.priceUSD = Number(priceUSD);
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

  const interestsValid =
    interests.length > 0 && interests.every((s) => s.trim());
  const activitiesValid =
    activities.length > 0 && activities.every((s) => s.trim());
  const experienceValid =
    experience.length > 0 &&
    experience.every((e) => e.firm && e.title && e.startDate && e.endDate);
  const educationValid =
    education.length > 0 &&
    education.every((e) => e.school && e.title && e.startDate && e.endDate);
  const baseValid =
    firstName &&
    lastName &&
    interestsValid &&
    activitiesValid &&
    experienceValid &&
    educationValid;
  const canSubmit =
    role === 'CANDIDATE'
      ? Boolean(baseValid)
      : Boolean(
          baseValid &&
            employer &&
            title &&
            bio &&
            priceUSD &&
            corporateEmail &&
            emailVerified,
        );
  const submitDisabled = loading || !canSubmit;

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
        <Input
          name="resumeUrl"
          placeholder="Resume URL"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
        />
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

      <div>Interests</div>
      {interests.map((interest, i) => (
        <div key={i} className="row" style={{ gap: 8 }}>
          <Input
            placeholder="Interest"
            required
            value={interest}
            onChange={(e) => updateInterest(i, e.target.value)}
          />
          {interests.length > 1 && (
            <Button type="button" onClick={() => removeInterest(i)}>
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button type="button" onClick={addInterest}>
        Add Interest
      </Button>

      <div>Activities</div>
      {activities.map((activity, i) => (
        <div key={i} className="row" style={{ gap: 8 }}>
          <Input
            placeholder="Activity"
            required
            value={activity}
            onChange={(e) => updateActivity(i, e.target.value)}
          />
          {activities.length > 1 && (
            <Button type="button" onClick={() => removeActivity(i)}>
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button type="button" onClick={addActivity}>
        Add Activity
      </Button>

      <div>Experience</div>
      {experience.map((exp, i) => (
        <div key={i} className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="Firm"
            required
            value={exp.firm}
            onChange={(e) => updateExperience(i, 'firm', e.target.value)}
          />
          <Input
            placeholder="Title"
            required
            value={exp.title}
            onChange={(e) => updateExperience(i, 'title', e.target.value)}
          />
          <Input
            type="date"
            placeholder="Start date"
            required
            value={exp.startDate}
            onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
          />
          <Input
            type="date"
            placeholder="End date"
            required
            value={exp.endDate}
            onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
          />
          {experience.length > 1 && (
            <Button type="button" onClick={() => removeExperience(i)}>
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button type="button" onClick={addExperience}>
        Add Experience
      </Button>

      <div>Education</div>
      {education.map((edu, i) => (
        <div key={i} className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="School"
            required
            value={edu.school}
            onChange={(e) => updateEducation(i, 'school', e.target.value)}
          />
          <Input
            placeholder="Title"
            required
            value={edu.title}
            onChange={(e) => updateEducation(i, 'title', e.target.value)}
          />
          <Input
            type="date"
            placeholder="Start date"
            required
            value={edu.startDate}
            onChange={(e) => updateEducation(i, 'startDate', e.target.value)}
          />
          <Input
            type="date"
            placeholder="End date"
            required
            value={edu.endDate}
            onChange={(e) => updateEducation(i, 'endDate', e.target.value)}
          />
          {education.length > 1 && (
            <Button type="button" onClick={() => removeEducation(i)}>
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button type="button" onClick={addEducation}>
        Add Education
      </Button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button
        type="submit"
        disabled={submitDisabled}
        variant={submitDisabled ? 'muted' : 'primary'}
      >
        Continue
      </Button>
    </form>
  );
}

