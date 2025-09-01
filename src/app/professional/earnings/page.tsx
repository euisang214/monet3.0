import { Card } from "../../../components/ui";
import DashboardClient from "../../../components/DashboardClient";
import { auth } from "@/auth";
import { getProfessionalEarnings } from "../../api/professional/earnings";
import { format } from "date-fns";

export default async function Earnings({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const page = Number(searchParams.page) || 1;
  const perPage = 10;

  const { stats, payments, totalPages } = await getProfessionalEarnings(
    session.user.id,
    page,
    perPage
  );

  const rows = payments.map((p) => ({
    date: format(p.createdAt, "MMMM d, yyyy"),
    description: `Expert Call with ${p.booking.candidate.email}`,
    amount: `+$${((p.amountGross - p.platformFee) / 100).toFixed(2)}`,
    status:
      p.status === "released"
        ? "Completed"
        : p.status === "held"
        ? "Pending"
        : p.status,
  }));

  const columns = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
  ];

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Earnings</h2>
      <Card style={{ padding: 16 }}>
        <div className="grid grid-3" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <h4>Total Earnings</h4>
            <div style={{ fontSize: 24 }}>{"$"}{(stats.total / 100).toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Current Month</h4>
            <div style={{ fontSize: 24 }}>{"$"}{(stats.currentMonth / 100).toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Pending Payouts</h4>
            <div style={{ fontSize: 24 }}>{"$"}{(stats.pending / 100).toFixed(2)}</div>
          </div>
        </div>
      </Card>
      <DashboardClient
        data={rows}
        columns={columns}
        showFilters={false}
        page={page}
        totalPages={totalPages}
      />
    </section>
  );
}

