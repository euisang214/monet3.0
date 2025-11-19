import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { Card } from "@/components/ui/ui";
import { prisma } from "@/lib/core/db";
import FeedbackForm from "./FeedbackForm";
import { formatFullName } from "@/lib/shared/settings";

export default async function ProvideFeedbackPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      candidate: {
        include: {
          candidateProfile: { include: { education: true } },
        },
      },
    },
  });

  if (!booking || booking.professionalId !== session.user.id) {
    notFound();
  }

  const candidate = booking.candidate;
  const name = formatFullName(candidate.firstName, candidate.lastName);
  const school = candidate.candidateProfile?.education?.[0]?.school;
  const heading = [name || candidate.email, school && `@ ${school}`]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Provide Feedback for {heading}</h2>
      <Card className="col" style={{ padding: 16, gap: 16 }}>
        <FeedbackForm bookingId={params.bookingId} />
      </Card>
    </section>
  );
}
