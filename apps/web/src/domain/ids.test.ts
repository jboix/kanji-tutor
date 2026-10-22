import { describe, expect, it } from 'vitest';
import { isoWeek, itemId, parseItemId } from './ids.ts';

describe('ids', () => {
  it('round-trips item ids whose ref contains colons', () => {
    const id = itemId('kanjiReading', '生:セイ');
    expect(id).toBe('kanjiReading:生:セイ');
    expect(parseItemId(id)).toEqual({ kind: 'kanjiReading', ref: '生:セイ' });
  });

  it.each([
    ['2026-10-17', '2026-W42'],
    ['2026-01-01', '2026-W01'],
    ['2027-01-01', '2026-W53'],
    ['2024-12-30', '2025-W01'],
  ])('isoWeek(%s) = %s', (date, week) => {
    expect(isoWeek(new Date(`${date}T12:00:00`))).toBe(week);
  });
});
