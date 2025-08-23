import { auth } from "../../../../auth";
import { getFilterOptions, FilterConfig } from "../../../app/api/filterOptions";
import { listProfessionals } from "../../../app/api/professionals/list";
import { getUpcomingCalls } from "../../../app/api/bookings/upcoming";
import DashboardClient from "../../../components/DashboardClient";
import UpcomingCalls from "../../../components/UpcomingCalls";

export default async function CandidateDashboard() {
  const filterConfig: FilterConfig = {
    Title: {
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
  const results = await listProfessionals();

  const session = await auth();
  const upcomingCalls = session?.user.id
    ? await getUpcomingCalls(session.user.id)
    : [];

  const availabilityTransform = filterConfig["Availability"].transform!;

  const rows = results.map((u) => ({
    name: { label: u.email, href: `/candidate/detail/${u.id}` },
    title: u.professionalProfile?.title ?? "",
    firm: u.professionalProfile?.employer ?? "",
    experience: u.professionalProfile?.seniority ?? "",
    availability: availabilityTransform(
      u.bookingsAsProfessional.map((b) => b.startAt as Date)
    ),
    action: { label: "View Profile", href: `/candidate/detail/${u.id}` },
  }));

  const columns = [
    { key: "name", label: "Name" },
    { key: "title", label: "Title" },
    { key: "experience", label: "Experience" },
    { key: "availability", label: "Availability" },
    { key: "action", label: "" },
  ];

  const clientFilterConfig: FilterConfig = {
    Title: { field: "title" },
    Firm: { field: "firm" },
    "Experience Level": { field: "experience" },
    Availability: { field: "availability", many: true },
  };

  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
      <aside style={{ width: 260 }}>
        <UpcomingCalls calls={upcomingCalls} />
      </aside>
      <section className="col" style={{ gap: 16, flex: 1 }}>
        <h2>Search Results</h2>
        <DashboardClient
          data={rows}
          columns={columns}
          filterOptions={filterOptions}
          filterConfig={clientFilterConfig}
          buttonColumns={["action"]}
        />
      </section>
    </div>
  );
}

