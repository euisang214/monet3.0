'use client';
import { useState, useEffect } from 'react';
import { Button, Input } from '../../../components/ui';

interface BusyRange {
  day: number;
  start: string;
  end: string;
}

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function BusyTimes() {
  const [ranges, setRanges] = useState<BusyRange[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('candidateDefaultBusy');
    if(saved){
      setRanges(JSON.parse(saved));
    }
  }, []);

  const addRange = () => setRanges([...ranges, { day:0, start:'09:00', end:'17:00' }]);

  const updateRange = (index: number, field: keyof BusyRange, value: any) => {
    const next = [...ranges];
    (next[index] as any)[field] = value;
    setRanges(next);
  };

  const removeRange = (idx: number) => setRanges(ranges.filter((_,i)=>i!==idx));

  const save = () => {
    localStorage.setItem('candidateDefaultBusy', JSON.stringify(ranges));
    alert('Busy times saved');
  };

  return (
    <div className="col" style={{ gap:8 }}>
      <h3>Default Busy Times</h3>
      {ranges.map((r, idx) => (
        <div key={idx} className="row" style={{ gap:8, alignItems:'center' }}>
          <select value={r.day} onChange={e=>updateRange(idx,'day',parseInt(e.target.value))}>
            {days.map((d,i)=> (<option value={i} key={i}>{d}</option>))}
          </select>
          <Input type="time" value={r.start} onChange={e=>updateRange(idx,'start',e.target.value)} />
          <span>to</span>
          <Input type="time" value={r.end} onChange={e=>updateRange(idx,'end',e.target.value)} />
          <Button variant="danger" onClick={()=>removeRange(idx)}>Remove</Button>
        </div>
      ))}
      <div className="row" style={{ gap:8 }}>
        <Button onClick={addRange}>Add Time Range</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}
