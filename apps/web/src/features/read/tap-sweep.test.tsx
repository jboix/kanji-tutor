/**
 * The U5/U6 sweep: every exercise kind renders its words tappable, keeps the answer
 * shut until it is given, never lets a sheet show it, and (読解 aside) has the help bar with the
 * translation hidden until "Show meaning".
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { Drill } from '../../domain/drills/index.ts';
import type {
  ChoiceQuestion,
  ComprehensionSet,
  OrderQuestion,
} from '../../domain/questions/index.ts';
import type { Word } from '../../domain/types.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import type { Slots, WordSheetSlotProps } from '../../ui/slots.tsx';
import { DrillScreen } from './drill-screen.tsx';
import { ComprehensionView } from './question-comprehension.tsx';
import { QuestionScreen } from './question-screen.tsx';
import { SessionView } from './session-view.tsx';

/** 駅で友達を待っている間に、本を読みました。 */
const sentence = { ...S.waiting, translation: 'I read while waiting.' };
const TEXT = sentence.text;
/** The session card the question sits on. */
const card = { sentence, targets: [], reason: 'drill' as const };
const target = {
  tokenIndex: 4,
  itemId: `word:${W.matsu.id}` as const,
  wordId: W.matsu.id,
  surface: '待っ',
  readings: ['まっ'],
};

function FakeSheet({ sentence: shown, beforeAnswer }: WordSheetSlotProps) {
  return (
    <div role="dialog" aria-label="Word sheet" data-before={String(beforeAnswer === true)}>
      {shown.text}
      {shown.translation}
    </div>
  );
}

const slots: Slots = { wordSheet: FakeSheet };
const words: readonly Word[] = Object.values(W);
const lang = fakeLang({
  lookupWord: async (q) => words.filter((w) => w.forms.includes(q)),
  // The worker, for text that is not one pack word: one token here.
  tokenize: async (text) => [{ surface: text, reading: '', base: text, pos: 'verb', start: 0 }],
});

async function show(ui: ReactElement) {
  const services = fakeServices({ repos: await readingRepos(), lang });
  renderWithServices(ui, { services, slots });
  return services;
}

const word = (name: string) => screen.queryByRole('button', { name });

/** Taps 駅 and returns what the sheet shows, then closes it. */
async function sheetOfEki() {
  const eki = word('駅');
  if (!eki) throw new Error('駅 is not tappable');
  await userEvent.click(eki);
  const sheet = screen.getByRole('dialog', { name: 'Word sheet' });
  return { text: sheet.textContent ?? '', before: sheet.dataset.before };
}

const base = {
  section: '問題',
  answer: 0,
  sentenceId: sentence.id,
  translation: 'I read while waiting.',
};
const opts = (texts: string[]) => texts.map((text) => ({ text, note: `${text} note` }));

const choice = (q: Partial<ChoiceQuestion> & Pick<ChoiceQuestion, 'kind' | 'stem'>) =>
  ({ id: `q:${q.kind}`, options: opts(['a', 'b', 'c', 'd']), ...base, ...q }) as ChoiceQuestion;

const AFTER_MATTE = 'いる間に、本を読みました。';
const KINDS: { q: ChoiceQuestion; hidden: string; locked: string; option?: string }[] = [
  {
    q: choice({
      kind: 'kanji-reading',
      stem: { before: '駅で友達を', target: '待っ', after: `て${AFTER_MATTE}`, mark: 'underline' },
      options: opts(['まっ', 'もっ', 'まち', 'たい']),
    }),
    hidden: 'まっ',
    locked: '待っ',
  },
  {
    q: choice({
      kind: 'orthography',
      stem: { before: '駅で友達を', target: 'まっ', after: `て${AFTER_MATTE}`, mark: 'underline' },
      options: opts(['待っ', '持っ', '侍っ', '時っ']),
    }),
    hidden: '待',
    locked: '待っ',
    option: '持っ',
  },
  {
    q: choice({
      kind: 'context-word',
      stem: {
        before: '駅で',
        target: '友達',
        after: 'を待っている間に、本を読みました。',
        mark: 'blank',
      },
      options: opts(['友達', '本', '間', '学生']),
      hint: 'I read while ___.',
    }),
    hidden: '友達',
    locked: '友達',
    option: '学生',
  },
  {
    q: choice({
      kind: 'grammar-form',
      stem: { before: TEXT.slice(0, 17), target: 'ました', after: '。', mark: 'blank' },
      options: opts(['ました', 'ません', 'ます', 'ましょう']),
      hint: 'I read while ___.',
    }),
    hidden: 'ました',
    locked: '読み',
  },
];

describe('JLPT questions (J1–J4): tappable, shut until answered', () => {
  for (const { q, hidden, locked, option } of KINDS) {
    it(`${q.kind}: words around the span open, the span and options stay shut`, async () => {
      await show(<QuestionScreen question={q} card={card} topBar={null} onDone={() => {}} />);
      if (q.kind !== 'grammar-form') expect(word(locked)).toBeNull();
      if (option) expect(word(option)).toBeNull();
      const before = await sheetOfEki();
      expect(before.before).toBe('true');
      expect(before.text).not.toContain(q.kind === 'kanji-reading' ? sentence.translation : hidden);
      expect(before.text).not.toContain(sentence.translation);
      await userEvent.keyboard('{Escape}');
    });

    it(`${q.kind}: everything opens once answered`, async () => {
      await show(<QuestionScreen question={q} card={card} topBar={null} onDone={() => {}} />);
      const list = screen.getByRole('list', { name: 'Options' });
      await userEvent.click(within(list).getAllByRole('button')[1] as HTMLElement);
      expect(await screen.findAllByRole('button', { name: '待っ' })).not.toHaveLength(0);
      if (option) expect(await within(list).findByRole('button', { name: option })).toBeTruthy();
      if (q.kind === 'kanji-reading')
        expect(within(list).queryByRole('button', { name: 'もっ' })).toBeNull();
    });
  }
});

const order: OrderQuestion = {
  id: 'q:sentence-order',
  kind: 'sentence-order',
  ...base,
  before: '駅で',
  after: '、本を読みました。',
  star: 1,
  options: opts(['待って', '友達を', '間に', 'いる']),
  order: [1, 0, 3, 2],
};

describe('文の組み立て (J5)', () => {
  it('opens the words around the slots, never the pieces, until checked', async () => {
    await show(<QuestionScreen question={order} card={card} topBar={null} onDone={() => {}} />);
    expect(word('友達')).toBeNull();
    const sheet = await sheetOfEki();
    expect(sheet.before).toBe('true');
    expect(sheet.text).not.toContain('友達');
  });
});

const lookalike: Drill = {
  kind: 'lookalike',
  sentence,
  tokenIndex: 4,
  at: 5,
  wordId: W.matsu.id,
  itemId: `word:${W.matsu.id}`,
  answer: '待',
  choices: [
    { char: '待', readings: ['タイ'] },
    { char: '持', readings: ['ジ'] },
  ],
  confused: false,
};

const cloze: Drill = {
  kind: 'cloze',
  sentence,
  grammarId: 'mashita',
  itemId: 'grammar:mashita',
  meaning: 'did',
  start: 17,
  end: 20,
  choices: [
    { grammarId: 'mashita', pattern: 'ました' },
    { grammarId: 'masen', pattern: 'ません' },
  ],
};

describe('drills (R8)', () => {
  it('lookalike: the blank and the rest of its word stay shut, the sheet never has the kanji', async () => {
    await show(<DrillScreen drill={lookalike} topBar={null} onDone={() => {}} />);
    expect(word('っ')).toBeNull();
    const sheet = await sheetOfEki();
    expect(sheet.text).not.toContain('待');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: '持' }));
    expect(await screen.findByRole('button', { name: /^待\s*\(?ま\)?\s*っ$/ })).toBeTruthy();
  });

  it('cloze: the pattern is masked in the sheet until answered', async () => {
    await show(<DrillScreen drill={cloze} topBar={null} onDone={() => {}} />);
    const sheet = await sheetOfEki();
    expect(sheet.text).not.toContain('ました');
  });

  it('many readings: a word opens only once it is answered', async () => {
    const drill: Drill = {
      kind: 'readings',
      kanji: '生',
      items: [
        {
          wordId: W.gakusei.id,
          itemId: `word:${W.gakusei.id}`,
          form: '学生',
          kanjiReading: 'セイ',
          readings: ['がくせい'],
        },
        {
          wordId: W.issho.id,
          itemId: `word:${W.issho.id}`,
          form: '一生',
          kanjiReading: 'ショウ',
          readings: ['いっしょう'],
        },
      ],
    };
    await show(<DrillScreen drill={drill} topBar={null} onDone={() => {}} />);
    expect(word('学生')).toBeNull();
    await userEvent.type(screen.getByRole('textbox'), 'gakusei{Enter}');
    expect(await screen.findByRole('button', { name: '学生' })).toBeTruthy();
    expect(word('一生')).toBeNull();
  });
});

describe('読解 (placement: placement-tap.test.tsx)', () => {
  const set = (type: 'content' | 'phrase-meaning'): ComprehensionSet => ({
    id: 'unit:sweep',
    sentences: [{ ja: TEXT, en: 'I read while waiting.' }],
    questions: [
      {
        id: `q:comprehension:${type}`,
        kind: 'comprehension',
        type,
        question: '何をしましたか。',
        evidence: 0,
        ...base,
        options: opts(['本を読んだ', '駅に行った', '友達を待った', '寝た']),
      },
    ],
  });

  async function passage(type: 'content' | 'phrase-meaning') {
    const services = fakeServices({ repos: await readingRepos(), lang });
    await services.repos.sentences.put({ ...sentence, id: 'unit:sweep:0' });
    renderWithServices(<ComprehensionView set={set(type)} onDone={() => {}} />, {
      services,
      slots,
    });
  }

  it('読解: the passage opens in no-spoil mode, no help bar', async () => {
    await passage('content');
    expect(await screen.findByRole('button', { name: '駅' })).toBeTruthy();
    expect((await sheetOfEki()).before).toBe('true');
    expect(document.querySelector('[data-exercise-help]')).toBeNull();
  });

  it('読解: a phrase-meaning question keeps the passage shut until answered', async () => {
    await passage('phrase-meaning');
    await screen.findByText(TEXT);
    expect(word('駅')).toBeNull();
  });
});

describe('the help bar (U6)', () => {
  // Blank questions (J3, J4) show only their masked hint before the answer.
  const hints = new Map<string, string>(
    KINDS.flatMap(({ q }) => (q.hint ? [[q.kind, q.hint] as const] : [])),
  );
  const screens: [string, () => ReactElement][] = [
    ...KINDS.map(({ q }): [string, () => ReactElement] => [
      q.kind,
      () => <QuestionScreen question={q} card={card} topBar={null} onDone={() => {}} />,
    ]),
    [
      'sentence-order',
      () => <QuestionScreen question={order} card={card} topBar={null} onDone={() => {}} />,
    ],
    [
      'typed reading',
      () => (
        <SessionView
          card={{ sentence, targets: [target], reason: 'due' }}
          step={0}
          answered={undefined}
          allFurigana={false}
          onSkip={() => {}}
        />
      ),
    ],
    ['lookalike', () => <DrillScreen drill={lookalike} topBar={null} onDone={() => {}} />],
    ['cloze', () => <DrillScreen drill={cloze} topBar={null} onDone={() => {}} />],
  ];
  for (const [name, ui] of screens) {
    it(`${name}: the bar is there, the meaning hidden until pressed`, async () => {
      await show(ui());
      expect(document.querySelector('[data-exercise-help]')).toBeTruthy();
      const meaning = hints.get(name) ?? 'I read while waiting.';
      expect(screen.queryByText(meaning)).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Show meaning' }));
      expect(screen.getByText(meaning)).toBeTruthy();
      // Typed reading has "I don't know" under its answer field instead (AnswerActions).
      const skip = screen.queryByRole('button', { name: "I don't know" });
      expect(skip !== null).toBe(name !== 'typed reading');
    });
  }
});
