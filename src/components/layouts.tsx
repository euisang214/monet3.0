"use client";
import React from 'react';
import Link from 'next/link';

export function PublicShell({children}:{children:React.ReactNode}){
  return <div className="container">{children}</div>;
}

export function CandidateShell({children}:{children:React.ReactNode}){
  return (
    <>
      <header style={{borderBottom:'1px solid var(--border)', background:'#fff'}}>
        <div className="container row" style={{justifyContent:'space-between'}}>
          <div className="row" style={{gap:24, alignItems:'center'}}>
            <Link href="/candidate/dashboard" style={{fontWeight:700}}>Connect</Link>
            <nav className="nav">
              <Link href="/candidate/dashboard">Home</Link>
              <Link href="/candidate/browse">Experts</Link>
              <Link href="#">Calendar</Link>
              <Link href="/candidate/history">History</Link>
              <Link href="/candidate/availability">My Availability</Link>
            </nav>
          </div>
          <div className="row" style={{gap:8}}>
            <Link href="/candidate/settings">Settings</Link>
          </div>
        </div>
      </header>
      <div className="container" style={{marginTop:24}}>{children}</div>
    </>
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
