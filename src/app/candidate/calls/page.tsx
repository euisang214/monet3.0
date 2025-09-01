import { auth } from "@/auth";
import DashboardClient from "../../../components/DashboardClient";
import {
  getFilterOptions,
  FilterConfig,
  ActiveFilters,
} from "../../../app/api/filterOptions";
import { prisma } from "../../../../lib/db";
import { BookingStatus } from "@prisma/client";
import type { CSSProperties } from "react";

function statusStyle(status: BookingStatus): CSSProperties {
  switch (status) {
    case "completed":
    case "completed_pending_feedback":
      return { backgroundColor: "var(--accent)", color: "white" };
    case "accepted":
      return { backgroundColor: "var(--success)", color: "white" };
    case "requested":
      return { backgroundColor: "var(--purple)", color: "white" };
    default:
      return { backgroundColor: "var(--muted)", color: "var(--text-muted)" };
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
  const dateFilterLabels = { After: "Start Date", Before: "End Date" };
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
    if (b.candidateId !== session.user.id) return false;
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
    const name = [b.professional.firstName, b.professional.lastName]
      .filter(Boolean)
      .join(" ");
    const daysSince = Math.floor(
      (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      name,
      firm: b.professional.professionalProfile?.employer ?? "",
      title: b.professional.professionalProfile?.title ?? "",
      days: String(daysSince),
      status: (
        <span className="badge" style={statusStyle(b.status)}>
          {b.status}
        </span>
      ),
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
        dateFilters={dateFilters}
        dateFilterLabels={dateFilterLabels}
      />
    </section>
  );
}
