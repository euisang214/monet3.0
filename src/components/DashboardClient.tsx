'use client';

import Link from 'next/link';
import { useMemo, useState, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, Button } from './ui';
const FilterDropdown = dynamic(() => import('./FilterDropdown'), { ssr: false });
const DataTable = dynamic(() => import('./ui').then((m) => m.DataTable), {
  ssr: false,
});
import { ActiveFilters } from '../app/api/filterOptions';

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
  initialActive?: ActiveFilters;
  showFilters?: boolean;
  buttonColumns?: string[];
}

export default function DashboardClient({
  data,
  columns,
  filterOptions = {},
  initialActive = {},
  showFilters = true,
  buttonColumns = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [active, setActive] = useState<ActiveFilters>(
    showFilters
      ? {
          ...Object.fromEntries(
            Object.keys(filterOptions).map((k) => [k, []])
          ),
          ...initialActive,
        }
      : {}
  );

  const tableRows = useMemo(() => {
    return data.map((r) => {
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
  }, [data, columns, buttonColumns]);

  const handleChange = (label: string, values: string[]) => {
    if (!showFilters) return;
    setActive((prev) => ({ ...prev, [label]: values }));
  };

  const applyFilters = () => {
    if (!showFilters) return;
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(active).forEach(([label, values]) => {
      if (values.length > 0) {
        params.set(label, values.join(','));
      } else {
        params.delete(label);
      }
    });
    params.delete('page');
    router.push(`?${params.toString()}`);
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
                initial={active[label] || []}
                onChange={(vals) => handleChange(label, vals)}
              />
            ))}
            <Button onClick={applyFilters}>Apply Filters</Button>

          </div>
        </>
      )}
      <Card style={{ padding: 0 }}>
        <DataTable columns={columns as any} rows={tableRows as any} />
      </Card>
    </div>
  );
}

