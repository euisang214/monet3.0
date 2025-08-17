'use client';
import { ProfessionalShell } from "../../../components/layouts";
import { Card, Button } from "../../../components/ui";
import React from 'react';

function SchedulingOverlay(){
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div className="card" style={{padding:16}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:12, marginTop:12}}>
        {days.map((d, i)=>(
          <div key={i} className="col" style={{gap:8}}>
            <strong>{d}</strong>
            <div className="card" style={{height:240, padding:8, background:'#f8fafc'}}>
              <div className="card" style={{height:60, background:'#86efac'}}><span>Available</span></div>
              <div className="card" style={{height:60, background:'#94a3b8'}}><span style={{color:'#fff'}}>Unavailable</span></div>
              <div className="card" style={{height:60, background:'#86efac'}}><span>Available</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="row" style={{justifyContent:'center', marginTop:12}}><Button>Schedule</Button></div>
    </div>
  )
}

export default function Requests(){
  return (
    <ProfessionalShell>
      <div className="grid grid-2">
        <Card style={{padding:16}}>
          <h3>Requests</h3>
          <div className="col" style={{gap:12}}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div className="col">
                <strong>Liam Carter</strong>
                <span style={{color:'var(--text-muted)'}}>Experienced financial analyst with a background in investment banking.</span>
              </div>
              <div className="row" style={{gap:8}}>
                <Button>Accept</Button>
                <Button variant="muted">Decline</Button>
              </div>
            </div>
            <SchedulingOverlay/>
          </div>
        </Card>
      </div>
    </ProfessionalShell>
  )
}
