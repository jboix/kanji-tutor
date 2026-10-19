import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../domain/session-types.ts';
import { offerSession, takeSession } from './session-handoff.ts';

const cards = [{ reason: 'due' }] as unknown as SessionCard[];
const AT = 1_000_000;

describe('session handoff (N10)', () => {
  it('gives the offered session once, to the link that names it', () => {
    const state = offerSession(cards, AT);
    expect(takeSession({ sessionBuiltAt: AT + 1 }, AT)).toBeUndefined();
    expect(takeSession(null, AT)).toBeUndefined();
    expect(takeSession('x', AT)).toBeUndefined();
    expect(takeSession(state, AT + 1000)).toBe(cards);
    expect(takeSession(state, AT + 1000)).toBeUndefined();
  });

  it('drops an offer replaced by a newer one or left for half an hour', () => {
    const old = offerSession(cards, AT);
    const next = offerSession(cards, AT + 5);
    expect(takeSession(old, AT + 5)).toBeUndefined();
    expect(takeSession(next, AT + 5 + 31 * 60_000)).toBeUndefined();
  });
});
