import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type {
  AiClient,
  Answer,
  SentenceBreakdown,
  TaskName,
  WordExplanation,
} from '../../ai/types.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { ok } from '../../test/explain-results.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import type { NoSpoilScope } from '../../ui/slots.tsx';
import { ExplainWordSheet } from './word-sheet.tsx';

/** 駅で友達を待っている間に、本を読みました。 with two targets: 待っ (answered) and 間 (not yet). */
const CARD: SessionCard = {
  sentence: S.waiting,
  reason: 'due',
  targets: [
    {
      tokenIndex: 4,
      itemId: `word:${W.matsu.id}`,
      wordId: W.matsu.id,
      surface: '待っ',
      readings: ['まって'],
    },
    {
      tokenIndex: 7,
      itemId: `word:${W.aida.id}`,
      wordId: W.aida.id,
      surface: '間',
      readings: ['あいだ'],
    },
  ],
};
const AFTER_FIRST: NoSpoilScope = { card: CARD, from: 1 };
const EKI = 0;

/** A breakdown the tutor gave earlier, cached, that names 間's reading three ways. */
const LEAKY_BREAKDOWN: SentenceBreakdown = {
  translation: 'While I waited (間 is read あいだ), I read a book.',
  chunks: [
    { text: '駅で', gloss: 'at the station', focus: true },
    { text: '間に', gloss: 'during, あいだ in kana, aida in romaji', focus: false },
  ],
  readings: [
    { surface: '間', reading: 'あいだ', verified: true },
    { surface: '駅', reading: 'えき', verified: true },
  ],
};

const LEAKY_WORD: WordExplanation = {
  surface: '駅',
  reading: { surface: '駅', reading: 'えき', verified: true },
  meaning: 'station',
  nuance: 'The place you wait; compare 間（あいだ）, the time you wait.',
  chips: [{ kind: 'simpler', label: 'Simpler, please' }],
  readings: [{ surface: '間', reading: 'あいだ', verified: false }],
};

const LEAKY_ANSWER: Answer = {
  answer: 'Here 間 is read as あいだ, as you know.',
  readings: [{ surface: '間', reading: 'あいだ', verified: false }],
};

function leakyAi(): Partial<AiClient> {
  return {
    peek: vi.fn(async (task: TaskName) =>
      task === 'breakdownSentence' ? LEAKY_BREAKDOWN : undefined,
    ) as AiClient['peek'],
    explainWord: vi.fn(() => ok(LEAKY_WORD)),
    // The real client answers a saved breakdown from the cache, marked `cached` (A15).
    breakdownSentence: vi.fn(async () => ({
      ok: true as const,
      value: LEAKY_BREAKDOWN,
      cached: true,
    })),
    answerQuestion: vi.fn(() => ok(LEAKY_ANSWER)),
  };
}

async function open(noSpoil: NoSpoilScope | undefined, tokenIndex = EKI) {
  const repos = await readingRepos();
  const services = fakeServices({ ai: fakeAi(leakyAi()), repos });
  renderWithServices(
    <ExplainWordSheet
      sentence={S.waiting}
      tokenIndex={tokenIndex}
      onClose={() => undefined}
      noSpoil={noSpoil}
    />,
    { services },
  );
  const name = `${S.waiting.tokens[tokenIndex]?.surface} in this sentence`;
  return screen.getByRole('dialog', { name });
}

const leaks = (text: string | null) => /あいだ|アイダ|aida/i.test(text ?? '');

describe('ExplainWordSheet with a target still to answer (Issue 31, L3)', () => {
  it('redacts a cached breakdown, opened from its "Saved" button', async () => {
    const sheet = await open(AFTER_FIRST);
    const saved = /^Break down with the tutor, saved, uses AI: no request$/;
    await userEvent.click(await within(sheet).findByRole('button', { name: saved }));
    await within(sheet).findByRole('region', { name: 'How this sentence is built' });
    expect(sheet.textContent).toContain('at the station');
    expect(leaks(sheet.textContent)).toBe(false);
    // The cached breakdown is in the AI box, marked as a saved answer (D57).
    expect(sheet.querySelector('[data-ai-block=""]')?.textContent).toContain('saved answer');
  });

  it('redacts the word note, its unchecked readings and a free answer', async () => {
    const sheet = await open(AFTER_FIRST);
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    await within(sheet).findByRole('note', { name: 'The tutor on 駅' });
    await userEvent.type(within(sheet).getByRole('textbox'), 'How is 間 read?{Enter}');
    await within(sheet).findByText(/as you know/);
    expect(leaks(sheet.textContent)).toBe(false);
    expect(sheet.textContent).toContain('[…]');
    expect(sheet.textContent).toContain('えき');
  });

  it('shows everything once no target is left to answer', async () => {
    const sheet = await open({ card: CARD, from: 2 });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Break down with the tutor, / }),
    );
    await within(sheet).findByRole('region', { name: 'How this sentence is built' });
    expect(leaks(sheet.textContent)).toBe(true);
  });

  it('hides a dictionary reading that is a hidden one in the heading', async () => {
    const hidden: SessionCard = {
      ...CARD,
      targets: [{ ...(CARD.targets[1] as SessionCard['targets'][number]), readings: ['えき'] }],
    };
    const sheet = await open({ card: hidden, from: 0 });
    await within(sheet).findByRole('region', { name: 'In the dictionary' });
    expect(sheet.textContent).toContain('station');
    expect(sheet.textContent).not.toContain('えき');
  });
});
