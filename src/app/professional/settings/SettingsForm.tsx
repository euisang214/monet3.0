'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Card, Button, Input, Select } from '../../../components/ui';
import StripeSection from './StripeSection';
import { timezones } from '../../../lib/timezones';

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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    verified: false,
  });
  const [initial, setInitial] = useState<SettingsData>(form);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/professional/settings');
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setInitial(data);
      }
    }
    load();
  }, []);

  const handleChange = (field: keyof SettingsData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await fetch('/api/professional/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, timezone: form.timezone }),
    });
    setInitial(form);
    alert('Settings saved');
  };

  const handleCancel = () => setForm(initial);

  const handleDelete = async () => {
    const res = await fetch('/api/professional/settings', { method: 'DELETE' });
    if (res.ok) {
      await signOut({ redirectTo: '/' });
    } else {
      alert('Failed to delete account');
    }
  };

  return (
    <div className="grid grid-2">
      <Card className="col" style={{ padding: 16 }}>
        <h3>Account</h3>
        <label>Name</label>
        <Input value={form.name} onChange={e => handleChange('name', e.target.value)} />
        <label>Email</label>
        <Input value={form.email} onChange={e => handleChange('email', e.target.value)} />
        <label>Timezone</label>
        <Select value={form.timezone} onChange={e => handleChange('timezone', e.target.value)}>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="muted" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Account
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

