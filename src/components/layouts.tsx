"use client";
import React from 'react';
import Link from 'next/link';

export function PublicShell({children}:{children:React.ReactNode}){
  return <div className="container">{children}</div>;
}

export function CandidateShell({children}:{children:React.ReactNode}){
  return (
    <div className="container" style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:24}}>
      <aside className="sidebar">
        <Nav items={[
          {href:'/candidate/dashboard', label:'Home'},
          {href:'/candidate/browse', label:'Experts'},
          {href:'/candidate/history', label:'History'},
          {href:'/candidate/availability', label:'My Availability'},
          {href:'/candidate/settings', label:'Settings'},
        ]}/>
      </aside>
      <main>{children}</main>
    </div>
  )
}

export function ProfessionalShell({children}:{children:React.ReactNode}){
  return (
    <div className="container" style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:24}}>
      <aside className="sidebar">
        <Nav items={[
          {href:'/professional/dashboard', label:'Dashboard'},
          {href:'/professional/requests', label:'Requests'},
          {href:'/professional/feedback', label:'Feedback'},
          {href:'/professional/earnings', label:'Earnings'},
          {href:'/professional/settings', label:'Settings'},
        ]}/>
      </aside>
      <main>{children}</main>
    </div>
  )
}

export function AdminShell({children}:{children:React.ReactNode}){
  return (
    <div className="container" style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:24}}>
      <aside className="sidebar">
        <Nav items={[
          {href:'/admin/users', label:'Users'},
          {href:'/admin/bookings', label:'Bookings'},
          {href:'/admin/payments', label:'Payments'},
          {href:'/admin/payouts', label:'Payouts'},
          {href:'/admin/feedback', label:'Feedback (QC)'},
          {href:'/admin/disputes', label:'Disputes'},
          {href:'/admin/invoices', label:'Invoices'},
          {href:'/admin/audit-logs', label:'Audit Logs'},
        ]}/>
      </aside>
      <main>{children}</main>
    </div>
  )
}

function Nav({items}:{items:{href:string, label:string}[]}){
  return (
    <nav className="col">
      {items.map(i=> (
        <Link key={i.href} href={i.href} className="nav-link">
          {i.label}
        </Link>
      ))}
      <style jsx>{`
        .nav-link{ padding:10px 12px; border-radius:10px; display:block; color:var(--text-muted)}
        .nav-link:hover{ background:var(--muted); color:var(--text)}
      `}</style>
    </nav>
  );
}
