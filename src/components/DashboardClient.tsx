'use client';

import Link from 'next/link';
import { useMemo, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Card, Button } from './ui';
const FilterDropdown = dynamic(() => import('./FilterDropdown'), { ssr: false });
const DataTable = dynamic(() => import('./ui').then((m) => m.DataTable), {
  ssr: false,
});
import {
  applyFilters,
  ActiveFilters,
  FilterConfig,
} from '../app/api/filterOptions';

interface LinkValue {
  label: string;
  href?: string;
}

type RowData = Record<string, string | string[] | LinkValue>;

interface Column {
  key: string;
  label: string;
}

interface Props {
  data: RowData[];
  columns: Column[];
  filterOptions?: Record<string, string[]>;
  filterConfig?: FilterConfig;
  showFilters?: boolean;
  buttonColumns?: string[];
}

export default function DashboardClient({
  data,
  columns,
  filterOptions = {},
  filterConfig,
  showFilters = true,
  buttonColumns = [],
}: Props) {
  const [active, setActive] = useState<ActiveFilters>(
    showFilters
      ? Object.fromEntries(Object.keys(filterOptions).map((k) => [k, []]))
      : {}
  );

  const filtered = useMemo(() => {
    if (!showFilters || !filterConfig) return data;
    return applyFilters(data, filterConfig, active);
  }, [data, filterConfig, active, showFilters]);

  const tableRows = useMemo(() => {
    return filtered.map((r) => {
      const row: Record<string, ReactNode> = {};
      columns.forEach((c) => {
        const val = (r as any)[c.key];
        if (
          buttonColumns.includes(c.key) &&
          val &&
          typeof val === 'object' &&
          'label' in val
        ) {
          const { label, href } = val as LinkValue;
          row[c.key] = href ? (
            <Link href={href}>
              <Button>{label}</Button>
            </Link>
          ) : (
            <Button>{label}</Button>
          );
        } else if (val && typeof val === 'object' && 'label' in val) {
          row[c.key] = (val as LinkValue).label;
        } else if (Array.isArray(val)) {
          row[c.key] = val.join(', ');
        } else {
          row[c.key] = val as ReactNode;
        }
      });
      return row;
    });
  }, [filtered, columns, buttonColumns]);

  const handleChange = (label: string, values: string[]) => {
    if (!showFilters) return;
    setActive((prev) => ({ ...prev, [label]: values }));
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      {showFilters && (
        <>
          <p style={{ color: 'var(--text-muted)' }}>
            Showing results for your search criteria
          </p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(filterOptions).map(([label, options]) => (
              <FilterDropdown
                key={label}
                label={label}
                options={options}
                onChange={(vals) => handleChange(label, vals)}
              />
            ))}
          </div>
        </>
      )}
      <Card style={{ padding: 0 }}>
        <DataTable columns={columns as any} rows={tableRows as any} />
      </Card>
    </div>
  );
}

