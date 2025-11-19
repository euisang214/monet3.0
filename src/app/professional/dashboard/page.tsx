import { Card } from "@/components/ui/ui";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { auth } from "@/auth";
import { getProfessionalDashboardData } from "@/lib/professional/dashboard";
import { format } from "date-fns";
import CancelBookingButton from "@/components/bookings/CancelBookingButton";

export default async function ProDashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const page = Number(searchParams.page) || 1;
  const perPage = 10;

  const { upcoming, stats, totalPages } = await getProfessionalDashboardData(
    session.user.id,
    page,
    perPage
  );

  const rows = upcoming.map((b) => ({
    candidate: b.candidate.email,
    date: format(b.startAt, "yyyy-MM-dd"),
    time: format(b.startAt, "hh:mm a"),
    action: b.zoomJoinUrl ? { label: "Join", href: b.zoomJoinUrl } : "",
    cancel: (
      <CancelBookingButton
        bookingId={b.id}
        startAt={b.startAt}
        status={b.status}
        variant="inline"
      />
    ),
  }));

  const columns = [
    { key: "candidate", label: "Candidate" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "action", label: "Zoom" },
    { key: "cancel", label: "" },
  ];

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Upcoming Calls</h2>
      <DashboardClient
        data={rows}
        columns={columns}
        showFilters={false}
        buttonColumns={["action"]}
        page={page}
        totalPages={totalPages}
      />
      <div className="grid grid-2">
        <Card style={{ padding: 16 }}>
          <h4>Total Earnings</h4>
          <div style={{ fontSize: 24 }}>
            {'$'}{(stats.totalEarnings / 100).toFixed(2)}
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <h4>Response Rate</h4>
          <div style={{ fontSize: 24 }}>{stats.responseRate}%</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <h4>Recent Earnings</h4>
          <div>{'$'}{(stats.recentEarnings / 100).toFixed(2)}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <h4>Recent Feedback</h4>
          <p>{stats.recentFeedback ?? "No feedback yet."}</p>
        </Card>
      </div>
    </section>
  );
}

