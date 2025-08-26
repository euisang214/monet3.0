import DashboardClient from "../../../components/DashboardClient";
import {
  getFilterOptions,
  FilterConfig,
} from "../../../app/api/filterOptions";
import { listUsers } from "../../../app/api/users/list";
import { Role } from "@prisma/client";

export default async function Browse() {
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

  const [filterOptions, results] = await Promise.all([
    getFilterOptions(filterConfig),
    // By default, only show professionals. Pass [Role.CANDIDATE] or both to customize.
    listUsers([Role.PROFESSIONAL]),
  ]);
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
    <section className="col" style={{ gap: 16 }}>
      <h2>Search Results</h2>
      <DashboardClient
        data={rows}
        columns={columns}
        filterOptions={filterOptions}
        filterConfig={clientFilterConfig}
        buttonColumns={["action"]}
      />
    </section>
  );
}

