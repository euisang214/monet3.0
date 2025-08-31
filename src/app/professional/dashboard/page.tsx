import { Card } from "../../../components/ui";
import DashboardClient from "../../../components/DashboardClient";
import { auth } from "@/auth";
import { getProfessionalDashboardData } from "../../api/professional/dashboard";
import { format } from "date-fns";

export default async function ProDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const { upcoming, stats } = await getProfessionalDashboardData(
    session.user.id
  );

  const rows = upcoming.map((b) => ({
    candidate: b.candidate.email,
    date: format(b.startAt, "yyyy-MM-dd"),
    time: format(b.startAt, "hh:mm a"),
    action: b.zoomJoinUrl ? { label: "Join", href: b.zoomJoinUrl } : "",
  }));

  const columns = [
    { key: "candidate", label: "Candidate" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "action", label: "" },
  ];

  return (
    <div className="grid grid-2">
      <DashboardClient
        data={rows}
        columns={columns}
        showFilters={false}
        buttonColumns={["action"]}
      />
      <Card style={{ padding: 16 }}>
        <div className="grid grid-2">
          <div className="card" style={{ padding: 16 }}>
            <h4>Total Earnings</h4>
            <div style={{ fontSize: 24 }}>
              {'$'}{(stats.totalEarnings / 100).toFixed(2)}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Response Rate</h4>
            <div style={{ fontSize: 24 }}>{stats.responseRate}%</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Recent Earnings</h4>
            <div>{'$'}{(stats.recentEarnings / 100).toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Recent Feedback</h4>
            <p>{stats.recentFeedback ?? "No feedback yet."}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

