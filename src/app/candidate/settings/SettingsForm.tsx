'use client';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Card, Button, Input, Select } from "@/components/ui/ui";
import { timezones } from '@/lib/utils/timezones';
import ResumePreview from '@/components/profile/ResumePreview';
import AvailabilityTimes, { AvailabilityRange } from './AvailabilityTimes';

interface SettingsData {
  name: string;
  email: string;
  resumeUrl?: string | null;
  timezone: string;
}

interface Notifications {
  feedbackReceived: boolean;
  chatScheduled: boolean;
}

export default function SettingsForm() {
  const [form, setForm] = useState<SettingsData>({ name: '', email: '', resumeUrl: null, timezone: '' });
  const [initialForm, setInitialForm] = useState<SettingsData>({ name: '', email: '', resumeUrl: null, timezone: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [busyRanges, setBusyRanges] = useState<AvailabilityRange[]>([]);
  const [initialBusyRanges, setInitialBusyRanges] = useState<AvailabilityRange[]>([]);
  const [notifications, setNotifications] = useState<Notifications>({
    feedbackReceived: true,
    chatScheduled: true,
  });
  const [initialNotifications, setInitialNotifications] = useState<Notifications>({
    feedbackReceived: true,
    chatScheduled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/candidate/settings');
        if (res.ok) {
          const data = await res.json();
          setForm({ name: data.name, email: data.email, resumeUrl: data.resumeUrl, timezone: data.timezone });
          setInitialForm({ name: data.name, email: data.email, resumeUrl: data.resumeUrl, timezone: data.timezone });
          const defaults = data.defaultBusy || [];
          setBusyRanges(defaults);
          setInitialBusyRanges(defaults);
          setNotifications(data.notifications || { feedbackReceived: true, chatScheduled: true });
          setInitialNotifications(data.notifications || { feedbackReceived: true, chatScheduled: true });
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || data.message || 'Failed to load settings');
        }
      } catch (err) {
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (field: keyof SettingsData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('timezone', form.timezone);
      fd.append('notifications', JSON.stringify(notifications));
      fd.append('defaultBusy', JSON.stringify(busyRanges));
      if (resumeFile) fd.append('resume', resumeFile);
      const res = await fetch('/api/candidate/settings', { method: 'PUT', body: fd });
      if (res.ok) {
        const data = await res.json();
        setForm({ name: data.name, email: data.email, resumeUrl: data.resumeUrl, timezone: data.timezone });
        setInitialForm({ name: data.name, email: data.email, resumeUrl: data.resumeUrl, timezone: data.timezone });
        const defaults = data.defaultBusy || [];
        setBusyRanges(defaults);
        setInitialBusyRanges(defaults);
        setNotifications(data.notifications || { feedbackReceived: true, chatScheduled: true });
        setInitialNotifications(data.notifications || { feedbackReceived: true, chatScheduled: true });
        setResumeFile(null);
        setSuccess('Settings saved successfully');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Failed to save settings. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setBusyRanges(initialBusyRanges);
    setNotifications(initialNotifications);
    setResumeFile(null);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/candidate/settings', { method: 'DELETE' });
      if (res.ok) {
        await signOut({ redirectTo: '/' });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Failed to delete account. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="col" style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-2">
      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--error)', padding: '8px 12px', background: 'var(--error-bg, #fee2e2)', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: 12 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--success, #166534)', padding: '8px 12px', background: 'var(--success-bg, #dcfce7)', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: 12 }}>
          {success}
        </div>
      )}
      <Card className="col" style={{ padding: 16 }}>
        <h3>Account</h3>
        <label>Name</label>
        <Input value={form.name} onChange={e => handleChange('name', e.target.value)} disabled={saving} />
        <label>Email</label>
        <Input value={form.email} onChange={e => handleChange('email', e.target.value)} disabled={saving} />
        <label>Timezone</label>
        <Select value={form.timezone} onChange={e => handleChange('timezone', e.target.value)} required disabled={saving}>
          <option value="" disabled>Select timezone</option>
          {timezones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </Select>
        <label>Resume Upload</label>
        <Input type="file" onChange={e => setResumeFile(e.target.files?.[0] || null)} disabled={saving} />
        {form.resumeUrl && (
          <>
            <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer">
              Download Current Resume
            </a>
            <ResumePreview url={form.resumeUrl} />
          </>
        )}
        <label>Password</label>
        <Input type="password" defaultValue="***************" disabled={saving} />
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <Button onClick={handleSave} disabled={saving || deleting}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="muted" onClick={handleCancel} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving || deleting}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </Card>
      <Card className="col" style={{ padding: 16 }}>
        <h3>Notifications</h3>
        <div className="col">
          <label>
            <input
              type="checkbox"
              checked={notifications.feedbackReceived}
              onChange={e =>
                setNotifications(prev => ({ ...prev, feedbackReceived: e.target.checked }))
              }
            />{' '}
            Feedback Received
          </label>
          <label>
            <input
              type="checkbox"
              checked={notifications.chatScheduled}
              onChange={e =>
                setNotifications(prev => ({ ...prev, chatScheduled: e.target.checked }))
              }
            />{' '}
            Chat Scheduled
          </label>
        </div>
      </Card>
      <Card className="col" style={{ padding: 16 }}>
        <AvailabilityTimes ranges={busyRanges} onChange={setBusyRanges} />
      </Card>
    </div>
  );
}

