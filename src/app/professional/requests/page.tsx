import { Card, Button } from "../../../components/ui";
import { auth } from "@/auth";
import { getProfessionalRequests } from "../../api/professional/requests";
import { format } from "date-fns";

export default async function Requests() {
  const session = await auth();
  if (!session?.user) return null;

  const requests = await getProfessionalRequests(session.user.id);

  return (
    <div className="grid grid-2">
      <Card style={{ padding: 16 }}>
        <h3>Requests</h3>
        <div className="col" style={{ gap: 12 }}>
          {requests.map((r) => (
            <div key={r.id} className="row" style={{ justifyContent: 'space-between' }}>
              <div className="col">
                <strong>{r.candidate.email}</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  {format(r.startAt, 'PPpp')}
                </span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Button>Accept</Button>
                <Button variant="muted">Decline</Button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p>No pending requests.</p>}
        </div>
      </Card>
    </div>
  );
}

