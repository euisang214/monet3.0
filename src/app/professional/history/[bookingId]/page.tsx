import { auth } from "@/auth";
import HistoricalFeedback from "../../../../components/HistoricalFeedback";
import { notFound, redirect } from "next/navigation";
import { Feedback } from "@prisma/client";
import { cookies } from "next/headers";

export default async function ProfessionalHistoryPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const res = await fetch(`/api/feedback/${params.bookingId}`, {
    cache: "no-store",
    headers: {
      cookie: cookies().toString(),
    },
  });
  if (res.status === 401) redirect("/login");
  if (res.status === 404 || res.status === 403) notFound();
  if (!res.ok) throw new Error("Failed to load feedback");
  type FeedbackResponse = Feedback & {
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
  const heading =
    `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() ||
    candidate.email;

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>{heading}</h2>
      <HistoricalFeedback feedback={feedback} />
    </section>
  );
}
