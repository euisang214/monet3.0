import { auth } from "@/auth";
import HistoricalFeedback from "@/components/feedback/HistoricalFeedback";
import QCRecheckButton from "@/components/feedback/QCRecheckButton";
import { notFound, redirect } from "next/navigation";
import { CallFeedback } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { formatFullName } from "@/lib/shared/settings";

export default async function ProfessionalHistoryPage({
  params,
}: {
  params: { bookingId: string };
}) {
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
      candidate: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      } | null;
    };
  };
  const feedback: FeedbackResponse = await res.json();

  const candidate = feedback.booking.candidate;
  const heading = formatFullName(candidate.firstName, candidate.lastName) || candidate.email;

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>{heading}</h2>
      <QCRecheckButton bookingId={params.bookingId} qcStatus={feedback.qcStatus} />
      <HistoricalFeedback feedback={feedback} />
    </section>
  );
}
