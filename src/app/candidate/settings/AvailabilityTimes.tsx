'use client';
import { Input, Button } from '../../../components/ui';

export interface AvailabilityRange {
  day: number;
  start: string;
  end: string;
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityTimes({
  ranges,
  onChange,
}: {
  ranges: AvailabilityRange[];
  onChange: (ranges: AvailabilityRange[]) => void;
}) {
  const addRange = () => onChange([...ranges, { day: 0, start: '09:00', end: '17:00' }]);

  const updateRange = (index: number, field: keyof AvailabilityRange, value: any) => {
    const next = [...ranges];
    (next[index] as any)[field] = value;
    onChange(next);
  };

  const removeRange = (idx: number) => onChange(ranges.filter((_, i) => i !== idx));

  return (
    <div className="col" style={{ gap: 8 }}>
      <h3>Default Busy Times</h3>
      {ranges.map((r, idx) => (
        <div key={idx} className="row" style={{ gap: 8, alignItems: 'center' }}>
          <select value={r.day} onChange={e => updateRange(idx, 'day', parseInt(e.target.value))}>
            {days.map((d, i) => (
              <option value={i} key={i}>
                {d}
              </option>
            ))}
          </select>
          <Input type="time" value={r.start} onChange={e => updateRange(idx, 'start', e.target.value)} />
          <span>to</span>
          <Input type="time" value={r.end} onChange={e => updateRange(idx, 'end', e.target.value)} />
          <Button variant="danger" onClick={() => removeRange(idx)}>
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={addRange}>Add Time Range</Button>
    </div>
  );
}

