'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Props {
  page: number;
  totalPages: number;
  param?: string;
}

export default function Pagination({ page, totalPages, param = 'page' }: Props) {
  const searchParams = useSearchParams();

  const createHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, p.toString());
    return `?${params.toString()}`;
  };

  return (
    <div
      className="row"
      style={{ gap: 8, justifyContent: 'center', alignItems: 'center' }}
    >
      {page > 1 ? (
        <Link href={createHref(page - 1)} className="btn">
          Previous
        </Link>
      ) : (
        <button className="btn" disabled>
          Previous
        </button>
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={createHref(page + 1)} className="btn">
          Next
        </Link>
      ) : (
        <button className="btn" disabled>
          Next
        </button>
      )}
    </div>
  );
}
