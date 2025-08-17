'use client';
import { ProfessionalShell } from "../../components/layouts";
import { Card, Button, Input } from "../../components/ui";
import React from 'react';

export default function SubmitFeedback(){
  return (
    <ProfessionalShell>
      <Card style={{padding:16}}>
        <h2>Submit Feedback</h2>
        <div className="col" style={{gap:12, maxWidth:720}}>
          <label>Cultural Fit</label><Rating/>
          <label>Interest in Industry and Role</label><Rating/>
          <label>Technical Knowledge</label><Rating/>
          <label>Detailed Feedback</label><textarea className="input" style={{height:160}} placeholder="≥200 words, constructive, specific" />
          <label>Exactly three action items</label>
          <div className="col" style={{gap:8}}>
            <Input placeholder="Action item 1"/>
            <Input placeholder="Action item 2"/>
            <Input placeholder="Action item 3"/>
          </div>
          <div className="row" style={{justifyContent:'flex-end'}}><Button>Submit Feedback</Button></div>
        </div>
      </Card>
    </ProfessionalShell>
  )
}

function Rating(){
  return <div className="row" style={{gap:4}}>{"★★★★★".split("").map((s,i)=>(<span key={i} style={{fontSize:22}}>☆</span>))}</div>
}
