import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { classOf } from '../../domain/conjugation/index.ts';
import {
  buildDrill,
  conjugationDrill,
  type Drill,
  listeningDrill,
  meaningDrill,
  particleDrill,
  patternDrill,
} from '../../domain/drills/index.ts';
import { introduceGrammar } from '../../domain/services/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { fixturePack } from '../../test/fixture-pack.ts';
import { NOW, readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { DrillScreen } from './drill-screen.tsx';

const line = (i: number): Sentence => {
  const found = fixturePack().sentences.find((s) => s.id === `unit:i-am-a-student:${i}`);
  if (!found) throw new Error(`no line ${i}`);
  return found;
};
const lines = () => fixturePack().sentences.filter((s) => s.id.startsWith('unit:i-am-a-student:'));

async function show(drill: Drill | undefined) {
  if (!drill) throw new Error('no drill');
  const repos = await readingRepos();
  const onDone = vi.fn();
  renderWithServices(<DrillScreen drill={drill} topBar={null} onDone={onDone} />, {
    services: fakeServices({ repos }),
  });
  return { repos, onDone };
}

const cue = (written: string, reading: string) => ({
  written,
  reading,
  cls: classOf(written, undefined, reading),
});
const NOUNS = [W.eki, W.hon, W.gakusei, { ...W.sensei, glosses: ['teacher'] }];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('S4 exercises', () => {
  it('checks a meaning, logs it against the word, and shows the reading after', async () => {
    const drill = meaningDrill({ word: W.eki, others: NOUNS, seed: 'a' });
    const { repos, onDone } = await show(drill);
    expect(screen.getByText('What does it mean?')).toBeTruthy();
    expect(screen.queryByText('えき')).toBeNull();
    const choices = screen.getByRole('group', { name: 'Choices' });
    await userEvent.click(within(choices).getByRole('button', { name: 'station' }));
    expect(await screen.findByText('えき')).toBeTruthy();
    expect(document.querySelector('[data-answer="correct"]')).toBeTruthy();
    expect((await repos.reviews.all()).at(-1)).toMatchObject({
      itemId: `word:${W.eki.id}`,
      mode: 'drill',
      verdict: 'correct',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'meaning', right: true });
  });

  it('asks for the word of a meaning when reversed, the words in Klee One', async () => {
    await show(meaningDrill({ word: W.eki, others: NOUNS, seed: 'a', reverse: true }));
    expect(screen.getByText('Which word means this?')).toBeTruthy();
    const choices = within(screen.getByRole('group', { name: 'Choices' })).getAllByRole('button');
    for (const choice of choices) expect(choice.querySelector('[lang="ja"]')).toBeTruthy();
  });

  it('fills a particle: the blank shut before, what was chosen after', async () => {
    const drill = particleDrill({ sentences: [line(0)], level: 5, seed: 'x' });
    await show(drill);
    expect(document.querySelector('main [lang="ja"]')?.textContent).not.toContain('わたしは');
    const wrong = drill?.choices.find((c) => c !== 'は') ?? '';
    await userEvent.click(screen.getByRole('button', { name: wrong }));
    expect(await screen.findByText('You chose')).toBeTruthy();
    expect(document.querySelector('[data-answer="wrong"]')).toBeTruthy();
  });

  it('checks a pattern drill typed in romaji, with its model line, and reviews the point', async () => {
    const drill = patternDrill({
      grammarId: 'te-mo-ii',
      cues: [cue('行く', 'いく'), cue('食べる', 'たべる')],
      seed: 'a',
    });
    const repos = await readingRepos();
    await introduceGrammar(repos, 'te-mo-ii', NOW);
    renderWithServices(<DrillScreen drill={drill as Drill} topBar={null} onDone={vi.fn()} />, {
      services: fakeServices({ repos }),
    });
    expect(screen.getByText('〜てもいいですか')).toBeTruthy();
    expect(document.querySelector('[data-example]')?.textContent).toContain(
      '食べる → 食べてもいいですか',
    );
    const input = screen.getByLabelText('Type it in kana');
    await userEvent.type(input, 'ittemoiidesuka{Enter}');
    expect(await screen.findByText('It is')).toBeTruthy();
    expect(document.querySelector('[data-answer="correct"]')).toBeTruthy();
    const card = (await repos.items.get('grammar:te-mo-ii'))?.card;
    expect(card?.reps).toBe(1);
  });

  it('shows the right form after a wrong conjugation', async () => {
    const verbs = [{ ...cue('行く', 'いく'), wordId: 'iku' }];
    let drill = conjugationDrill({ verbs, level: 5, seed: '0' });
    for (let i = 1; drill?.form !== 'te' && i < 40; i++) {
      drill = conjugationDrill({ verbs, level: 5, seed: String(i) });
    }
    await show(drill);
    expect(screen.getByText(/Make it the te form/)).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Type it in kana'), 'ite{Enter}');
    expect(await screen.findByRole('deletion')).toBeTruthy();
    const shown = document.querySelector('[data-answer="wrong"] ruby[data-reading="い"]');
    expect(shown?.parentElement?.textContent).toContain('行');
    expect(document.querySelector('[data-answer="wrong"]')?.textContent).toContain('って');
  });

  it('builds a sentence from its pieces, Check only once all are placed', async () => {
    const drill = buildDrill({ sentence: line(6), seed: 'a' });
    await show(drill);
    expect(screen.getByText('Lin works for a company.')).toBeTruthy();
    const check = screen.getByRole('button', { name: 'Check' });
    expect(check.hasAttribute('disabled')).toBe(true);
    const bank = screen.getByRole('group', { name: 'Pieces' });
    for (const piece of ['リンさんは', '人です']) {
      await userEvent.click(within(bank).getByRole('button', { name: piece }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Take back 人です' }));
    for (const piece of ['会社の', '人です']) {
      await userEvent.click(within(bank).getByRole('button', { name: piece }));
    }
    await userEvent.click(check);
    expect(document.querySelector('[data-answer="correct"]')).toBeTruthy();
  });

  it('plays a listening drill and keeps its sentence and meaning back until the answer', async () => {
    const spoken: string[] = [];
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak: (u: { text: string }) => spoken.push(u.text),
    });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        constructor(readonly text: string) {}
      },
    );
    const drill = listeningDrill({ sentence: line(4), others: lines(), seed: 'a' });
    await show(drill);
    await waitFor(() => expect(spoken).toEqual(['リンさんは中国人です。']));
    expect(screen.queryByText('リンさんは中国人です。')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show meaning' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Play the sentence' }));
    expect(spoken).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Lin is Chinese.' }));
    expect(document.querySelector('[data-answer="correct"]')).toBeTruthy();
    expect(document.querySelector('main')?.textContent).toContain('中国人');
  });

  it('shows the sentence of a sentence meaning check, with nothing to play', async () => {
    await show(listeningDrill({ sentence: line(4), others: lines(), seed: 'a', read: true }));
    expect(screen.getByText('What does this sentence mean?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Play the sentence' })).toBeNull();
    expect(document.querySelector('main')?.textContent).toContain('中国人');
  });
});

describe('FormRuby', () => {
  it('puts the reading over the kanji part only', async () => {
    const { splitForm } = await import('./drill-forms.tsx');
    expect(splitForm('学生です', 'がくせいです')).toEqual({
      head: '',
      base: '学生',
      reading: 'がくせい',
      tail: 'です',
    });
    expect(splitForm('お願いしたい', 'おねがいしたい')).toMatchObject({
      head: 'お',
      base: '願',
      reading: 'ねが',
    });
    expect(splitForm('食べてもいいですか', 'たべてもいいですか')).toMatchObject({
      base: '食',
      tail: 'べてもいいですか',
    });
    expect(splitForm('来る', 'くる')).toMatchObject({ base: '来', reading: 'く', tail: 'る' });
  });
});
