import Link from "next/link";
import DashboardClient from "../../../components/DashboardClient";
import { Button, Badge } from "../../../components/ui";
import { auth } from "@/auth";
import { getProfessionalRequests } from "../../api/professional/requests";

export default async function Requests() {
  const session = await auth();
  if (!session?.user) return null;

  const requests = await getProfessionalRequests(session.user.id);

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
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <Button style={{ backgroundColor: "green", color: "white" }}>Accept</Button>
        <Button variant="danger">Reject</Button>
        <Link href={`/candidate/detail/${candidate.id}`}>
          <Button variant="primary">View Details</Button>
        </Link>
      </div>
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
      <DashboardClient data={rows} columns={columns} showFilters={false} />
    </section>
  );
}

