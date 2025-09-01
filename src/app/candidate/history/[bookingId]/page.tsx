import { auth } from "@/auth";
import { prisma } from "../../../../../lib/db";
import { formatDateTime } from "../../../../../lib/date";
import { Card } from "../../../../components/ui";
import { notFound, redirect } from "next/navigation";

export default async function FeedbackPage({ params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const feedback = await prisma.feedback.findUnique({
    where: { bookingId: params.bookingId },
    include: {
      booking: {
        select: {
          candidateId: true,
          professionalId: true,
          professional: {
            select: {
              firstName: true,
              lastName: true,
              professionalProfile: { select: { title: true, employer: true } },
            },
          },
        },
      },
    },
  });

  if (!feedback) {
    notFound();
  }

  if (
    feedback.booking.candidateId !== session.user.id &&
    feedback.booking.professionalId !== session.user.id
  ) {
    notFound();
  }

  const extraRatings = feedback.extraCategoryRatings as Record<string, number>;

  const pro = feedback.booking.professional;
  const name = `${pro.firstName ?? ""} ${pro.lastName ?? ""}`.trim();
  const profile = pro.professionalProfile;
  const titleEmployer = profile
    ? `${profile.title} @ ${profile.employer}`
    : undefined;
  const heading = [name, titleEmployer].filter(Boolean).join(", ");

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>{heading}</h2>
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>
          <strong>Submitted:</strong> {formatDateTime(feedback.submittedAt)}
        </p>
        <div>
          <strong>Ratings</strong>
          <ul>
            <li>Category 1: {feedback.starsCategory1}</li>
            <li>Category 2: {feedback.starsCategory2}</li>
            <li>Category 3: {feedback.starsCategory3}</li>
            {Object.entries(extraRatings).map(([k, v]) => (
              <li key={k}>
                {k}: {v as number}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Summary</strong>
          <ul>
            {feedback.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <p>
          <strong>Written Feedback:</strong>
        </p>
        <p>{feedback.text}</p>
      </Card>
    </section>
  );
}
