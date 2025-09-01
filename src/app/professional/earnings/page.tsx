import { Card } from "../../../components/ui";
import { auth } from "@/auth";
import { getProfessionalEarnings } from "../../api/professional/earnings";
import { format } from "date-fns";

export default async function Earnings() {
  const session = await auth();
  if (!session?.user) return null;

  const { stats, payments } = await getProfessionalEarnings(session.user.id);

  return (
    <Card style={{ padding: 16 }}>
      <h2>Earnings</h2>
      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h4>Total Earnings</h4>
          <div style={{ fontSize: 24 }}>{'$'}{(stats.total / 100).toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h4>Current Month</h4>
          <div style={{ fontSize: 24 }}>{'$'}{(stats.currentMonth / 100).toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h4>Pending Payouts</h4>
          <div style={{ fontSize: 24 }}>{'$'}{(stats.pending / 100).toFixed(2)}</div>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{format(p.createdAt, 'MMMM d, yyyy')}</td>
              <td>Expert Call with {p.booking.candidate.email}</td>
              <td>+{'$'}{((p.amountGross - p.platformFee) / 100).toFixed(2)}</td>
              <td>{p.status === 'released' ? 'Completed' : p.status === 'held' ? 'Pending' : p.status}</td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={4}>No earnings yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

