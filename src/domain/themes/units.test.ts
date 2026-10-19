import { describe, expect, it } from 'vitest';
import { UNITS, unitById, unitGrammar, unitsAtLevel } from './units.ts';

describe('units', () => {
  it('runs in path order from N5 up', () => {
    expect(UNITS.map((u) => u.order)).toEqual(UNITS.map((_, i) => i + 1));
    expect(UNITS[0]?.level).toBe(5);
  });

  it('finds a unit by id', () => {
    expect(unitById('vending-machine')?.titleJa).toBe('じどうはんばいき');
    expect(unitById('nope')).toBeUndefined();
  });

  it('lists the units of a level', () => {
    const n5 = unitsAtLevel(5);
    expect(n5.length).toBeGreaterThan(0);
    expect(n5.every((u) => u.level === 5)).toBe(true);
  });

  it("shows a unit's grammar through the catalogue", () => {
    const unit = unitById('ramen-shop');
    if (!unit) throw new Error('fixture');
    expect(unitGrammar(unit).map((g) => g.pattern)).toEqual(['〜ている', '〜てもいい', '〜くて']);
    expect(unitGrammar({ ...unit, grammar: ['nope'] })).toEqual([]);
  });
});
