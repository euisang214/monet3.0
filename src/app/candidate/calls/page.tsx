import { auth } from "@/auth";
import DashboardClient from "../../../components/DashboardClient";
import {
  getFilterOptions,
  FilterConfig,
  ActiveFilters,
} from "../../../app/api/filterOptions";
import { prisma } from "../../../../lib/db";
import { BookingStatus } from "@prisma/client";

function statusVariant(status: BookingStatus): "primary" | "danger" | "muted" {
  switch (status) {
    case "cancelled":
    case "refunded":
      return "danger";
    case "accepted":
    case "completed":
    case "completed_pending_feedback":
      return "primary";
    default:
      return "muted";
  }
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session?.user.id) return null;

  const filterConfig: FilterConfig = {
    Title: { model: "professionalProfile", field: "title" },
    Firm: { model: "professionalProfile", field: "employer" },
    Status: { model: "booking", field: "status" },
  };

  const dateFilters = ["After", "Before"];
  const active: ActiveFilters = {};
  [...Object.keys(filterConfig), ...dateFilters].forEach((key) => {
    const value = searchParams[key];
    if (value) {
      active[key] = Array.isArray(value)
        ? (value as string[])
        : (value as string).split(",");
    }
  });

  const afterDate = active.After?.[0] ? new Date(active.After[0]) : undefined;
  const beforeDate = active.Before?.[0] ? new Date(active.Before[0]) : undefined;

  const [filterOptions, bookings] = await Promise.all([
    getFilterOptions(filterConfig),
    prisma.booking.findMany({
      where: { candidateId: session.user.id },
      include: {
        professional: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            professionalProfile: { select: { title: true, employer: true } },
          },
        },
      },
      orderBy: { startAt: "desc" },
    }),
  ]);

  const filtered = bookings.filter((b) => {
    if (
      active.Title?.length &&
      !active.Title.includes(b.professional.professionalProfile?.title ?? "")
    )
      return false;
    if (
      active.Firm?.length &&
      !active.Firm.includes(b.professional.professionalProfile?.employer ?? "")
    )
      return false;
    if (active.Status?.length && !active.Status.includes(b.status)) return false;
    if (afterDate && b.startAt < afterDate) return false;
    if (beforeDate && b.startAt > beforeDate) return false;
    return true;
  });

  const rows = filtered.map((b) => {
    const name =
      [b.professional.firstName, b.professional.lastName]
        .filter(Boolean)
        .join(" ") || b.professional.email;
    const daysSince = Math.floor(
      (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      name,
      firm: b.professional.professionalProfile?.employer ?? "",
      title: b.professional.professionalProfile?.title ?? "",
      days: String(daysSince),
      status: { label: b.status, variant: statusVariant(b.status) },
    };
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "firm", label: "Firm" },
    { key: "title", label: "Title" },
    { key: "days", label: "Days Since Requested" },
    { key: "status", label: "Status" },
  ];

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Calls</h2>
      <DashboardClient
        data={rows}
        columns={columns}
        filterOptions={filterOptions}
        initialActive={active}
        buttonColumns={["status"]}
        dateFilters={dateFilters}
      />
    </section>
  );
}
