import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../../domain/session-types.ts';
import { loadSession, localDay, requestKey, saveSession } from './saved-session.ts';
import { INITIAL, type SessionState } from './session-state.ts';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
  };
}

const cards = [{ reason: 'due' }, { reason: 'new' }, { reason: 'due' }] as unknown as SessionCard[];
const at = (index: number): SessionState => ({ ...INITIAL, cards, index });
const NOON = new Date(2026, 9, 18, 12).getTime();

describe('saved session (R14)', () => {
  it('resumes the same session at the same card, the same day', () => {
    const storage = memoryStorage();
    const key = requestKey({ unit: 'jikoshoukai' });
    saveSession(key, at(1), NOON, storage);
    expect(loadSession(key, NOON + 3_600_000, storage)?.index).toBe(1);
  });

  it('does not resume another session, another day, or a finished one', () => {
    const storage = memoryStorage();
    const key = requestKey({});
    saveSession(key, at(2), NOON, storage);
    expect(loadSession(requestKey({ grammar: 'g-te' }), NOON, storage)).toBeUndefined();
    expect(loadSession(key, NOON + 86_400_000, storage)).toBeUndefined();
    saveSession(key, at(3), NOON, storage);
    expect(storage.length).toBe(0);
  });

  it('keys a request by its set fields, in any order', () => {
    expect(requestKey({ a: 1, b: undefined, c: 2 })).toBe(requestKey({ c: 2, a: 1 }));
    expect(localDay(NOON)).toBe('2026-10-18');
  });

  it('survives storage that throws', () => {
    const broken = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    } as Storage;
    expect(() => saveSession('k', at(0), NOON, broken)).not.toThrow();
    expect(loadSession('k', NOON, broken)).toBeUndefined();
  });
});
