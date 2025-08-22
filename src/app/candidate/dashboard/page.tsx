import Link from "next/link";
import { CandidateShell } from "../../../components/layouts";
import { Card, Button, Badge, DataTable } from "../../../components/ui";

const upcoming = [
  { name: "Ethan Harper", title: "Senior Consultant at Global Consulting Firm" },
  { name: "Olivia Bennett", title: "Finance Manager at Tech Innovators Inc." },
  { name: "Noah Carter", title: "Independent Strategy Advisor" },
  { name: "Ava Morgan", title: "Principal at Investment Group" },
  { name: "Liam Foster", title: "Consulting Partner at Top Tier Firm" },
];

const filters = ["Industry", "Firm", "Experience Level", "Availability"];

const results = [
  {
    id: 1,
    name: "Ethan Harper",
    title: "Senior Consultant at Global Consulting Firm",
    experience: "5+ years",
    availability: "Weekdays",
  },
  {
    id: 2,
    name: "Olivia Bennett",
    title: "Finance Manager at Tech Innovators Inc.",
    experience: "8+ years",
    availability: "Weekends",
  },
  {
    id: 3,
    name: "Noah Carter",
    title: "Independent Strategy Advisor",
    experience: "10+ years",
    availability: "Evenings",
  },
  {
    id: 4,
    name: "Ava Morgan",
    title: "Principal at Investment Group",
    experience: "7+ years",
    availability: "Flexible",
  },
  {
    id: 5,
    name: "Liam Foster",
    title: "Consulting Partner at Top Tier Firm",
    experience: "12+ years",
    availability: "Weekdays",
  },
];

export default function CandidateDashboard() {
  return (
    <CandidateShell>
      <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
        <aside style={{ width: 260 }}>
          <Card className="col" style={{ padding: 16 }}>
            <h3>Upcoming Calls</h3>
            <div className="col" style={{ gap: 12 }}>
              {upcoming.map((u) => (
                <div
                  key={u.name}
                  className="row"
                  style={{ justifyContent: "space-between" }}
                >
                  <div className="col" style={{ gap: 2 }}>
                    <strong>{u.name}</strong>
                    <span style={{ color: "var(--text-muted)" }}>{u.title}</span>
                  </div>
                  <Button>Join</Button>
                </div>
              ))}
            </div>
          </Card>
        </aside>
        <section className="col" style={{ gap: 16, flex: 1 }}>
          <h2>Search Results</h2>
          <p style={{ color: "var(--text-muted)" }}>
            Showing results for your search criteria
          </p>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {filters.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
          <Card style={{ padding: 0 }}>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "title", label: "Title" },
                { key: "experience", label: "Experience" },
                { key: "availability", label: "Availability" },
                { key: "action", label: "" },
              ]}
              rows={results.map((r) => ({
                ...r,
                action: (
                  <Link href={`/candidate/detail/${r.id}`}>View Profile</Link>
                ),
              }))}
            />
          </Card>
        </section>
      </div>
    </CandidateShell>
  );
}
