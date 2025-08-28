import DashboardClient from "../../../components/DashboardClient";
import {
  getFilterOptions,
  FilterConfig,
  ActiveFilters,
} from "../../../app/api/filterOptions";
import { listUsers } from "../../../app/api/users/list";
import { Role } from "@prisma/client";
import Pagination from "../../../components/Pagination";

export default async function Browse({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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

  const page = Number(searchParams.page) || 1;

  const active: ActiveFilters = {};
  for (const key of Object.keys(filterConfig)) {
    const value = searchParams[key];
    if (value) {
      active[key] = Array.isArray(value)
        ? (value as string[])
        : (value as string).split(",");
    }
  }

  const [filterOptions, listResult] = await Promise.all([
    getFilterOptions(filterConfig),
    // By default, only show professionals. Pass [Role.CANDIDATE] or both to customize.
    listUsers([Role.PROFESSIONAL], page, 50, active, filterConfig),
  ]);
  const { users: results, totalPages } = listResult;
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

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Search Results</h2>
      <DashboardClient
        data={rows}
        columns={columns}
        filterOptions={filterOptions}
        initialActive={active}
        buttonColumns={["action"]}
      />
      <Pagination page={page} totalPages={totalPages} />
    </section>
  );
}

