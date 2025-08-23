import Link from "next/link";
import { Card, Button, DataTable } from "../../../components/ui";
import FilterDropdown from "../../../components/FilterDropdown";
import {
  getFilterOptions,
  buildFilterWhere,
  FilterConfig,
} from "../../../app/api/filterOptions";
import { prisma } from "../../../../lib/db";

const upcoming = [
  { name: "Ethan Harper", title: "Senior Consultant at Global Consulting Firm" },
  { name: "Olivia Bennett", title: "Finance Manager at Tech Innovators Inc." },
  { name: "Noah Carter", title: "Independent Strategy Advisor" },
  { name: "Ava Morgan", title: "Principal at Investment Group" },
  { name: "Liam Foster", title: "Consulting Partner at Top Tier Firm" },
];

export default async function CandidateDashboard({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const filterConfig: FilterConfig = {
    Industry: {
      model: "professionalProfile",
      field: "title",
      relation: "professionalProfile",
    },
    Firm: {
      model: "professionalProfile",
      field: "employer",
      relation: "professionalProfile",
    },
    "Experience Level": {
      model: "professionalProfile",
      field: "seniority",
      relation: "professionalProfile",
    },
    Availability: {
      model: "booking",
      field: "startAt",
      relation: "bookingsAsProfessional",
      many: true,
      transform: (dates: Date[]) =>
        Array.from(
          new Set(
            dates.map((d) => {
              const day = d.getUTCDay();
              return day === 0 || day === 6 ? "Weekends" : "Weekdays";
            })
          )
        ),
    },
  };

  const filterOptions = await getFilterOptions(filterConfig);

  const activeFilters: Record<string, string[]> = {};
  for (const key of Object.keys(filterConfig)) {
    const value = searchParams?.[key];
    activeFilters[key] = Array.isArray(value)
      ? value
      : value
      ? [value]
      : [];
  }

  const where = buildFilterWhere(filterConfig, activeFilters);
  const results = await prisma.user.findMany({
    where,
    include: { professionalProfile: true },
  });
  return (
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
            {Object.entries(filterOptions).map(([label, options]) => (
              <FilterDropdown key={label} label={label} options={options} />
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
              rows={results.map((u) => ({
                id: u.id,
                name: u.email,
                title: u.professionalProfile?.title ?? "",
                experience: u.professionalProfile?.seniority ?? "",
                availability: "",
                action: (
                  <Link href={`/candidate/detail/${u.id}`}>View Profile</Link>
                ),
              }))}
            />
          </Card>
        </section>
      </div>
  );
}
