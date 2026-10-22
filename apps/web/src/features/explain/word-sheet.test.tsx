import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient, Result } from '../../ai/types.ts';
import { ANSWER, BREAKDOWN, offline, ok, QUIZ, WORD } from '../../test/explain-results.ts';
import { readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { ExplainWordSheet } from './word-sheet.tsx';

/** Token 7 of 駅で友達を待っている間に、本を読みました。 is 間; token 1 is the particle で. */
const AIDA = 7;
const DE = 1;

async function open(ai: Partial<AiClient>, tokenIndex = AIDA) {
  const repos = await readingRepos();
  await track(repos, [[W.aida, 2]], { lesson: 'Tobira 第4課' });
  const onClose = vi.fn();
  const services = fakeServices({ ai: fakeAi(ai), repos });
  renderWithServices(
    <ExplainWordSheet sentence={S.waiting} tokenIndex={tokenIndex} onClose={onClose} />,
    { services },
  );
  const name = `${S.waiting.tokens[tokenIndex]?.surface} in this sentence`;
  return { onClose, services, sheet: screen.getByRole('dialog', { name }) };
}

/** Each task counted, none called unless the test presses a button. */
function counted() {
  const explainWord = vi.fn(() => ok(WORD));
  const breakdownSentence = vi.fn(() => ok(BREAKDOWN));
  const answerQuestion = vi.fn(() => ok(ANSWER));
  const peek = vi.fn(async () => undefined);
  return { explainWord, breakdownSentence, answerQuestion, peek } as const;
}

const rateLimited = (retryAfterMs: number) => (): Promise<Result<never>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

describe('ExplainWordSheet, static first (A13)', () => {
  it('shows the dictionary, the kanji, the grammar and the translation with no AI call', async () => {
    const ai = counted();
    const { sheet, onClose } = await open(ai);
    const dictionary = await within(sheet).findByRole('region', { name: 'In the dictionary' });
    expect(dictionary.textContent).toContain('space; interval');
    const kanji = within(sheet).getByRole('region', { name: 'Its kanji' });
    expect(within(kanji).getByRole('link', { name: '間' }).getAttribute('href')).toBe(
      '/kanji/%E9%96%93',
    );
    const jishoKanji = within(kanji).getByRole('link', { name: 'Open 間 on Jisho (new tab)' });
    expect(jishoKanji.getAttribute('href')).toBe('https://jisho.org/search/%E9%96%93%20%23kanji');
    const jishoWord = within(dictionary).getByRole('link', { name: 'Open 間 on Jisho (new tab)' });
    expect(jishoWord.getAttribute('href')).toBe('https://jisho.org/search/%E9%96%93');
    expect(within(sheet).getByRole('region', { name: 'What it says' }).textContent).toContain(
      S.waiting.translation,
    );
    // The reading as furigana over the heading's kanji (R11), the gloss beside it.
    expect(sheet.querySelector('rt')?.textContent).toBe('あいだ');
    expect(sheet.textContent).toContain('間(あいだ)space; interval');
    expect(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    ).toBeTruthy();
    expect(
      within(sheet).getByRole('button', { name: /^Break down with the tutor, / }),
    ).toBeTruthy();
    expect(ai.explainWord).not.toHaveBeenCalled();
    expect(ai.breakdownSentence).not.toHaveBeenCalled();
    expect(ai.answerQuestion).not.toHaveBeenCalled();
    // Static content only: no AI box until the tutor is asked (D57); the seal only on the
    // presses that send a request (A18).
    expect(sheet.querySelector('[data-ai-block]')).toBeNull();
    const copy = sheet.cloneNode(true) as HTMLElement;
    for (const press of copy.querySelectorAll('[data-ai-action]')) press.remove();
    expect(copy.querySelector('[data-seal]')).toBeNull();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('asks the tutor once about the word, keyed on the word, and never breaks down with it', async () => {
    const ai = counted();
    const { sheet } = await open(ai);
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    const note = await within(sheet).findByRole('note', { name: 'The tutor on 間' });
    expect(note.textContent).toContain('待っている間、本を読んでいた。');
    expect(ai.explainWord).toHaveBeenCalledTimes(1);
    expect(ai.explainWord).toHaveBeenCalledWith({
      sentence: { text: S.waiting.text, translation: S.waiting.translation },
      surface: '間',
      wordId: W.aida.id,
      word: { form: '間', reading: 'あいだ', meanings: ['space; interval'] },
    });
    expect(ai.breakdownSentence).not.toHaveBeenCalled();
    expect(sheet.textContent).toContain('あいだ · while, at some point during');
    expect(sheet.textContent).toContain(
      'Word from Tobira 第4課 · readings checked against the dictionary',
    );
  });

  it('breaks the sentence down only from its own button', async () => {
    const ai = counted();
    const { sheet } = await open(ai);
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Break down with the tutor, / }),
    );
    const built = await within(sheet).findByRole('region', { name: 'How this sentence is built' });
    const chunks = within(built)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(chunks).toEqual([
      '駅でat the station',
      '間にduring that time',
      '本を読みましたI read a book',
    ]);
    expect(ai.breakdownSentence).toHaveBeenCalledTimes(1);
    expect(ai.explainWord).not.toHaveBeenCalled();
  });

  it('says an answer the tutor already gave is saved, without a call (A18)', async () => {
    const ai = {
      ...counted(),
      peek: vi.fn(async (task: string) => (task === 'explainWord' ? WORD : undefined)),
    };
    const { sheet } = await open(ai as Partial<AiClient>);
    const saved = /^Ask the tutor about this word, saved, uses AI: no request$/;
    expect(await within(sheet).findByRole('button', { name: saved })).toBeTruthy();
    expect(within(sheet).getByRole('button', { name: saved }).textContent).toContain('Saved');
    expect(
      within(sheet).getByRole('button', {
        name: /^Break down with the tutor, 1 request, uses AI$/,
      }),
    ).toBeTruthy();
    expect(ai.explainWord).not.toHaveBeenCalled();
  });

  it('marks an unverified reading and does not claim the readings were checked', async () => {
    const reading = { surface: '紹介', reading: 'しょかい', verified: false };
    const { sheet } = await open({ ...counted(), explainWord: () => ok({ ...WORD, reading }) });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    expect((await within(sheet).findAllByText('unverified')).length).toBeGreaterThan(0);
    expect(sheet.textContent).toContain(
      'Word from Tobira 第4課 · some readings could not be checked',
    );
  });

  it('keeps the dictionary entry when offline', async () => {
    const { sheet } = await open({ ...counted(), explainWord: offline });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    expect(
      await within(sheet).findByText(
        "You're offline. Explanations need a connection; the dictionary entry still works.",
      ),
    ).toBeTruthy();
    expect(sheet.textContent).toContain('space; interval');
  });

  it('waits out a rate limit with a countdown, then retries only when pressed (A14)', async () => {
    const explainWord = vi.fn(rateLimited(30_000));
    const { sheet } = await open({ ...counted(), explainWord });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    expect(
      await within(sheet).findByText(/The tutor needs a minute\. You can ask again in 30 s\./),
    ).toBeTruthy();
    const retry = within(sheet).getByRole('button', { name: /^Retry, / }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(explainWord).toHaveBeenCalledTimes(1);
  });

  it('enables Retry once the wait has passed', async () => {
    const explainWord = vi.fn(rateLimited(0));
    const { sheet } = await open({ ...counted(), explainWord });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    const retry = await within(sheet).findByRole('button', { name: /^Retry, / });
    expect(within(sheet).getByText(/You can ask again now/)).toBeTruthy();
    await userEvent.click(retry);
    expect(explainWord).toHaveBeenCalledTimes(2);
  });

  it('runs the chips, the in-sentence question and the question box', async () => {
    const ai = { ...counted(), followUp: () => ok(QUIZ) };
    const { sheet } = await open(ai);
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    await userEvent.click(
      await within(sheet).findByRole('button', { name: /^Quiz me: 間 or 間に\?, / }),
    );
    expect(await within(sheet).findByRole('button', { name: '間に' })).toBeTruthy();
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^What it does in this sentence, / }),
    );
    expect(await within(sheet).findByRole('note', { name: '間 in this sentence' })).toBeTruthy();
    expect(ai.answerQuestion).toHaveBeenLastCalledWith(
      expect.objectContaining({ question: 'What does 間 mean and do in this sentence?' }),
    );
    await userEvent.type(within(sheet).getByLabelText('Ask about 間'), 'Why に?{Enter}');
    expect(await within(sheet).findByRole('note', { name: 'Answer' })).toBeTruthy();
    expect(ai.answerQuestion).toHaveBeenLastCalledWith({
      scope: 'word',
      surface: '間',
      sentence: { text: S.waiting.text, translation: S.waiting.translation },
      question: 'Why に?',
    });
  });

  it('ignores a heading reading the model gave for another surface', async () => {
    const reading = { surface: '間に', reading: 'あいだに', verified: true };
    const { sheet } = await open({ ...counted(), explainWord: () => ok({ ...WORD, reading }) });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    await within(sheet).findByRole('note', { name: 'The tutor on 間' });
    expect(sheet.textContent).toContain('間(あいだ)space; interval');
    expect(sheet.textContent).not.toContain('あいだに ·');
  });

  it('heads a verb with its endings', async () => {
    renderWithServices(<ExplainWordSheet sentence={S.waiting} tokenIndex={4} onClose={vi.fn()} />, {
      services: fakeServices({ ai: fakeAi(counted()) }),
    });
    const sheet = screen.getByRole('dialog', { name: '待って in this sentence' });
    expect(sheet.textContent).toContain('まって');
  });
});

describe('ParticleSheet (G5)', () => {
  it('explains a tapped particle from the app with its uses, and no AI call', async () => {
    const ai = counted();
    const { sheet } = await open(ai, DE);
    const note = within(sheet).getByRole('region', { name: 'で: at, in, by, with' });
    expect(note.textContent).toContain('Where an action happens');
    expect(within(note).getByText('図書館で勉強します。').getAttribute('lang')).toBe('ja');
    expect(within(note).getByRole('link', { name: 'More about で' }).getAttribute('href')).toMatch(
      /^\/grammar\//,
    );
    expect(ai.answerQuestion).not.toHaveBeenCalled();
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about it here, / }),
    );
    expect(await within(sheet).findByRole('note', { name: 'で in this sentence' })).toBeTruthy();
    expect(ai.answerQuestion).toHaveBeenCalledTimes(1);
  });

  it('prefers the note to the dictionary for a particle the pack resolved to a word', async () => {
    const tokens = S.waiting.tokens.map((t, i) => (i === DE ? { ...t, wordId: W.eki.id } : t));
    renderWithServices(
      <ExplainWordSheet sentence={{ ...S.waiting, tokens }} tokenIndex={DE} onClose={vi.fn()} />,
      { services: fakeServices({ ai: fakeAi(counted()), repos: await readingRepos() }) },
    );
    expect(screen.getByRole('region', { name: 'で: at, in, by, with' })).toBeTruthy();
  });
});
