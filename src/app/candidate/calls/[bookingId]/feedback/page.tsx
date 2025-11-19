import { auth } from "@/auth";
import HistoricalFeedback from "@/components/feedback/HistoricalFeedback";
import ReviewForm from "@/components/feedback/ReviewForm";
import { notFound, redirect } from "next/navigation";
import { CallFeedback } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { formatFullName } from "@/lib/shared/settings";
import { prisma } from "@/lib/core/db";

export default async function FeedbackPage({ params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const headersList = headers();
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const host = headersList.get("host") || "localhost:3000";
  const res = await fetch(`${protocol}://${host}/api/professional/feedback/${params.bookingId}`, {
    cache: "no-store",
    headers: {
      cookie: cookies().toString(),
    },
  });
  if (res.status === 401) redirect("/login");
  if (res.status === 404 || res.status === 403) notFound();
  if (!res.ok) throw new Error("Failed to load feedback");
  type FeedbackResponse = CallFeedback & {
    booking: {
      professional: {
        firstName: string | null;
        lastName: string | null;
        professionalProfile: {
          title: string | null;
          employer: string | null;
        } | null;
      } | null;
    };
  };
  const feedback: FeedbackResponse = await res.json();

  // Check if candidate has already submitted a review
  const existingReview = await prisma.professionalRating.findUnique({
    where: { bookingId: params.bookingId },
  });

  const pro = feedback.booking.professional;
  const name = formatFullName(pro.firstName, pro.lastName);
  const profile = pro.professionalProfile;
  const titleEmployer = profile
    ? `${profile.title} @ ${profile.employer}`
    : undefined;
  const heading = [name, titleEmployer].filter(Boolean).join(", ");

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>{heading}</h2>
      <HistoricalFeedback feedback={feedback} />
      <ReviewForm
        bookingId={params.bookingId}
        hasExistingReview={Boolean(existingReview)}
      />
    </section>
  );
}
