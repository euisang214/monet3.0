import { headers } from 'next/headers';
import ProfileDetail from '@/components/profile/ProfileDetail';
import { ProfileResponse } from '../../../../types/profile';

export default async function Detail({ params }: { params: { id: string } }) {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const res = await fetch(`${protocol}://${host}/api/candidate/profile/${params.id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load candidate profile');
  }
  const profile: ProfileResponse = await res.json();
  return <ProfileDetail profile={profile} />;
}
