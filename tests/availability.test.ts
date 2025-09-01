import { describe, expect, it } from 'vitest';
import { mergeSlots, splitIntoSlots, Slot } from '../lib/availability';

describe('availability utilities', () => {
  it('merges continuous slots into a single range', () => {
    const slots: Slot[] = [
      { start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T09:30:00.000Z' },
      { start: '2024-01-01T09:30:00.000Z', end: '2024-01-01T10:00:00.000Z' },
      { start: '2024-01-01T11:00:00.000Z', end: '2024-01-01T11:30:00.000Z' },
    ];
    const merged = mergeSlots(slots);
    expect(merged).toEqual([
      { start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T10:00:00.000Z' },
      { start: '2024-01-01T11:00:00.000Z', end: '2024-01-01T11:30:00.000Z' },
    ]);
  });

  it('splits ranges into 30-minute chunks', () => {
    const ranges: Slot[] = [
      { start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T10:00:00.000Z' },
    ];
    const slots = splitIntoSlots(ranges);
    expect(slots).toEqual([
      { start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T09:30:00.000Z' },
      { start: '2024-01-01T09:30:00.000Z', end: '2024-01-01T10:00:00.000Z' },
    ]);
  });

  it('round-trip merge and split', () => {
    const slots: Slot[] = [
      { start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T09:30:00.000Z' },
      { start: '2024-01-01T09:30:00.000Z', end: '2024-01-01T10:00:00.000Z' },
    ];
    const merged = mergeSlots(slots);
    const expanded = splitIntoSlots(merged);
    expect(expanded).toEqual(slots);
  });
});
