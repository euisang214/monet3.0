export type Slot = { start: string; end: string };

export function mergeSlots(slots: Slot[]): Slot[] {
  if (!slots.length) return [];
  const sorted = slots
    .map((s) => ({ start: new Date(s.start), end: new Date(s.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: { start: Date; end: Date }[] = [];
  let current = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const slot = sorted[i];
    if (slot.start.getTime() === current.end.getTime()) {
      current.end = slot.end;
    } else {
      merged.push(current);
      current = slot;
    }
  }
  merged.push(current);
  return merged.map((m) => ({ start: m.start.toISOString(), end: m.end.toISOString() }));
}

export function splitIntoSlots(ranges: Slot[], minutes = 30): Slot[] {
  const result: Slot[] = [];
  ranges.forEach((r) => {
    const start = new Date(r.start);
    const end = new Date(r.end);
    for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + minutes)) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t.getTime() + minutes * 60 * 1000);
      result.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
    }
  });
  return result;
}
