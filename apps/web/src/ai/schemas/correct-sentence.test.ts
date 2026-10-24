import { describe, expect, it } from 'vitest';
import { fakeVerifier } from '../testing/context.ts';
import { finalizeCorrection } from './correct-sentence.ts';

const INPUT = {
  grammar: { pattern: '〜ました', meaning: 'polite past' },
  sentence: '昨日映画を見ます。',
};
const ERROR = {
  kind: 'replace' as const,
  severity: 'error' as const,
  before: '映画を',
  original: '見ます',
  start: 4,
  end: 7,
  text: '見ました',
  title: 'Past, not present.',
  note: '昨日 is yesterday.',
};
const raw = (extra: object) => ({
  corrected: '昨日映画を見ました。',
  marks: [],
  verdict: 'natural' as const,
  works: 'Good.',
  next: '',
  usesTarget: true,
  readings: [],
  ...extra,
});

describe('finalizeCorrection', () => {
  it('keeps the verdict the tutor gave', async () => {
    const result = await finalizeCorrection(raw({}), INPUT, fakeVerifier({}));
    expect(result.verdict).toBe('natural');
    const fixed = await finalizeCorrection(raw({ verdict: 'not-yet' }), INPUT, fakeVerifier({}));
    expect(fixed.verdict).toBe('not-yet');
  });

  it('never calls a sentence with an error, or without the point, natural', async () => {
    const wrong = await finalizeCorrection(raw({ marks: [ERROR] }), INPUT, fakeVerifier({}));
    expect(wrong.verdict).toBe('needs-work');
    const off = await finalizeCorrection(raw({ usesTarget: false }), INPUT, fakeVerifier({}));
    expect(off.verdict).toBe('needs-work');
  });
});
