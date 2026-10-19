import { describe, expect, it } from 'vitest';
import { CAPTURE_LINES } from '../../domain/services/capture-fixtures.ts';
import { createFormats } from '../../ui/i18n/format.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import {
  addedLead,
  capturedWhen,
  exerciseMessage,
  noteErrorMessage,
  photoErrorMessage,
} from './capture-copy.ts';
import { bytesToBase64, fitWithin } from './image.ts';
import { lineSegments, splitJapanese } from './line-segments.ts';
import { grammarCandidates, isGrammarPicked, lineWordIds } from './review-model.ts';
import { cleanLines } from './use-capture-start.ts';

describe('fitWithin', () => {
  it('scales the long edge down to 1600 px and keeps the aspect ratio', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(4000, 1)).toEqual({ width: 1600, height: 1 });
  });

  it('never upscales', () => {
    expect(fitWithin(1200, 900)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(1600, 1600)).toEqual({ width: 1600, height: 1600 });
    expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(1000, 500, 400)).toEqual({ width: 400, height: 200 });
  });
});

describe('bytesToBase64', () => {
  it('encodes in chunks', () => {
    expect(bytesToBase64(new TextEncoder().encode('jpeg'))).toBe('anBlZw==');
    const big = new Uint8Array(0x8000 * 2 + 3).fill(65);
    expect(atob(bytesToBase64(big))).toHaveLength(big.length);
  });
});

const t = createTranslator('en', ENGLISH, ENGLISH);
const format = createFormats('en');

describe('capture copy', () => {
  const now = new Date(2026, 9, 18, 12).getTime(); // Sunday
  it('says when a capture was made', () => {
    expect(capturedWhen(t, format, now - 3_600_000, now)).toBe('today');
    expect(capturedWhen(t, format, new Date(2026, 9, 17, 23).getTime(), now)).toBe('yesterday');
    expect(capturedWhen(t, format, new Date(2026, 9, 15, 9).getTime(), now)).toBe('Thursday');
    expect(capturedWhen(t, format, new Date(2026, 9, 2, 9).getTime(), now)).toBe('2 October');
  });

  it('explains failures plainly', () => {
    expect(photoErrorMessage(t, { kind: 'rate-limit', message: '' })).toContain(
      'too many requests',
    );
    expect(photoErrorMessage(t, { kind: 'invalid-response', message: '' })).toContain(
      'not as expected',
    );
    expect(photoErrorMessage(t, { kind: 'provider', message: 'quota' })).toBe(
      'The photo could not be read: quota',
    );
    expect(noteErrorMessage(t, 'no-key')).toContain('Gemini key');
    expect(noteErrorMessage(t, 'rate-limit')).toContain('too many requests');
    expect(noteErrorMessage(t, 'provider')).toBe('The explanation did not load. Try again.');
  });

  it('reports outcomes as facts', () => {
    expect(exerciseMessage(t, 'next-session')).toBe("It's in your next session.");
    expect(exerciseMessage(t, 'not-next')).toContain("won't be in your next session");
    expect(exerciseMessage(t, 'too-many-new')).toContain('too many new words');
    expect(exerciseMessage(t, 'all-known')).toContain('already read every word');
    expect(addedLead(t, 5, 1)).toBe('Added 5 words and 1 grammar point');
    expect(addedLead(t, 1, 0)).toBe('Added 1 word');
    expect(addedLead(t, 0, 0)).toBeUndefined();
  });

  it('cleans OCR and pasted lines', () => {
    expect(cleanLines([' 一行目 \n\n二行目', '  '])).toEqual(['一行目', '二行目']);
  });
});

describe('lineSegments', () => {
  const line = CAPTURE_LINES[2] ?? { text: '', tokens: [] };
  it('marks unknown words and cited phrases, joining back into the line', () => {
    const segments = lineSegments(line.text, line.tokens, [2, 7], ['わけではない']);
    expect(segments.map((s) => s.text).join('')).toBe(line.text);
    expect(segments.filter((s) => s.unknown).map((s) => s.text)).toEqual(['方言', '減っ']);
    expect(segments.filter((s) => s.cited).map((s) => s.text)).toEqual(['わけではない']);
    expect(lineSegments(line.text, line.tokens, [99], ['ない', 'ありません'])).toHaveLength(3);
  });

  it('splits explanations into English and Japanese runs', () => {
    expect(splitJapanese('The job わけではない does.')).toEqual([
      { text: 'The job ', ja: false, start: 0 },
      { text: 'わけではない', ja: true, start: 8 },
      { text: ' does.', ja: false, start: 14 },
    ]);
  });
});

describe('review model', () => {
  it('merges own and AI-cited grammar, minus tracked points', () => {
    const answer = { answer: '', readings: [] };
    const notes = new Map([
      [0, { status: 'ready' as const, answer, cited: ['わけではない', 'ている'] }],
      [1, { status: 'loading' as const }],
    ]);
    const manual = [{ id: 'ている', fromAi: false }];
    const candidates = grammarCandidates(notes, manual, new Set(['ことが多い']));
    expect(candidates).toEqual([
      { id: 'ている', fromAi: false },
      { id: 'わけではない', fromAi: true },
    ]);
    expect(grammarCandidates(notes, [], new Set(['わけではない', 'ている']))).toEqual([]);
    expect(candidates.map((g) => isGrammarPicked(new Map(), g))).toEqual([true, false]);
  });

  it('finds the candidate words of one line', () => {
    const line = { ...(CAPTURE_LINES[2] ?? { text: '', tokens: [] }), unknown: [2, 7] };
    const words = [
      { wordId: 'c4', text: '方言', reading: 'ほうげん', gloss: 'dialect' },
      { wordId: 'c2', text: '地域', reading: 'ちいき', gloss: 'area' },
    ];
    expect(lineWordIds(line, words)).toEqual(['c4']);
    expect(lineWordIds(undefined, words)).toEqual([]);
  });
});
