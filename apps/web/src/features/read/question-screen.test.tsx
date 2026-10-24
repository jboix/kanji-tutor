import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  type ChoiceQuestion,
  comprehensionSet,
  type OrderQuestion,
  passageCard,
} from '../../domain/questions/index.ts';
import type { Repos } from '../../domain/repos.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ComprehensionView } from './question-comprehension.tsx';
import { QuestionCardScreen, QuestionScreen, type SessionQuestion } from './question-screen.tsx';

const reading: ChoiceQuestion = {
  id: 'q:kanji-reading:s-wait:4',
  kind: 'kanji-reading',
  section: '問題 · 漢字読み',
  stem: { before: '駅で友達を', target: '待って', after: 'いる。', mark: 'underline' },
  options: [
    { text: 'まて', note: 'まて drops the small っ.', slip: 'sokuon' },
    { text: 'まって', note: '待って is read まって: "to wait".' },
    { text: 'まっで', note: 'まっで voices て as で.', slip: 'rendaku' },
    { text: 'たいって', note: 'たいって reads 待 as タイ; here it is ま.', slip: 'other' },
  ],
  answer: 1,
  itemId: `word:${W.matsu.id}`,
  sentenceId: 's-wait',
  translation: 'While I was waiting for a friend at the station…',
};

const grammar: ChoiceQuestion = {
  ...reading,
  id: 'q:grammar-form:late:sugiru',
  kind: 'grammar-form',
  section: '問題 · 文法形式の判断',
  stem: { before: '遅', target: 'すぎる', after: '。', mark: 'blank' },
  options: ['すぎる', 'ほど', '全然', 'てたまらない'].map((text) => ({
    text,
    note: `${text} note`,
  })),
  answer: 0,
  itemId: 'grammar:sugiru',
  translation: "It's too late.",
  hint: "It's ___ late.",
};

const order: OrderQuestion = {
  id: 'q:sentence-order:mine:0',
  kind: 'sentence-order',
  section: '問題 · 文の組み立て',
  before: '',
  after: '。',
  star: 2,
  options: ['本は', '私の', '赤い', '古い'].map((text) => ({ text, note: `${text} goes…` })),
  order: [1, 3, 0, 2],
  answer: 0,
  itemId: 'word:w',
  sentenceId: 'mine',
};

async function show(question: SessionQuestion, repos?: Repos) {
  const onDone = vi.fn();
  const services = fakeServices({ repos: repos ?? (await readingRepos()) });
  renderWithServices(<QuestionScreen question={question} topBar={null} onDone={onDone} />, {
    services,
  });
  return { onDone, repos: services.repos };
}

const option = (name: RegExp) =>
  within(screen.getByRole('list', { name: 'Options' })).getByRole('button', { name });

describe('a 4-option question', () => {
  it('shows the section, the underlined word and numbered options', async () => {
    await show(reading);
    expect(screen.getByText('問題 · 漢字読み')).toBeTruthy();
    expect(screen.getByText('待って').tagName).toBe('SPAN');
    expect(option(/^1\s*まて$/)).toBeTruthy();
    expect(screen.queryByText(reading.translation ?? '')).toBeNull();
  });

  it('marks a wrong choice, explains every option and records the slip', async () => {
    const { onDone, repos } = await show(reading);
    await userEvent.click(option(/まて$/));
    expect(await screen.findByText('You chose')).toBeTruthy();
    expect(screen.getByRole('deletion').textContent).toBe('まて');
    const why = screen.getByRole('list', { name: 'Why each option' });
    expect(within(why).getAllByRole('listitem')).toHaveLength(4);
    expect(why.textContent).toContain('drops the small');
    expect(document.querySelector('[data-answer="wrong"]')).toBeTruthy();
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({
      mode: 'drill',
      questionKind: 'kanji-reading',
      errorType: 'sokuon',
    });
    expect(option(/まって$/).getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'kanji-reading', right: false });
  });

  it('turns a right choice green with a check', async () => {
    const { onDone } = await show(reading);
    await userEvent.click(option(/まって$/));
    expect(await screen.findByText('The answer is')).toBeTruthy();
    expect(document.querySelector('[data-answer="correct"]')).toBeTruthy();
    expect(document.querySelector('[data-option="right"] [data-check]')).toBeTruthy();
    expect(screen.getByText(reading.translation ?? '')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'kanji-reading', right: true });
  });

  it('offers no meaning before a blank is answered when it cannot be masked', async () => {
    const { hint: _hint, ...unmasked } = grammar;
    await show(unmasked);
    expect(screen.queryByRole('button', { name: 'Show meaning' })).toBeNull();
  });

  it('shows a blank with its masked meaning one press away (U6), and skips quietly', async () => {
    const { repos } = await show(grammar);
    expect(document.querySelector('[data-blank]')).toBeTruthy();
    expect(screen.queryByText("It's ___ late.")).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show meaning' }));
    expect(screen.getByText("It's ___ late.")).toBeTruthy();
    expect(screen.queryByText("It's too late.")).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    expect(await screen.findByText('Here it is:')).toBeTruthy();
    expect(screen.getByText("It's too late.")).toBeTruthy();
    expect(document.querySelector('[data-answer="skipped"]')).toBeTruthy();
    expect(document.querySelector('[data-blank]')).toBeNull();
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({ skipped: true, itemId: 'grammar:sugiru' });
  });
});

describe('a ★ order question', () => {
  it('fills slots from chips, gives a piece back, and checks the ★ slot', async () => {
    const { onDone } = await show(order);
    const check = screen.getByRole('button', { name: 'Check' });
    expect(check.hasAttribute('disabled')).toBe(true);
    const chip = (text: string) =>
      within(screen.getByRole('list', { name: 'Pieces' })).getByRole('button', {
        name: new RegExp(`${text}$`),
      });
    await userEvent.click(chip('私の'));
    await userEvent.click(chip('本は'));
    expect(screen.getByRole('button', { name: 'Slot 2: 本は' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Slot 2: 本は' }));
    expect(screen.getByRole('button', { name: 'Slot 2, empty' })).toBeTruthy();
    for (const text of ['古い', '本は', '赤い']) await userEvent.click(chip(text));
    expect(screen.getByRole('button', { name: 'Slot 3 ★: 本は' })).toBeTruthy();
    await userEvent.click(check);
    expect(await screen.findByText('The answer is')).toBeTruthy();
    expect(document.querySelector('main')?.textContent).toContain('私の古い本は赤い。');
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'sentence-order', right: true });
  });

  it('keeps the closing punctuation with the last slot, so it never wraps alone (U8)', async () => {
    await show({ ...order, after: '？か' });
    const last = screen.getByRole('button', { name: 'Slot 4, empty' });
    const keep = last.parentElement;
    expect(keep?.tagName).toBe('SPAN');
    expect(keep?.textContent?.endsWith('？')).toBe(true);
    expect(keep?.nextSibling?.textContent).toBe('か');
  });
});

const passage = comprehensionSet({
  id: 'walk',
  sentences: [
    { ja: '私は毎朝、駅まで歩きます。', en: 'I walk to the station every morning.' },
    { ja: 'それは健康のためです。', en: 'That is for my health.' },
  ],
  questions: [
    {
      kind: 'reason',
      prompt: 'なぜ歩きますか。',
      options: ['健康のため', '遅れたから', '駅が近いから', '雨だから'],
      answer: 0,
      evidence: 1,
      explanation: 'Line 2: それは健康のためです。',
    },
    {
      kind: 'content',
      prompt: 'どこまで歩きますか。',
      options: ['学校', '駅', '家', '店'],
      answer: '駅',
      evidence: 0,
      explanation: 'Line 1: 駅まで.',
    },
  ],
});

describe('a 読解 passage', () => {
  it('asks one question at a time and highlights the proving line', async () => {
    if (!passage) throw new Error('fixture passage');
    const onDone = vi.fn();
    renderWithServices(<ComprehensionView set={passage} onDone={onDone} />);
    expect(screen.getByRole('region', { name: 'Passage' }).textContent).toContain('健康');
    expect(document.querySelector('[data-evidence]')).toBeNull();
    await userEvent.click(option(/健康のため$/));
    await waitFor(() =>
      expect(document.querySelector('[data-evidence]')?.textContent).toBe('それは健康のためです。'),
    );
    expect(screen.getByText('Line 2: That is for my health.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Next question' }));
    expect(screen.getByText('どこまで歩きますか。')).toBeTruthy();
    await userEvent.click(option(/学校$/));
    await userEvent.click(await screen.findByRole('button', { name: 'Done' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'comprehension', right: false });
  });

  it('renders a passage card in the session', async () => {
    if (!passage) throw new Error('fixture passage');
    renderWithServices(
      <QuestionCardScreen card={passageCard(passage)} topBar={null} onDone={vi.fn()} />,
    );
    expect(screen.getByText('問題 · 読解')).toBeTruthy();
    expect(screen.getByText('なぜ歩きますか。')).toBeTruthy();
  });
});
