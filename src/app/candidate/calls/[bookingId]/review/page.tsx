import { auth } from "@/auth";
import { prisma } from "@/lib/core/db";
import { notFound, redirect } from "next/navigation";
import { formatFullName } from "@/lib/shared/settings";
import ReviewForm from "@/components/bookings/ReviewForm";
import { Card } from "@/components/ui/ui";
import Link from "next/link";

export default async function ReviewPage({ params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      professional: {
        select: {
          firstName: true,
          lastName: true,
          professionalProfile: {
            select: { title: true, employer: true },
          },
        },
      },
      professionalRating: true,
    },
  });

  if (!booking) {
    notFound();
  }

  // Only the candidate who booked can review
  if (booking.candidateId !== session.user.id) {
    notFound();
  }

  const professionalName = formatFullName(
    booking.professional.firstName,
    booking.professional.lastName
  );
  const profile = booking.professional.professionalProfile;
  const titleEmployer = profile
    ? `${profile.title} @ ${profile.employer}`
    : undefined;

  // Check if booking is completed
  if (booking.status !== "completed") {
    return (
      <section className="col" style={{ gap: 16 }}>
        <h2>Leave a Review</h2>
        <Card style={{ padding: 16 }}>
          <p>You can only leave a review after the call is completed.</p>
          <p>Current status: {booking.status}</p>
          <Link href="/candidate/calls">Back to Calls</Link>
        </Card>
      </section>
    );
  }

  // Check if review already exists
  if (booking.professionalRating) {
    return (
      <section className="col" style={{ gap: 16 }}>
        <h2>Review Submitted</h2>
        <Card style={{ padding: 16 }}>
          <p>You have already submitted a review for this call.</p>
          <div style={{ marginTop: 16 }}>
            <strong>Your rating:</strong>{" "}
            {"\u2605".repeat(booking.professionalRating.rating)}
            {"\u2606".repeat(5 - booking.professionalRating.rating)}
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Your review:</strong>
            <p>{booking.professionalRating.text}</p>
          </div>
          <Link href="/candidate/calls">Back to Calls</Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Leave a Review</h2>
      <Card style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{professionalName}</h3>
          {titleEmployer && (
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)" }}>
              {titleEmployer}
            </p>
          )}
        </div>
        <ReviewForm bookingId={params.bookingId} professionalName={professionalName} />
      </Card>
    </section>
  );
}
