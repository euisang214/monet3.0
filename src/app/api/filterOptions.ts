import { prisma } from "../../../lib/db";
import type { FilterConfig } from "@/lib/filters";

export async function getFilterOptions(config: FilterConfig) {
  const entries = Object.entries(config);
  const results = await Promise.all(
    entries.map(async ([label, { model, field, transform }]) => {
      if (!model) return [label, []];
      const data = await (prisma as any)[model].findMany({
        distinct: [field],
        select: { [field]: true },
      });
      const rawValues = data.map((d: any) => d[field]).filter(Boolean);
      return [
        label,
        transform ? transform(rawValues) : (rawValues as string[]),
      ] as [string, string[]];
    })
  );
  return Object.fromEntries(results);
}

