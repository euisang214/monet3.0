import { cache } from "react";
import { auth } from "../../../../auth";
import {
  getFilterOptions,
  FilterConfig,
  ActiveFilters,
} from "../../../app/api/filterOptions";
import { listUsers } from "../../../app/api/users/list";
import { Role } from "@prisma/client";
import { getUpcomingCalls } from "../../../app/api/bookings/upcoming";
import DashboardClient from "../../../components/DashboardClient";
import UpcomingCalls from "../../../components/UpcomingCalls";
import Pagination from "../../../components/Pagination";

export default async function CandidateDashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();

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

  const upcomingCallsPromise = session?.user.id
    ? getUpcomingCalls(session.user.id)
    : Promise.resolve([]);

  const [filterOptions, listResult, upcomingCalls] = await Promise.all([
    getFilterOptions(filterConfig),
    listUsers([Role.PROFESSIONAL], page, 50, active, filterConfig),
    upcomingCallsPromise,
  ]);

  const { users: results, totalPages } = listResult;

  const availabilityTransform = filterConfig["Availability"].transform!;

  const rows = results.map((u) => ({
    name: { label: u.email, href: `/candidate/detail/${u.id}` },
    title: u.professionalProfile?.title ?? "",
    firm: u.professionalProfile?.employer ?? "",
    availability: availabilityTransform(
      u.bookingsAsProfessional.map((b) => b.startAt as Date)
    ),
    action: { label: "View Profile", href: `/candidate/detail/${u.id}` },
  }));

  const columns = [
    { key: "name", label: "Name" },
    { key: "title", label: "Title" },
    { key: "availability", label: "Availability" },
    { key: "action", label: "" },
  ];

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
          initialActive={active}
          buttonColumns={["action"]}
        />
        <Pagination page={page} totalPages={totalPages} />
      </section>
    </div>
  );
}

