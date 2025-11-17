import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from "@/lib/core/db";
import { Card } from "@/components/ui/ui";
import DetailsForm from './DetailsForm';

export default async function SignUpDetailsPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      candidateProfile: { select: { userId: true } },
      professionalProfile: { select: { userId: true } },
    },
  });
  if (user?.candidateProfile || user?.professionalProfile) {
    redirect(
      session.user.role === 'PROFESSIONAL'
        ? '/professional/dashboard'
        : '/candidate/dashboard'
    );
  }
  const initialRole =
    searchParams.role === 'PROFESSIONAL' || searchParams.role === 'CANDIDATE'
      ? (searchParams.role as 'CANDIDATE' | 'PROFESSIONAL')
      : (session.user.role as 'CANDIDATE' | 'PROFESSIONAL');

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h1>Complete Your Profile</h1>
      <DetailsForm initialRole={initialRole} />
    </Card>
  );
}

