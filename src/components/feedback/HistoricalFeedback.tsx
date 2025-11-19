import { CallFeedback } from "@prisma/client";
import { Card } from "@/components/ui";
import { formatDateTime } from "@/lib/utils/date";

export default function HistoricalFeedback({ feedback }: { feedback: CallFeedback }) {
  const extraRatings = feedback.extraCategoryRatings as Record<string, number>;
  return (
    <Card className="col" style={{ padding: 16, gap: 8 }}>
      <p>
        <strong>Submitted:</strong> {formatDateTime(feedback.submittedAt)}
      </p>
      <div>
        <strong>Ratings</strong>
        <ul>
          <li>Content: {feedback.contentRating}/5</li>
          <li>Delivery: {feedback.deliveryRating}/5</li>
          <li>Value: {feedback.valueRating}/5</li>
          {Object.entries(extraRatings).map(([k, v]) => (
            <li key={k}>
              {k}: {v as number}
            </li>
          ))}
        </ul>
      </div>
      {feedback.summary && (
        <div>
          <strong>Summary</strong>
          <p>{feedback.summary}</p>
        </div>
      )}
      <div>
        <strong>Action Items</strong>
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
