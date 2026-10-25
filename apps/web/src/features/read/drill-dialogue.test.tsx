import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GRAMMAR_DIALOGUES } from '../../domain/dialogues/catalogue.ts';
import { type DialogueDrill, dialogueDrill } from '../../domain/drills/index.ts';
import { introduceGrammar } from '../../domain/services/index.ts';
import { NOW, readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { TutorSheetSlotProps } from '../../ui/slots.tsx';
import { DrillScreen } from './drill-screen.tsx';

function FakeSheet(props: TutorSheetSlotProps) {
  return (
    <div role="dialog" aria-label="tutor">
      <p>{props.topic.about}</p>
      <p>{props.topic.sentence.text}</p>
      <p>starters: {props.starters.join(' | ')}</p>
    </div>
  );
}

function osaka(): DialogueDrill {
  const set = GRAMMAR_DIALOGUES.find((s) => s.grammarId === 'koto-ni-naru');
  const dialogue = set?.dialogues.find((d) => d.id === 'koto-ni-naru-osaka');
  const drill = dialogue && dialogueDrill({ grammarId: 'koto-ni-naru', dialogue, seed: 'a' });
  if (!drill) throw new Error('no dialogue drill');
  return drill;
}

async function show() {
  const repos = await readingRepos();
  await introduceGrammar(repos, 'koto-ni-naru', NOW);
  const onDone = vi.fn();
  renderWithServices(<DrillScreen drill={osaka()} topBar={null} onDone={onDone} />, {
    services: fakeServices({ repos }),
    slots: { tutorSheet: FakeSheet },
  });
  return { repos, onDone };
}

const choose = (name: string) =>
  userEvent.click(
    within(screen.getByRole('group', { name: 'Choices' })).getByRole('button', { name }),
  );

describe('"complete the line" on a dialogue', () => {
  it('blanks the line, offers four forms, and keeps the blanked translation back', async () => {
    await show();
    expect(screen.getByText('Complete the line')).toBeTruthy();
    expect(document.querySelector('[data-focus="blank"]')?.textContent).toBe('＿＿＿');
    expect(document.body.textContent).not.toContain('ことになったんです');
    const choices = within(screen.getByRole('group', { name: 'Choices' })).getAllByRole('button');
    expect(choices.map((c) => c.textContent).sort()).toEqual(
      ['ことにした', 'ことになった', 'ようにした', 'ようになった'].sort(),
    );
    const toggle = screen.getByRole('button', { name: 'Show translation' });
    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Mr Tanaka, you look down. What’s wrong?')).toBeTruthy();
    expect(screen.queryByText(/work at the Osaka shop/)).toBeNull();
  });

  it('has the tutor before the answer, about the conversation with its blank', async () => {
    await show();
    await userEvent.click(screen.getByRole('button', { name: 'Explain this conversation' }));
    const sheet = screen.getByRole('dialog', { name: 'tutor' });
    expect(sheet.textContent).toContain('田中：社長が決めて、来月から大阪の店で働く＿＿＿んです。');
    expect(sheet.textContent).not.toContain('〜ことになる');
    expect(sheet.textContent).toContain('starters: Explain this conversation');
  });

  it('marks a miss, shows every translation, the right form and why, then the grammar', async () => {
    const { repos, onDone } = await show();
    await choose('ことにした');
    const miss = document.querySelector('[data-answer="wrong"]');
    expect(miss?.textContent).toContain('Not quite');
    expect(miss?.querySelector('del')?.textContent).toBe('ことにした');
    expect(miss?.textContent).toContain('社長が決めて');
    expect(document.querySelector('[data-focus="missed"]')?.textContent).toBe('ことになった');
    expect(screen.getByText(/work at the Osaka shop/)).toBeTruthy();
    expect((await repos.reviews.all()).at(-1)).toMatchObject({
      itemId: 'grammar:koto-ni-naru',
      verdict: 'wrong',
      answer: 'ことにした',
      expected: 'ことになった',
    });
    expect(screen.queryByRole('button', { name: 'Explain this conversation' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'dialogue', right: false });
  });

  it('turns the form green when right, and reschedules the point', async () => {
    const { repos } = await show();
    const before = (await repos.items.get('grammar:koto-ni-naru'))?.card?.reps ?? 0;
    await choose('ことになった');
    expect(document.querySelector('[data-answer="correct"]')).toBeTruthy();
    expect(document.querySelector('[data-focus="correct"]')?.textContent).toBe('ことになった');
    const after = (await repos.items.get('grammar:koto-ni-naru'))?.card?.reps ?? 0;
    expect(after).toBe(before + 1);
    await userEvent.click(screen.getByRole('button', { name: 'Ask the tutor about 〜ことになる' }));
    expect(screen.getByRole('dialog', { name: 'tutor' }).textContent).toContain(
      'Why ことになった here?',
    );
  });

  it('shows the form after "I don\'t know"', async () => {
    await show();
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    expect(document.querySelector('[data-answer="skipped"]')).toBeTruthy();
    expect(document.querySelector('[data-focus="shown"]')?.textContent).toBe('ことになった');
  });
});
