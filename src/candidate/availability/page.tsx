'use client';
import { CandidateShell } from "../../components/layouts";
import { Card, Button } from "../../components/ui";
import React from 'react';

function Grid(){
  // Simple stubbed weekly grid (15 min blocks visually simplified)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div>
      <h2>October</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:12}}>
        {days.map((d,i)=>(
          <div key={i} className="col" style={{gap:8}}>
            <strong>{d}</strong>
            <div className="card" style={{height:240, padding:8, background:'#f8fafc'}}>
              <div className="card" style={{height:60, background:'#94a3b8'}}><span style={{color:'#fff'}}>Unavailable</span></div>
              <div className="card" style={{height:60, background:'#86efac'}}><span>Available</span></div>
              <div className="card" style={{height:60, background:'#94a3b8'}}><span style={{color:'#fff'}}>Unavailable</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="row" style={{marginTop:16, justifyContent:'flex-end'}}>
        <Button>Confirm Availability</Button>
      </div>
    </div>
  )
}

export default function Availability(){
  return (
    <CandidateShell>
      <Grid/>
    </CandidateShell>
  )
}
