import { Card } from "../../../components/ui";
import { auth } from "@/auth";
import { getProfessionalFeedback } from "../../api/professional/feedback";
import { format } from "date-fns";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) return null;

  const feedback = await getProfessionalFeedback(session.user.id);

  return (
    <Card style={{ padding: 16 }}>
      <h2>Feedback</h2>
      <div className="col" style={{ gap: 12 }}>
        {feedback.map((f) => (
          <div key={f.bookingId} className="card" style={{ padding: 16 }}>
            <strong>{f.booking.candidate.email}</strong>
            <span style={{ color: 'var(--text-muted)' }}>
              {format(f.submittedAt, 'MMMM d, yyyy')}
            </span>
            <div>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
            <p>{f.text}</p>
          </div>
        ))}
        {feedback.length === 0 && <p>No feedback yet.</p>}
      </div>
    </Card>
  );
}

