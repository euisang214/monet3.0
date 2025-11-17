import { Feedback } from "@prisma/client";
import { Card } from "./ui";
import { formatDateTime } from "@/lib/utils/date";

export default function HistoricalFeedback({ feedback }: { feedback: Feedback }) {
  const extraRatings = feedback.extraCategoryRatings as Record<string, number>;
  return (
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
  );
}
