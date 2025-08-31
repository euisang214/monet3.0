import DetailClient from './DetailClient';
import { ProfessionalResponse } from './types';

export default async function Detail({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/professionals/${params.id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load professional profile');
  }
  const pro: ProfessionalResponse = await res.json();
  return <DetailClient pro={pro} />;
}
