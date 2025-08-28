'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Props {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: Props) {
  const searchParams = useSearchParams();

  const createHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    return `?${params.toString()}`;
  };

  return (
    <div
      className="row"
      style={{ gap: 8, justifyContent: 'center', alignItems: 'center' }}
    >
      {page > 1 && (
        <Link href={createHref(page - 1)} className="btn">
          Previous
        </Link>
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={createHref(page + 1)} className="btn">
          Next
        </Link>
      )}
    </div>
  );
}
