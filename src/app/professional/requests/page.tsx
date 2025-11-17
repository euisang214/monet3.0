import DashboardClient from "@/components/dashboard/DashboardClient";
import { Badge } from "@/components/ui/ui";
import RequestActions from "@/components/bookings/RequestActions";
import { auth } from "@/auth";
import { getProfessionalRequests } from "@/lib/professional/requests";

export default async function Requests({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const page = Number(searchParams.page) || 1;
  const perPage = 10;

  const { requests, totalPages } = await getProfessionalRequests(
    session.user.id,
    page,
    perPage
  );

  const rows = requests.map((r) => {
    const candidate = r.candidate;
    const profile = candidate.candidateProfile;
    const name = `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() ||
      candidate.email;
    const school = profile?.education?.[0]?.school ?? "";
    const interests = (
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {(profile?.interests ?? []).map((i) => (
          <Badge key={i}>{i}</Badge>
        ))}
      </div>
    );
    const activities = (
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {(profile?.activities ?? []).map((a) => (
          <Badge key={a}>{a}</Badge>
        ))}
      </div>
    );
    const action = (
      <RequestActions bookingId={r.id} candidateId={candidate.id} />
    );
    return { name, school, interests, activities, action };
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "school", label: "School" },
    { key: "interests", label: "Interests" },
    { key: "activities", label: "Activities" },
    { key: "action", label: "" },
  ];

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Requests</h2>
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

