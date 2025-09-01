'use client';

import Link from 'next/link';
import { useMemo, useState, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterDropdown from './FilterDropdown';
import { Card, Button, DataTable, Input } from './ui';
import Pagination from './Pagination';
import { ActiveFilters } from '../app/api/filterOptions';

interface LinkValue {
  label: string;
  href?: string;
  variant?: 'primary' | 'danger' | 'muted';
  disabled?: boolean;
}

type RowData = Record<string, string | string[] | LinkValue | ReactNode>;

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
  dateFilters?: string[];
  dateFilterLabels?: Record<string, string>;
  page?: number;
  totalPages?: number;
  pageParam?: string;
}

export default function DashboardClient({
  data,
  columns,
  filterOptions = {},
  initialActive = {},
  showFilters = true,
  buttonColumns = [],
  dateFilters = [],
  dateFilterLabels = {},
  page,
  totalPages,
  pageParam = 'page',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterKeys = [...Object.keys(filterOptions), ...dateFilters];

  const [active, setActive] = useState<ActiveFilters>(
    showFilters
      ? {
          ...Object.fromEntries(filterKeys.map((k) => [k, []])),
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
          const { label, href, variant, disabled } = val as LinkValue;
          const btn = (
            <Button variant={variant} disabled={disabled}>
              {label}
            </Button>
          );
          row[c.key] = href && !disabled ? <Link href={href}>{btn}</Link> : btn;
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

  const handleDateChange = (label: string, value: string) => {
    if (!showFilters) return;
    setActive((prev) => ({ ...prev, [label]: value ? [value] : [] }));
  };

  const applyFilters = () => {
    if (!showFilters) return;
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(active).forEach(([label, values]) => {
      if (values.length > 0) {
        if (dateFilters.includes(label)) {
          params.set(label, values[0]);
        } else {
          params.set(label, values.join(','));
        }
      } else {
        params.delete(label);
      }
    });
    params.delete(pageParam);
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
            {filterKeys.map((label) =>
              dateFilters.includes(label) ? (
                <Input
                  key={label}
                  type={active[label]?.[0] ? 'date' : 'text'}
                  placeholder={dateFilterLabels[label] || label}
                  value={active[label]?.[0] || ''}
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = 'text';
                  }}
                  onChange={(e) => handleDateChange(label, e.target.value)}
                />
              ) : (
                <FilterDropdown
                  key={label}
                  label={label}
                  options={filterOptions[label] || []}
                  initial={active[label] || []}
                  onChange={(vals) => handleChange(label, vals)}
                />
              )
            )}
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </>
      )}
      <Card style={{ padding: 0 }}>
        <DataTable columns={columns as any} rows={tableRows as any} />
      </Card>
      {typeof page === 'number' && typeof totalPages === 'number' && (
        <Pagination page={page} totalPages={totalPages} param={pageParam} />
      )}
    </div>
  );
}

