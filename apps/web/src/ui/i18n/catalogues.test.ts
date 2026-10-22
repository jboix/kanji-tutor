import { describe, expect, it } from 'vitest';
import { en } from './messages/en/index.ts';
import { es } from './messages/es/index.ts';
import { fr } from './messages/fr/index.ts';
import type { PluralMessage } from './types.ts';

type Flat = Record<string, string | PluralMessage>;

function flatten(messages: object): Flat {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([ns, keys]) =>
      Object.entries(keys as Flat).map(([key, value]) => [`${ns}.${key}`, value]),
    ),
  );
}

const holes = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '');

/** Every placeholder of a message, across its plural forms; plurals always take `n`. */
function holesOf(value: string | PluralMessage): string[] {
  if (typeof value === 'string') return [...new Set(holes(value))].sort();
  const forms = Object.values(value).flatMap((form) => holes(form ?? ''));
  return [...new Set(['n', ...forms])].sort();
}

const shape = (value: string | PluralMessage) => (typeof value === 'string' ? 'text' : 'plural');
const source = flatten(en);

describe.each([
  ['fr', fr],
  ['es', es],
])('the %s catalogue', (_, messages) => {
  const flat = flatten(messages);

  it('has exactly the English keys', () => {
    expect(Object.keys(flat).sort()).toEqual(Object.keys(source).sort());
  });

  it('keeps each message shape and every placeholder', () => {
    for (const [key, value] of Object.entries(source)) {
      const own = flat[key];
      expect(own && shape(own), key).toBe(shape(value));
      expect(own && holesOf(own), key).toEqual(holesOf(value));
    }
  });

  it('has no empty message', () => {
    const empty = Object.entries(flat).filter(([, value]) =>
      typeof value === 'string' ? !value.trim() : !value.other.trim(),
    );
    expect(empty).toEqual([]);
  });
});

describe('the English catalogue', () => {
  it('gives every plural an other form', () => {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value !== 'string') expect(value.other, key).toBeTruthy();
    }
  });
});
