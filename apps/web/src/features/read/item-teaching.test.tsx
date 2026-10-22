import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClozeDrill, ReadingsDrill } from '../../domain/drills/index.ts';
import type { ChoiceQuestion } from '../../domain/questions/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { drillRepos } from '../../test/drill-fixtures.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { GrammarIntroSlotProps, TeachingSlotProps } from '../../ui/slots.tsx';
import { DrillScreen } from './drill-screen.tsx';
import { QuestionScreen } from './question-screen.tsx';

function Teaching({ target, grade }: TeachingSlotProps) {
  return (
    <section aria-label="Teaching">
      {target.itemId} {target.surface} {grade.skipped ? 'skipped' : grade.verdict}
    </section>
  );
}

function GrammarIntro({ grammarId, compact }: GrammarIntroSlotProps) {
  return <section aria-label="Grammar">{`${grammarId} ${compact ? 'compact' : 'full'}`}</section>;
}

const slots = { teachingCard: Teaching, grammarIntro: GrammarIntro };

const reading: ChoiceQuestion = {
  id: 'q:kanji-reading:s-wait:4',
  kind: 'kanji-reading',
  section: '問題 · 漢字読み',
  stem: { before: '駅で友達を', target: '待って', after: 'いる。', mark: 'underline' },
  options: ['まて', 'まって', 'まっで', 'たいって'].map((text) => ({ text, note: text })),
  answer: 1,
  itemId: `word:${W.matsu.id}`,
  sentenceId: 's-wait',
};

const grammar: ChoiceQuestion = {
  ...reading,
  id: 'q:grammar-form:late:sugiru',
  kind: 'grammar-form',
  stem: { before: '遅', target: 'すぎる', after: '。', mark: 'blank' },
  options: ['すぎる', 'ほど', '全然', 'てたまらない'].map((text) => ({ text, note: text })),
  answer: 0,
  itemId: 'grammar:sugiru',
};

const cardOf = (question: ChoiceQuestion): SessionCard => ({
  sentence: S.waiting,
  targets: [],
  reason: 'drill',
  question,
});

async function showQuestion(question: ChoiceQuestion) {
  const services = fakeServices({ repos: await readingRepos() });
  const ui = (
    <QuestionScreen question={question} card={cardOf(question)} topBar={null} onDone={vi.fn()} />
  );
  renderWithServices(ui, { services, slots });
}

const option = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^\\d\\s*${name}$`) });

describe('teaching under a question answer (L4, issue 40)', () => {
  it('teaches the word under a skip', async () => {
    await showQuestion(reading);
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    const card = await screen.findByRole('region', { name: 'Teaching' });
    expect(card.textContent).toBe(`word:${W.matsu.id} 待って skipped`);
  });

  it('teaches the word under a wrong answer', async () => {
    await showQuestion(reading);
    await userEvent.click(option('まて'));
    expect((await screen.findByRole('region', { name: 'Teaching' })).textContent).toContain(
      'wrong',
    );
  });

  it('shows nothing extra under a right answer', async () => {
    await showQuestion(reading);
    await userEvent.click(option('まって'));
    await screen.findByText(/The answer is|Here it is/);
    expect(screen.queryByRole('region', { name: 'Teaching' })).toBeNull();
  });

  it('shows "about this grammar" in its compact form for a grammar question', async () => {
    await showQuestion(grammar);
    await userEvent.click(option('ほど'));
    const about = await screen.findByRole('region', { name: 'Grammar' });
    expect(about.textContent).toBe('sugiru compact');
    expect(screen.queryByRole('region', { name: 'Teaching' })).toBeNull();
  });
});

describe('teaching under a drill answer (L4, issue 40)', () => {
  const card: SessionCard = { sentence: S.waiting, targets: [], reason: 'drill' };

  async function showDrill(drill: ReadingsDrill | ClozeDrill) {
    const services = fakeServices({ repos: await drillRepos() });
    const ui = (
      <DrillScreen drill={drill} card={{ ...card, drill }} topBar={null} onDone={vi.fn()} />
    );
    renderWithServices(ui, { services, slots });
  }

  it('teaches the word of a missed readings step', async () => {
    const item = { wordId: W.ikiru.id, itemId: `word:${W.ikiru.id}` as const, form: '生きる' };
    await showDrill({
      kind: 'readings',
      kanji: '生',
      items: [{ ...item, kanjiReading: 'い.きる', readings: ['いきる'] }],
    });
    await userEvent.type(screen.getByLabelText('Reading of 生きる'), 'nama{Enter}');
    const teaching = await screen.findByRole('region', { name: 'Teaching' });
    expect(teaching.textContent).toContain(`word:${W.ikiru.id} 生きる`);
  });

  it('shows the grammar for a skipped cloze', async () => {
    await showDrill({
      kind: 'cloze',
      sentence: S.waiting,
      grammarId: 'ている',
      itemId: 'grammar:ている',
      meaning: 'ongoing action',
      start: 7,
      end: 10,
      choices: [
        { grammarId: 'ながら', pattern: 'ながら' },
        { grammarId: 'ている', pattern: 'ている' },
      ],
    });
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    expect((await screen.findByRole('region', { name: 'Grammar' })).textContent).toBe(
      'ている compact',
    );
  });
});

describe('question translations in the learner language (N9, issue 44)', () => {
  const late = { ...grammar, sentenceId: 's-late', translation: "It's too late." };
  const sentence = {
    ...S.waiting,
    id: 's-late',
    translation: "It's too late.",
    translations: { fr: 'Il est trop tard.' },
  };

  async function show(language: 'fr' | 'es') {
    const services = fakeServices({ repos: await readingRepos() });
    const card = { ...cardOf(late), sentence };
    const ui = <QuestionScreen question={late} card={card} topBar={null} onDone={vi.fn()} />;
    renderWithServices(ui, { services, slots, language });
    // A blank's full translation shows once it is answered (U6).
    const label = language === 'fr' ? 'Je ne sais pas' : 'No lo sé';
    await userEvent.click(await screen.findByRole('button', { name: label }));
  }

  it("shows the pack's French translation, unmarked", async () => {
    await show('fr');
    expect(await screen.findByText('Il est trop tard.')).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('marks the English translation "(en)" when the pack has none', async () => {
    await show('es');
    const line = await screen.findByText("It's too late.");
    expect(line.querySelector('[role="note"]')?.textContent).toBe('(en)');
  });
});
