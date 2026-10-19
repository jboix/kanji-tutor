import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import { aiSentenceId } from '../../domain/services/index.ts';
import type { Grade } from '../../domain/types.ts';
import {
  CARD,
  COMPARE,
  MISTAKE,
  noKey,
  offline,
  ok,
  QUIZ,
  TARGET,
  WRONG,
} from '../../test/explain-results.ts';
import { knowBasics, readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import { MistakeExplanation } from './mistake-explanation.tsx';

async function show(ai: Partial<AiClient>, repos?: Repos, grade: Grade = WRONG) {
  const onOpenWord = vi.fn();
  const services = fakeServices({
    ai: fakeAi(ai),
    repos: repos ?? (await readingRepos()),
    lang: fakeLang({
      tokenize: async (text) => Object.values(S).find((s) => s.text === text)?.tokens ?? [],
    }),
  });
  renderWithServices(
    <MistakeExplanation
      card={CARD}
      target={TARGET}
      answer="motte"
      grade={grade}
      onOpenWord={onOpenWord}
    />,
    { services },
  );
  return { onOpenWord, services };
}

/** Shows the mistake and presses "Ask the tutor why". */
async function asked(ai: Partial<AiClient>, repos?: Repos) {
  const shown = await show(ai, repos);
  await userEvent.click(await screen.findByRole('button', { name: /^Ask the tutor why, / }));
  return shown;
}

describe('MistakeExplanation, static first (A13)', () => {
  it('explains a lookalike from the app, with both kanji and their parts, and no AI call', async () => {
    const explainMistake = vi.fn(() => ok(MISTAKE));
    await show({ explainMistake });
    const note = await screen.findByRole('region', { name: 'What went wrong' });
    await within(note).findByText('A lookalike kanji');
    expect(note.textContent).toContain(
      '待って is read まって. You read 待 as if it were the lookalike 持.',
    );
    expect(note.textContent).toContain('They share 寺; 待 has 彳 (going) where 持 has 扌 (hand).');
    expect(within(note).getAllByText('持')[0]?.getAttribute('lang')).toBe('ja');
    expect(screen.queryByRole('note')).toBeNull();
    expect(explainMistake).not.toHaveBeenCalled();
  });

  it('writes a short note for each slip', async () => {
    const grade: Grade = {
      verdict: 'near-miss',
      errorType: 'long-vowel',
      expected: 'まって',
      given: 'まーって',
    };
    await show({}, undefined, grade);
    const note = await screen.findByRole('region', { name: 'What went wrong' });
    expect(note.textContent).toContain('long vowel');
  });

  it('says nothing for a skip, and never asks the tutor, even when set to explain mistakes', async () => {
    const explainMistake = vi.fn(() => ok(MISTAKE));
    const repos = await readingRepos({ tutor: 'auto-mistakes' });
    await show({ explainMistake }, repos, {
      verdict: 'wrong',
      expected: 'まって',
      given: '',
      skipped: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole('region', { name: 'What went wrong' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Ask the tutor why, / })).toBeNull();
    expect(explainMistake).not.toHaveBeenCalled();
  });

  it('explains automatically, once, with Settings → Tutor → also explain my mistakes', async () => {
    const explainMistake = vi.fn(() => ok(MISTAKE));
    await show({ explainMistake }, await readingRepos({ tutor: 'auto-mistakes' }));
    expect(await screen.findByRole('note', { name: 'Why this reading' })).toBeTruthy();
    expect(explainMistake).toHaveBeenCalledTimes(1);
  });
});

describe('MistakeExplanation', () => {
  it('explains this mistake with Japanese in Klee One and opens the sheet to break it down', async () => {
    const explainMistake = vi.fn(() => ok(MISTAKE));
    const { onOpenWord } = await asked({ explainMistake });
    const note = await screen.findByRole('note', { name: 'Why this reading' });
    expect(note.textContent).toContain('You read it as 持, to hold.');
    expect(within(note).getAllByText('持')[0]?.getAttribute('lang')).toBe('ja');
    expect(explainMistake).toHaveBeenCalledWith({
      sentence: { text: S.waiting.text, translation: S.waiting.translation },
      target: { surface: '待って', expected: 'まって' },
      answer: 'もって',
      errorType: 'wrong-kanji',
      confused: { kanji: '待', lookalike: '持' },
    });
    expect(explainMistake).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('unverified')).toBeNull();
    expect(
      within(note)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual([
      '待 and 持 side by side, 1 request, uses AI',
      'One more with 待',
      'Simpler, please, 1 request, uses AI',
      'Quiz me, 1 request, uses AI',
      'Keep in my notes',
      null,
    ]);
    const breakDown = screen.getAllByRole('button', { name: 'Break down the sentence' });
    expect(breakDown).toHaveLength(1);
    await userEvent.click(breakDown[0] as HTMLElement);
    expect(onOpenWord).toHaveBeenCalledWith(4);
  });

  it('marks readings the dictionary did not confirm', async () => {
    const readings = [{ surface: '紹介', reading: 'しょかい', verified: false }];
    await asked({ explainMistake: () => ok({ ...MISTAKE, readings }) });
    const note = await screen.findByRole('note', { name: 'Why this reading' });
    expect(note.textContent).toContain('Not confirmed by the dictionary: 紹介 しょかいunverified');
  });

  it('shows a memory hook when there is one', async () => {
    await asked({ explainMistake: () => ok({ ...MISTAKE, hook: 'You already read 一緒.' }) });
    expect((await screen.findByText('一緒')).getAttribute('lang')).toBe('ja');
  });

  it('says calmly when offline', async () => {
    await asked({ explainMistake: offline });
    expect(
      await screen.findByText(
        "You're offline. Explanations need a connection; the session continues.",
      ),
    ).toBeTruthy();
  });

  it('points to Settings without a key', async () => {
    await asked({ explainMistake: noKey });
    const link = await screen.findByRole('link', { name: 'Settings' });
    expect(link.getAttribute('href')).toBe('/settings/tutor');
    expect(screen.getByRole('status').textContent).toContain(
      'Add a Gemini key in Settings to get explanations.',
    );
  });

  it('keeps the explanation in notes', async () => {
    const { services } = await asked({ explainMistake: () => ok(MISTAKE) });
    const keep = await screen.findByRole('button', { name: 'Keep in my notes' });
    await userEvent.click(keep);
    expect(await screen.findByText('Kept in your notes.')).toBeTruthy();
    expect((keep as HTMLButtonElement).disabled).toBe(true);
    const [note] = await services.repos.notes.all();
    expect(note).toMatchObject({
      title: '待って',
      body: MISTAKE.explanation,
      sentenceId: S.waiting.id,
      itemId: `word:${W.matsu.id}`,
    });
  });

  it('compares side by side below the note', async () => {
    const followUp = vi.fn(() => ok(COMPARE));
    await asked({ explainMistake: () => ok(MISTAKE), followUp });
    await userEvent.click(await screen.findByRole('button', { name: /^待 and 持 side by side, / }));
    const more = await screen.findByRole('note', { name: 'Follow-up' });
    expect(more.textContent).toContain('持 has 扌, a hand.');
    expect(followUp).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'compare',
        surface: '待って',
        previous: MISTAKE.explanation,
      }),
    );
  });

  it('quizzes without a score and shows the right option', async () => {
    await asked({ explainMistake: () => ok(MISTAKE), followUp: () => ok(QUIZ) });
    await userEvent.click(await screen.findByRole('button', { name: /^Quiz me, / }));
    await userEvent.click(await screen.findByRole('button', { name: '間に' }));
    expect(screen.getByText(/It's/).textContent).toContain("It's 間.");
    await userEvent.click(screen.getByRole('button', { name: '間' }));
    expect(screen.getByText("That's it.")).toBeTruthy();
  });

  it('adds only verified i+1 sentences for one more example', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await repos.sentences.delete(S.waitPlain.id);
    const generateSentences = vi.fn(() =>
      ok({
        sentences: [
          { text: S.waitPlain.text, translation: 'I wait for a friend.', target: '待つ' },
          { text: S.student.text, translation: 'A student reads.', target: '待つ' },
          { text: S.came.text, translation: 'A friend came.', target: '待つ' },
        ],
        readings: [
          { surface: '待つ', reading: 'まつ', verified: true },
          { surface: '来', reading: 'こ', verified: false },
        ],
      }),
    );
    await asked({ explainMistake: () => ok(MISTAKE), generateSentences }, repos);
    await userEvent.click(await screen.findByRole('button', { name: 'One more with 待' }));
    // Pack sentences first, no AI (A15); the tutor writes new ones only when asked.
    expect(await screen.findByText(/^(From your sentences:|No other sentence)/)).toBeTruthy();
    expect(generateSentences).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: /^Write a new one with the tutor, / }),
    );
    expect(await screen.findByText('Added to your sentences:')).toBeTruthy();
    expect(screen.getByText(S.waitPlain.text).getAttribute('lang')).toBe('ja');
    expect(screen.queryByText(S.came.text)).toBeNull();
    expect(generateSentences).toHaveBeenCalledWith({
      targets: [{ surface: '待つ', reading: 'まつ', meaning: 'to wait' }],
      knownWords: ['駅', '友達', '本', '読む'],
      count: 3,
    });
    expect(await repos.sentences.get(aiSentenceId(S.waitPlain.text))).toMatchObject({
      source: 'ai',
    });
    expect(await repos.sentences.get(aiSentenceId(S.came.text))).toBeUndefined();
  });

  it('says so honestly when no generated sentence passes', async () => {
    const repos = await readingRepos();
    const generateSentences = () =>
      ok({
        sentences: [{ text: S.came.text, translation: 'A friend came.', target: '待つ' }],
        readings: [{ surface: '来', reading: 'こ', verified: false }],
      });
    await asked({ explainMistake: () => ok(MISTAKE), generateSentences }, repos);
    await userEvent.click(await screen.findByRole('button', { name: 'One more with 待' }));
    await userEvent.click(
      await screen.findByRole('button', { name: /^Write a new one with the tutor, / }),
    );
    expect(
      await screen.findByText('None passed the reading and new-word checks, so nothing was added.'),
    ).toBeTruthy();
  });
});
