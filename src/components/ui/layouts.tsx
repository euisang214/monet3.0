"use client";

import React from 'react';
import Link from 'next/link';
import { signOutAction } from '@/actions';

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
              {/* <Link href="/#about">About Us</Link>
              <Link href="/#how">How It Works</Link>
              <Link href="/#contact">Contact</Link> */}
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
              {/* <Link href="/candidate/browse">Experts</Link> */}
              <Link href="/candidate/calls">Calls</Link>
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
          <div className="row" style={{ gap: 24, alignItems: 'center' }}>
            <Link href="/professional/dashboard" style={{ fontWeight: 700 }}>
              Monet
            </Link>
            <nav className="nav">
              <Link href="/professional/dashboard">Home</Link>
              <Link href="/professional/requests">Requests</Link>
              <Link href="/professional/feedback">Feedback</Link>
              <Link href="/professional/earnings">Earnings</Link>
            </nav>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <Link href="/professional/settings">Settings</Link>
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

export function AdminShell({ children }: ShellProps) {
  return (
    <>
      <header style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div className="container row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 24, alignItems: 'center' }}>
            <Link href="/admin/users" style={{ fontWeight: 700 }}>
              Monet
            </Link>
            <nav className="nav">
              <Link href="/admin/users">Users</Link>
              <Link href="/admin/bookings">Bookings</Link>
              <Link href="/admin/payments">Payments</Link>
              <Link href="/admin/payouts">Payouts</Link>
              <Link href="/admin/feedback">Feedback (QC)</Link>
              <Link href="/admin/disputes">Disputes</Link>
              <Link href="/admin/audit-logs">Audit Logs</Link>
            </nav>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <Link href="/admin/settings">Settings</Link>
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
