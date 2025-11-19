import ProfileDetail from '@/components/profile/ProfileDetail';
import { ProfileResponse } from '../../../../types/profile';

export default async function Detail({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch both profile and reviews in parallel
  const [profileRes, reviewsRes] = await Promise.all([
    fetch(`${baseUrl}/api/candidate/professionals/${params.id}`, {
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/candidate/professionals/${params.id}/reviews`, {
      cache: 'no-store',
    }),
  ]);

  if (!profileRes.ok) {
    throw new Error('Failed to load professional profile');
  }
  const profile: ProfileResponse = await profileRes.json();

  // Add reviews to profile if the reviews fetch succeeded
  if (reviewsRes.ok) {
    const reviewsData = await reviewsRes.json();
    profile.reviews = reviewsData.reviews;
    profile.averageRating = reviewsData.averageRating;
    profile.totalReviews = reviewsData.totalReviews;
  }

  return (
    <ProfileDetail
      profile={profile}
      schedulePath={`/candidate/detail/${params.id}/schedule`}
    />
  );
}
