import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AiError, Result, WeeklyNotes } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import type { ErrorType, Review, Verdict } from '../../domain/types.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { createFormats } from '../../ui/i18n/format.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { plainLetter, rangeLine } from './notes-copy.ts';
import { NotesScreen } from './notes-screen.tsx';

/** Sunday 18 October 2026, local time: the last day of 2026-W42. */
const NOW = new Date(2026, 9, 18, 20).getTime();
const t = createTranslator('en', ENGLISH, ENGLISH);
const format = createFormats('en');
const on = (day: number, hour = 9) => new Date(2026, 9, day, hour).getTime();

interface Answer {
  at: number;
  word: { id: string };
  answer: string;
  expected: string;
  sentenceId?: string;
  verdict?: Verdict;
  errorType?: ErrorType;
}

async function answer(repos: Repos, a: Answer) {
  const review: Review = {
    at: a.at,
    itemId: `word:${a.word.id}`,
    answer: a.answer,
    expected: a.expected,
    verdict: a.verdict ?? (a.errorType ? 'near-miss' : 'correct'),
    durationMs: 3000,
    mode: 'typed',
  };
  if (a.sentenceId) review.sentenceId = a.sentenceId;
  if (a.errorType) review.errorType = a.errorType;
  await repos.reviews.add(review);
}

/** Three sentences read, one right, two long-vowel misses; two unused grammar points. */
async function longVowelWeek(): Promise<Repos> {
  const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
  const lesson = 'Tobira 第4課';
  await repos.grammar.putMany([
    {
      id: 'わけではない',
      pattern: '〜わけではない',
      meaning: 'not that',
      lesson,
      exampleSentenceIds: [],
    },
    { id: 'に対して', pattern: '〜に対して', meaning: 'towards', lesson, exampleSentenceIds: [] },
  ]);
  await answer(repos, {
    at: on(13),
    word: W.shoukai,
    answer: 'しょかい',
    expected: 'しょうかい',
    errorType: 'long-vowel',
  });
  await answer(repos, {
    at: on(14),
    word: W.issho,
    answer: 'いっしょ',
    expected: 'いっしょう',
    errorType: 'long-vowel',
  });
  await answer(repos, {
    at: on(15),
    word: W.eki,
    sentenceId: S.waitPlain.id,
    answer: 'えき',
    expected: 'えき',
  });
  return repos;
}

const GROUNDED: WeeklyNotes = {
  letter: [
    'You read 3 sentences and got the reading right in 1.',
    'Both misses dropped a long vowel: 紹介 as しょかい, 一生 as いっしょ.',
  ],
  plan: [{ when: 'Daily', what: 'Audio first, every sentence.' }],
};

function weeklyNotes(result: Result<WeeklyNotes>) {
  return vi.fn(async () => result);
}

const failed = (error: AiError): Result<WeeklyNotes> => ({ ok: false, error });

async function renderNotes(
  repos: Repos,
  notes = weeklyNotes({ ok: true, value: GROUNDED, cached: false }),
  options: { ask?: boolean; cached?: WeeklyNotes } = { ask: true },
) {
  const peek = vi.fn(async () => options.cached);
  const services = fakeServices({ repos, ai: fakeAi({ weeklyNotes: notes, peek }) });
  const view = renderWithServices(<NotesScreen now={NOW} />, { services, path: '/notes' });
  await screen.findByRole('region', { name: 'Letter on the week' });
  if (options.ask) {
    const button = await screen.findByRole('button', {
      name: /^Ask the tutor to write this week's letter, /,
    });
    fireEvent.click(button);
    await waitFor(() => expect(notes).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Writing this week's letter…")).toBeNull());
  }
  return { ...view, notes };
}

/** The seal of the AI letter's box; the seal on the ask button (A18) does not count. */
const seal = (container: HTMLElement) =>
  container.querySelector('[data-ai-block] [aria-hidden="true"][lang="ja"]');

describe('notes copy', () => {
  it('writes the date range of the week', () => {
    expect(rangeLine(format, on(12, 0), on(19, 0))).toBe('12–18 October');
    expect(rangeLine(format, new Date(2026, 8, 28).getTime(), on(5, 0))).toBe(
      '28 September – 4 October',
    );
  });

  it('writes a plain letter from the stats', () => {
    const stats = {
      week: '2026-W42',
      sentencesRead: 9,
      correct: 5,
      byErrorType: { 'long-vowel': 3, sokuon: 1 },
      missExamples: [{ surface: '紹介', expected: 'しょうかい', given: 'しょかい' }],
      unusedGrammar: ['〜ために'],
    };
    expect(plainLetter(t, stats)).toEqual([
      'You read 9 sentences and got the reading right in 5.',
      '3 of 4 misses were long vowels. Missed this week: 紹介 as しょかい.',
      "You haven't used 〜ために yourself yet.",
    ]);
    expect(plainLetter(t, { ...stats, byErrorType: { sokuon: 1 }, unusedGrammar: [] })[1]).toBe(
      'The one miss was the small っ. Missed this week: 紹介 as しょかい.',
    );
  });
});

describe('NotesScreen', () => {
  it('shows the plain letter at once and asks the tutor only when the learner does (A13)', async () => {
    const repos = await longVowelWeek();
    const { notes, container } = await renderNotes(repos, undefined, {});
    const letter = screen.getByRole('region', { name: 'Letter on the week' });
    expect(letter.textContent).toContain('You read 3 sentences and got the reading right in 1.');
    expect(seal(container)).toBeNull();
    expect(notes).not.toHaveBeenCalled();
  });

  it("says the tutor's letter is saved once written, without a call (A18)", async () => {
    const repos = await longVowelWeek();
    const { notes, container } = await renderNotes(repos, undefined, { cached: GROUNDED });
    const saved = /^Ask the tutor to write this week's letter, saved, uses AI: no request$/;
    expect(await screen.findByRole('button', { name: saved })).toBeTruthy();
    expect(seal(container)).toBeNull();
    expect(notes).not.toHaveBeenCalled();
  });

  it('shows the AI letter of the real stats and the 解 divider, and no plan (IA6)', async () => {
    const repos = await longVowelWeek();
    const { container, notes } = await renderNotes(repos);
    expect(notes).toHaveBeenCalledWith({
      stats: expect.objectContaining({ week: '2026-W42', sentencesRead: 3, correct: 1 }),
    });
    expect(screen.getByText('12–18 October')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'This week' })).toBeTruthy();
    const letter = screen.getByRole('region', { name: 'Letter on the week' });
    expect(letter.textContent).toContain('Both misses dropped a long vowel: 紹介 as しょかい');
    expect(seal(container)?.getAttribute('data-seal')).toBe('解');
    expect(screen.queryByRole('region', { name: 'Next week' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use this plan' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('shows the plain letter without the seal when offline', async () => {
    const repos = await longVowelWeek();
    const offline = weeklyNotes(failed({ kind: 'offline', message: 'offline' }));
    const { container } = await renderNotes(repos, offline);
    const letter = screen.getByRole('region', { name: 'Letter on the week' });
    expect(letter.textContent).toContain('You read 3 sentences and got the reading right in 1.');
    expect(letter.textContent).toContain('All 2 misses were long vowels.');
    expect(letter.textContent).toContain("You're offline, so this is the plain letter");
    // The letter is plain: no AI box around it, only the tutor's status box (D57).
    expect(container.querySelector('[data-ai-block=""]')).toBeNull();
    expect(container.querySelector('[data-ai-block="status"]')?.textContent).toContain('offline');
  });

  it('points to Settings without a key', async () => {
    const repos = await longVowelWeek();
    await renderNotes(repos, weeklyNotes(failed({ kind: 'no-key', message: 'no key' })));
    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('href')).toBe(
      '/settings/tutor',
    );
  });

  it('falls back to the plain letter when the AI quotes numbers not in the records', async () => {
    const repos = await longVowelWeek();
    const invented = { ...GROUNDED, letter: ['You read 212 sentences and got 186 right.'] };
    const { container } = await renderNotes(
      repos,
      weeklyNotes({ ok: true, value: invented, cached: false }),
    );
    const letter = screen.getByRole('region', { name: 'Letter on the week' });
    expect(letter.textContent).not.toContain('212 sentences');
    expect(letter.textContent).toContain("quoted things that aren't in your records (212, 186)");
    expect(seal(container)).toBeNull();
  });

  it('never asks the AI about an empty week', async () => {
    const repos = await readingRepos();
    const { notes } = await renderNotes(repos, undefined, {});
    expect(
      screen.queryByRole('button', { name: /^Ask the tutor to write this week's letter, / }),
    ).toBeNull();
    expect(notes).not.toHaveBeenCalled();
    expect(screen.getByText('Nothing read this week yet.')).toBeTruthy();
  });

  it('lists kept notes newest first and deletes one after asking', async () => {
    const repos = await readingRepos();
    await repos.notes.putMany([
      { id: 'a', createdAt: on(12), title: '待 and 持', body: 'Different radicals.' },
      { id: 'b', createdAt: on(16), title: '紹介', body: 'しょうかい has a long vowel.' },
    ]);
    await renderNotes(repos, undefined, {});
    const kept = await screen.findByRole('region', { name: 'Kept notes' });
    const titles = within(kept).getAllByRole('heading', { level: 3 });
    expect(titles.map((t) => t.textContent)).toEqual(['紹介', '待 and 持']);
    expect(kept.textContent).toContain('Kept 16 October');
    fireEvent.click(within(kept).getByRole('button', { name: 'Delete 待 and 持' }));
    expect(kept.textContent).toContain('Delete this note?');
    fireEvent.click(within(kept).getByRole('button', { name: 'Keep' }));
    fireEvent.click(within(kept).getByRole('button', { name: 'Delete 待 and 持' }));
    fireEvent.click(within(kept).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(within(kept).getAllByRole('heading', { level: 3 })).toHaveLength(1));
    expect(await repos.notes.get('a')).toBeUndefined();
  });

  it('says where kept notes come from when there are none', async () => {
    await renderNotes(await readingRepos(), undefined, {});
    expect(
      await screen.findByText('Explanations you keep from a reading show up here.'),
    ).toBeTruthy();
  });
});

describe('NotesScreen in French and Spanish', () => {
  function renderIn(repos: Repos, language: 'fr' | 'es') {
    const services = fakeServices({ repos, ai: fakeAi({ peek: vi.fn(async () => undefined) }) });
    return renderWithServices(<NotesScreen now={NOW} />, { services, path: '/notes', language });
  }

  it('words the week and the plain letter in French', async () => {
    renderIn(await longVowelWeek(), 'fr');
    const letter = await screen.findByRole('region', { name: 'Lettre sur la semaine' });
    expect(screen.getByText('12–18 octobre')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cette semaine' })).toBeTruthy();
    expect(letter.textContent).toContain('Vous avez lu 3 phrases');
  });

  it('words the week in Spanish', async () => {
    renderIn(await longVowelWeek(), 'es');
    await screen.findByRole('region', { name: 'Carta sobre la semana' });
    expect(screen.getByText('12–18 de octubre')).toBeTruthy();
  });
});
