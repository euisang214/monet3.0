import { auth } from "@/auth";
import DashboardClient from "../../../components/DashboardClient";
import { getPastCalls } from "../../../app/api/bookings/history";
import { formatDateTime } from "../../../../lib/date";

export default async function History() {
  const session = await auth();
  const calls = session?.user.id ? await getPastCalls(session.user.id) : [];

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
    />
  );
}

