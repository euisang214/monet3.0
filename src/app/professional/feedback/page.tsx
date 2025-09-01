import DashboardClient from "../../../components/DashboardClient";
import { auth } from "@/auth";
import { getProvidedFeedback, getPendingFeedback } from "../../api/professional/feedback";
import { format } from "date-fns";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [provided, pending] = await Promise.all([
    getProvidedFeedback(session.user.id),
    getPendingFeedback(session.user.id),
  ]);

  const providedRows = provided.map((b) => {
    const candidate = b.candidate;
    const name = `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() ||
      candidate.email;
    const edu = candidate.candidateProfile?.education?.[0];
    const education = edu ? `${edu.title} @ ${edu.school}` : "";
    return {
      name,
      education,
      date: format(b.startAt, "MMMM d, yyyy"),
      feedback: { label: "View Feedback", href: `/candidate/history/${b.id}` },
    };
  });

  const pendingRows = pending.map((b) => {
    const candidate = b.candidate;
    const name = `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() ||
      candidate.email;
    const edu = candidate.candidateProfile?.education?.[0];
    const education = edu ? `${edu.title} @ ${edu.school}` : "";
    return {
      name,
      education,
      date: format(b.startAt, "MMMM d, yyyy"),
      feedback: { label: "Provide Feedback", href: `/candidate/history/${b.id}` },
    };
  });

  const providedColumns = [
    { key: "name", label: "Name" },
    { key: "education", label: "Education" },
    { key: "date", label: "Date of Meeting" },
    { key: "feedback", label: "View Feedback" },
  ];

  const pendingColumns = [
    { key: "name", label: "Name" },
    { key: "education", label: "Education" },
    { key: "date", label: "Date of Meeting" },
    { key: "feedback", label: "Provide Feedback" },
  ];

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Provided Feedback</h2>
      <DashboardClient
        data={providedRows}
        columns={providedColumns}
        showFilters={false}
        buttonColumns={["feedback"]}
      />
      <h2>Pending Feedback</h2>
      <DashboardClient
        data={pendingRows}
        columns={pendingColumns}
        showFilters={false}
        buttonColumns={["feedback"]}
      />
    </section>
  );
}

