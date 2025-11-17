import { auth } from "@/auth";
import DashboardClient from "../../../components/DashboardClient";
import { getPastCalls } from "@/lib/shared/bookings/history";
import { formatDateTime } from "../../../../lib/date";

export default async function History({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  const page = Number(searchParams.page) || 1;
  const perPage = 10;
  const { calls, totalPages } = session?.user.id
    ? await getPastCalls(session.user.id, page, perPage)
    : { calls: [], totalPages: 1 };

  const rows = calls.map((c) => ({
    title: c.professional.professionalProfile
      ? `${c.professional.professionalProfile.title} at ${c.professional.professionalProfile.employer}`
      : c.professional.email,
    date: formatDateTime(c.startAt),
    action: { label: "View Feedback", href: `/candidate/history/${c.id}` },
  }));

  const columns = [
    { key: "title", label: "Title" },
    { key: "date", label: "Call Date" },
    { key: "action", label: "Actions" },
  ];

  return (
    <DashboardClient
      data={rows}
      columns={columns}
      showFilters={false}
      buttonColumns={["action"]}
      page={page}
      totalPages={totalPages}
    />
  );
}

