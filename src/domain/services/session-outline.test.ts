import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../session-types.ts';
import { sessionOutline } from './session-outline.ts';

const card = (extra: Partial<SessionCard> = {}): SessionCard =>
  ({ sentence: { id: 's' }, targets: [], reason: 'due', ...extra }) as SessionCard;
const reading = card();
const fresh = card({ reason: 'new' });
const question = card({ reason: 'drill', question: {} as NonNullable<SessionCard['question']> });
const passage = card({ reason: 'drill', passage: {} as NonNullable<SessionCard['passage']> });
const intro = card({ reason: 'drill', grammarIntro: 'g-te' });

describe('sessionOutline (R13)', () => {
  const cards = [reading, fresh, intro, question, reading, passage, fresh, question];

  it('counts each kind, done before the current card and in all', () => {
    expect(sessionOutline(cards, 3)).toEqual({
      current: 4,
      total: 8,
      kinds: {
        reading: { done: 2, total: 4 },
        exercises: { done: 0, total: 2 },
        passages: { done: 0, total: 1 },
      },
      newWords: 1,
      newGrammar: 0,
      minutes: 4,
    });
  });

  it('includes the current card in what is still to meet', () => {
    const outline = sessionOutline(cards, 1);
    expect(outline.newWords).toBe(2);
    expect(outline.newGrammar).toBe(1);
  });

  it('says at least a minute while cards remain, and nothing at the end', () => {
    expect(sessionOutline([question], 0).minutes).toBe(1);
    expect(sessionOutline(cards, 8)).toMatchObject({ current: 8, minutes: 0, newWords: 0 });
  });
});
