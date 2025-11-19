import { auth } from "@/auth";
import DashboardClient from "../../../components/DashboardClient";
import {
  getFilterOptions,
  FilterConfig,
  ActiveFilters,
} from '@/lib/utils/filterOptions';
import { prisma } from "@/lib/core/db";
import { BookingStatus } from "@prisma/client";
import type { CSSProperties } from "react";
import { formatDateTime } from "@/lib/utils/date";
import { formatFullName } from "@/lib/shared/settings";
import CancelButton from "@/components/bookings/CancelButton";

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

function cleanStatus(str : String) {
  return str
    .replace(`completed_pending_feedback`, "Pending Feedback")
    // Replace underscores with spaces
    .replace(/_/g, " ")
    // Split into words
    .split(" ")
    // Capitalize each word and join
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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
        callFeedback: { select: { bookingId: true } },
        professionalRating: { select: { bookingId: true } },
      },
      orderBy: { startAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const rows = bookings.map((b) => {
    const name = formatFullName(b.professional.firstName, b.professional.lastName);
    const daysSince = Math.floor(
      (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const callDateLabel =
      b.status === BookingStatus.requested ? "" : formatDateTime(b.startAt);
    const hasFeedback = Boolean(b.callFeedback);
    const hasReview = Boolean(b.professionalRating);
    const canReview = b.status === BookingStatus.completed && !hasReview;
    const canCancel = b.status === BookingStatus.requested || b.status === BookingStatus.accepted;
    return {
      name,
      firm: b.professional.professionalProfile?.employer ?? "",
      title: b.professional.professionalProfile?.title ?? "",
      days: String(daysSince),
      date: { label: callDateLabel },
      status: (
        <span className="badge" style={statusStyle(b.status)}>
          {cleanStatus(b.status)}
        </span>
      ),
      feedback: hasFeedback
        ? { label: "View Feedback", href: `/candidate/calls/${b.id}/feedback` }
        : { label: "View Feedback", variant: "muted", disabled: true },
      review: canReview
        ? { label: "Leave Review", href: `/candidate/calls/${b.id}/review` }
        : hasReview
        ? { label: "Reviewed", variant: "muted", disabled: true }
        : null,
      cancel: canCancel ? (
        <CancelButton bookingId={b.id} role="candidate" startAt={b.startAt} />
      ) : null,
    };
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "firm", label: "Firm" },
    { key: "title", label: "Title" },
    { key: "days", label: "Days Since Requested" },
    { key: "date", label: "Date of Call" },
    { key: "status", label: "Status" },
    { key: "feedback", label: "Feedback" },
    { key: "review", label: "Review" },
    { key: "cancel", label: "" },
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
        buttonColumns={["feedback", "review"]}
        page={page}
        totalPages={totalPages}
      />
    </section>
  );
}
