'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Card, Button, Input, Select } from "@/components/ui/ui";
import { timezones } from '@/lib/utils/timezones';
import StripeSection from './StripeSection';

interface SettingsData {
  name: string;
  email: string;
  timezone: string;
  verified: boolean;
}

export default function SettingsForm() {
  const [form, setForm] = useState<SettingsData>({
    name: '',
    email: '',
    timezone: '',
    verified: false,
  });
  const [initial, setInitial] = useState<SettingsData>(form);
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
        const res = await fetch('/api/professional/settings');
        if (res.ok) {
          const data = await res.json();
          setForm(data);
          setInitial(data);
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
      const res = await fetch('/api/professional/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, timezone: form.timezone }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setInitial(data);
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
    setForm(initial);
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
      const res = await fetch('/api/professional/settings', { method: 'DELETE' });
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
        <StripeSection />
        <h3>Verification Status</h3>
        <p>{form.verified ? 'Corporate email verified.' : 'Corporate email not yet verified.'}</p>
      </Card>
    </div>
  );
}
