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

  useEffect(() => {
    async function load() {
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
      }
    }
    load();
  }, []);

  const handleChange = (field: keyof SettingsData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
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
      alert('Settings saved');
    } else {
      alert('Failed to save settings');
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setBusyRanges(initialBusyRanges);
    setNotifications(initialNotifications);
    setResumeFile(null);
  };

  const handleDelete = async () => {
    const res = await fetch('/api/candidate/settings', { method: 'DELETE' });
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
        <Select value={form.timezone} onChange={e => handleChange('timezone', e.target.value)} required>
          <option value="" disabled>Select timezone</option>
          {timezones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </Select>
        <label>Resume Upload</label>
        <Input type="file" onChange={e => setResumeFile(e.target.files?.[0] || null)} />
        {form.resumeUrl && (
          <>
            <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer">
              Download Current Resume
            </a>
            <ResumePreview url={form.resumeUrl} />
          </>
        )}
        <label>Password</label>
        <Input type="password" defaultValue="***************" />
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

