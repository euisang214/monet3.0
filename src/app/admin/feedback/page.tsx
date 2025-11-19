import { auth } from "@/auth";
import DashboardClient from "@/components/dashboard/DashboardClient";
import FeedbackActions from "@/components/admin/FeedbackActions";
import { prisma } from "@/lib/core/db";
import { QCStatus } from "@prisma/client";
import { formatDateTime } from "@/lib/utils/date";
import { formatFullName } from "@/lib/shared/settings";
import type { CSSProperties } from "react";

function statusStyle(status: QCStatus): CSSProperties {
  switch (status) {
    case "passed":
      return { backgroundColor: "var(--success)", color: "white" };
    case "revise":
      return { backgroundColor: "var(--warning)", color: "black" };
    case "failed":
      return { backgroundColor: "var(--danger)", color: "white" };
    default:
      return { backgroundColor: "var(--muted)", color: "var(--text-muted)" };
  }
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return <p>Access denied</p>;
  }

  const page = Number(searchParams.page) || 1;
  const perPage = 20;

  // Filter by QC status if provided
  const statusFilter = searchParams.Status as QCStatus | undefined;
  const where = statusFilter ? { qcStatus: statusFilter } : {};

  const [feedback, total] = await Promise.all([
    prisma.callFeedback.findMany({
      where,
      include: {
        booking: {
          include: {
            professional: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            candidate: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.callFeedback.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const rows = feedback.map((f) => {
    const proName = formatFullName(
      f.booking.professional.firstName,
      f.booking.professional.lastName
    ) || f.booking.professional.email;
    const candName = formatFullName(
      f.booking.candidate.firstName,
      f.booking.candidate.lastName
    ) || f.booking.candidate.email;

    return {
      bookingId: f.bookingId.slice(0, 8) + "...",
      professional: proName,
      candidate: candName,
      wordCount: String(f.wordCount),
      actions: String(f.actions.length),
      avgRating: ((f.contentRating + f.deliveryRating + f.valueRating) / 3).toFixed(1),
      submittedAt: formatDateTime(f.submittedAt),
      qcStatus: (
        <span className="badge" style={statusStyle(f.qcStatus)}>
          {f.qcStatus}
        </span>
      ),
      manage: (
        <FeedbackActions
          bookingId={f.bookingId}
          currentStatus={f.qcStatus}
        />
      ),
    };
  });

  const columns = [
    { key: "bookingId", label: "Booking ID" },
    { key: "professional", label: "Professional" },
    { key: "candidate", label: "Candidate" },
    { key: "wordCount", label: "Words" },
    { key: "actions", label: "Actions" },
    { key: "avgRating", label: "Avg Rating" },
    { key: "submittedAt", label: "Submitted" },
    { key: "qcStatus", label: "QC Status" },
    { key: "manage", label: "Manage" },
  ];

  const filterOptions = {
    Status: ["passed", "revise", "failed", "missing"],
  };

  return (
    <section className="col" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Feedback QC Management</h2>
        <a
          href="/api/admin/export/feedback"
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--primary)",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Export CSV
        </a>
      </div>
      <DashboardClient
        data={rows}
        columns={columns}
        filterOptions={filterOptions}
        initialActive={statusFilter ? { Status: [statusFilter] } : {}}
        page={page}
        totalPages={totalPages}
      />
    </section>
  );
}
