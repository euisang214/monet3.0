"use client";

import React from 'react';
import Link from 'next/link';
import { signOutAction } from '../actions';

type ShellProps = { children: React.ReactNode; session?: any };

export function PublicShell({ children, session }: ShellProps) {
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div className="container row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 12 }}>
            <Link href="/" style={{ fontWeight: 700 }}>
              Monet
            </Link>
            <nav className="nav">
              <Link href="/#about">About Us</Link>
              <Link href="/#how">How It Works</Link>
              <Link href="/#contact">Contact</Link>
            </nav>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {session?.user ? (
              <form action={signOutAction}>
                <button className="btn btn-danger">Sign Out</button>
              </form>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
                <Link href="/login" className="btn">
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container" style={{ marginTop: 24 }}>
        {children}
      </main>
    </>
  );
}

export function CandidateShell({ children }: ShellProps) {
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div className="container row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 24, alignItems: 'center' }}>
            <Link href="/candidate/dashboard" style={{ fontWeight: 700 }}>
              Monet
            </Link>
            <nav className="nav">
              <Link href="/candidate/dashboard">Home</Link>
              <Link href="/candidate/browse">Experts</Link>
              <Link href="#">Calendar</Link>
              <Link href="/candidate/history">History</Link>
              <Link href="/candidate/availability">My Availability</Link>
            </nav>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <Link href="/candidate/settings">Settings</Link>
            <form action={signOutAction}>
              <button className="btn btn-danger">Sign Out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="container" style={{ marginTop: 24 }}>
        {children}
      </main>
    </>
  );
}

export function ProfessionalShell({ children }: ShellProps) {
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div className="container row" style={{ justifyContent: 'space-between' }}>
          <Link href="/professional/dashboard" style={{ fontWeight: 700 }}>
            Monet
          </Link>
          <form action={signOutAction}>
            <button className="btn btn-danger">Sign Out</button>
          </form>
        </div>
      </header>
      <div
        className="container"
        style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, marginTop: 24 }}
      >
        <aside className="sidebar">
          <Nav
            items={[
              { href: '/professional/dashboard', label: 'Dashboard' },
              { href: '/professional/requests', label: 'Requests' },
              { href: '/professional/feedback', label: 'Feedback' },
              { href: '/professional/earnings', label: 'Earnings' },
              { href: '/professional/settings', label: 'Settings' },
            ]}
          />
        </aside>
        <main>{children}</main>
      </div>
    </>
  );
}

export function AdminShell({ children }: ShellProps) {
  return (
    <div
      className="container"
      style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}
    >
      <aside className="sidebar">
        <Nav
          items={[
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/bookings', label: 'Bookings' },
            { href: '/admin/payments', label: 'Payments' },
            { href: '/admin/payouts', label: 'Payouts' },
            { href: '/admin/feedback', label: 'Feedback (QC)' },
            { href: '/admin/disputes', label: 'Disputes' },
            { href: '/admin/invoices', label: 'Invoices' },
            { href: '/admin/audit-logs', label: 'Audit Logs' },
          ]}
        />
      </aside>
      <main>{children}</main>
    </div>
  );
}

function Nav({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav className="col">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className="nav-link">
          {i.label}
        </Link>
      ))}
      <style jsx>{`
        .nav-link {
          padding: 10px 12px;
          border-radius: 10px;
          display: block;
          color: var(--text-muted);
          cursor: pointer;
        }
        .nav-link:hover {
          background: var(--muted);
          color: var(--text);
        }
      `}</style>
    </nav>
  );
}
