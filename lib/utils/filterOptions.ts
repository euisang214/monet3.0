import { prisma } from "@/lib/core/db";
import { PrismaClient } from "@prisma/client";

export interface FilterOption {
  model?: keyof PrismaClient;
  field: string;
  /**
   * Relation name from the base model to this model when building `where` clauses
   */
  relation?: string;
  /**
   * Whether the relation is to-many. If true, `some` will be used when generating
   * nested Prisma where queries.
   */
  many?: boolean;
  /**
   * Optional transform applied to raw values when retrieving filter options
   */
  transform?: (values: any[]) => string[];
}

export type FilterConfig = Record<string, FilterOption>;

export type ActiveFilters = Record<string, string[]>;

/**
 * Build a Prisma `where` object that applies all active filters simultaneously.
 * This allows filtering across multiple models by specifying the relation path
 * in the filter configuration.
 */
export function buildFilterWhere(
  config: FilterConfig,
  active: ActiveFilters
) {
  const where: any = {};
  for (const [label, values] of Object.entries(active)) {
    if (!values || values.length === 0) continue;
    const cfg = config[label];
    if (!cfg) continue;
    if (!cfg.relation) {
      // root-level field
      where[cfg.field] = { in: values };
    } else if (cfg.many) {
      where[cfg.relation] = {
        some: {
          ...(where[cfg.relation]?.some || {}),
          [cfg.field]: { in: values },
        },
      };
    } else {
      where[cfg.relation] = {
        ...(where[cfg.relation] || {}),
        [cfg.field]: { in: values },
      };
    }
  }
  return where;
}

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

export function applyFilters<T>(
  data: T[],
  config: FilterConfig,
  active: ActiveFilters
) {
  return data.filter((item) => {
    for (const [label, values] of Object.entries(active)) {
      if (!values || values.length === 0) continue;
      const cfg = config[label];
      if (!cfg) continue;
      let itemVals: any[] = [];
      if (!cfg.relation) {
        const val = (item as any)[cfg.field];
        itemVals = cfg.many ? (Array.isArray(val) ? val : []) : [val];
      } else {
        const rel = (item as any)[cfg.relation];
        if (cfg.many) {
          itemVals = Array.isArray(rel)
            ? rel.map((r: any) => r[cfg.field])
            : [];
        } else {
          itemVals = [rel?.[cfg.field]];
        }
      }
      if (cfg.transform) {
        itemVals = cfg.transform(itemVals);
      }
      if (!itemVals.some((v: any) => values.includes(v))) {
        return false;
      }
    }
    return true;
  });
}
