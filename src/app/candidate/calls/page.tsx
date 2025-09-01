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
import { formatDateTime } from "../../../../lib/date";

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

  const page = Number(searchParams.page) || 1;
  const perPage = 10;

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

  const where: any = { candidateId: session.user.id };
  if (active.Status?.length) {
    where.status = { in: active.Status as BookingStatus[] };
  }
  if (afterDate || beforeDate) {
    where.startAt = {};
    if (afterDate) where.startAt.gte = afterDate;
    if (beforeDate) where.startAt.lte = beforeDate;
  }
  if (active.Title?.length || active.Firm?.length) {
    where.professional = {
      professionalProfile: {
        ...(active.Title?.length ? { title: { in: active.Title } } : {}),
        ...(active.Firm?.length ? { employer: { in: active.Firm } } : {}),
      },
    };
  }

  const [filterOptions, bookings, total] = await Promise.all([
    getFilterOptions(filterConfig),
    prisma.booking.findMany({
      where,
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
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const rows = bookings.map((b) => {
    const name = [b.professional.firstName, b.professional.lastName]
      .filter(Boolean)
      .join(" ");
    const daysSince = Math.floor(
      (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const callDate = new Date(b.startAt);
    const hasHappened = callDate.getTime() <= Date.now();
    return {
      name,
      firm: b.professional.professionalProfile?.employer ?? "",
      title: b.professional.professionalProfile?.title ?? "",
      days: String(daysSince),
      date: { label: formatDateTime(callDate) },
      status: (
        <span className="badge" style={statusStyle(b.status)}>
          {b.status}
        </span>
      ),
      feedback: hasHappened
        ? { label: "View Feedback", href: `/candidate/history/${b.id}` }
        : { label: "View Feedback", variant: "muted", disabled: true },
    };
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "firm", label: "Firm" },
    { key: "title", label: "Title" },
    { key: "days", label: "Days Since Requested" },
    { key: "date", label: "Date of Call" },
    { key: "status", label: "Status" },
    { key: "feedback", label: "View Feedback" },
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
        buttonColumns={["feedback"]}
        page={page}
        totalPages={totalPages}
      />
    </section>
  );
}
