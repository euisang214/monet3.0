import ProfileDetail from '@/components/profile/ProfileDetail';
import { ProfileResponse } from '../../../../types/profile';

export default async function Detail({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/candidate/professionals/${params.id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load professional profile');
  }
  const profile: ProfileResponse = await res.json();
  return (
    <ProfileDetail
      profile={profile}
      schedulePath={`/candidate/detail/${params.id}/schedule`}
    />
  );
}
