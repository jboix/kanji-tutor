import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { knowBasics, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { HintSlotProps, IntroSlotProps, Slots } from '../../ui/slots.tsx';
import { ReadScreen } from './read-screen.tsx';

async function waitingRepos(explainFirst?: boolean): Promise<Repos> {
  const settings = explainFirst === undefined ? {} : { explainFirst };
  const repos = await readingRepos({ sound: false, learnerLevel: 3, ...settings });
  await knowBasics(repos);
  for (const id of [S.waitPlain.id, S.came.id, S.student.id]) await repos.sentences.delete(id);
  await track(repos, [[W.matsu, 2]]);
  return repos;
}

function Intro({ target, onDone }: IntroSlotProps) {
  return (
    <button type="button" onClick={onDone}>
      Intro for {target.surface}
    </button>
  );
}

function Hint({ target, onShowReading, onClose }: HintSlotProps) {
  return (
    <div role="dialog" aria-label={`Hint ${target.surface}`}>
      {onShowReading && (
        <button type="button" onClick={onShowReading}>
          Show the reading
        </button>
      )}
      <button type="button" onClick={onClose}>
        Close hint
      </button>
    </div>
  );
}

const SLOTS: Slots = {
  newItemIntro: Intro,
  targetHint: Hint,
  teachingCard: ({ target, grade }) => (
    <p>
      Teaching {target.surface} {grade.skipped ? 'after a skip' : 'after a miss'}
    </p>
  ),
  sentenceHelp: ({ step }) => <p>Help at step {step}</p>,
  sentenceWrapUp: ({ sentence }) => <p>Wrap-up of {sentence.id}</p>,
};

async function open(slots: Slots = SLOTS, explainFirst?: boolean) {
  const repos = await waitingRepos(explainFirst);
  renderWithServices(<ReadScreen />, { services: fakeServices({ repos }), slots, path: '/read' });
  return repos;
}

describe('teach slots in a session', () => {
  it('skips the intro and shows a "New" chip in the help bar when explanations are off (L7)', async () => {
    const chip: Slots['newWordChip'] = ({ target, answered }) => (
      <button type="button">
        Chip {target.surface} {answered ? 'answered' : 'open'}
      </button>
    );
    await open({ ...SLOTS, newWordChip: chip }, false);
    expect(await screen.findByLabelText('Reading of 待って')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Intro for 待っ' })).toBeNull();
    const bar = document.querySelector('[data-exercise-help]') as HTMLElement;
    expect(bar.textContent).toContain('Chip 待っ open');
  });

  it('keeps the chip out of the help bar while explanations come first', async () => {
    const chip: Slots['newWordChip'] = () => <button type="button">Chip</button>;
    await open({ ...SLOTS, newWordChip: chip });
    await userEvent.click(await screen.findByRole('button', { name: 'Intro for 待っ' }));
    await screen.findByLabelText('Reading of 待って');
    expect(screen.queryByRole('button', { name: 'Chip' })).toBeNull();
  });

  it('shows the intro before the exercise, then the exercise after onDone (L1)', async () => {
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Intro for 待っ' }));
    expect(await screen.findByLabelText('Reading of 待って')).toBeTruthy();
    expect(screen.getByText('Help at step 0')).toBeTruthy();
  });

  it('opens the hint on an unanswered target; "Show the reading" is the skip (L2)', async () => {
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Intro for 待っ' }));
    await screen.findByLabelText('Reading of 待って');
    await userEvent.click(screen.getByRole('button', { name: '待っ' }));
    const sheet = await screen.findByRole('dialog', { name: 'Hint 待っ' });
    await userEvent.click(sheet.querySelector('button') as HTMLButtonElement);
    expect(await screen.findByText(/Here it is:/)).toBeTruthy();
    expect(screen.getByText('Teaching 待っ after a skip')).toBeTruthy();
    expect(screen.queryByText('Help at step 0')).toBeNull();
  });

  it("shows the wrap-up only after the sentence's last target (L5)", async () => {
    await open();
    const wrapUp = () => screen.queryByText(`Wrap-up of ${S.waiting.id}`);
    for (let step = 0; step < 3; step++) {
      await userEvent.click(await screen.findByRole('button', { name: /^Intro for/ }));
      await userEvent.click(await screen.findByRole('button', { name: "I don't know" }));
      const next = await screen.findByRole('button', { name: /^Next (word|sentence)$/ });
      if (next.textContent === 'Next sentence') break;
      expect(wrapUp()).toBeNull();
      await userEvent.click(next);
    }
    expect(wrapUp()).toBeTruthy();
  });

  it('puts the teaching card under a miss too', async () => {
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Intro for 待っ' }));
    await userEvent.type(await screen.findByLabelText('Reading of 待って'), 'motte{Enter}');
    expect(await screen.findByText('Teaching 待っ after a miss')).toBeTruthy();
  });

  it('keeps targets untappable before answering without the hint slot (D26)', async () => {
    const repos = await open({});
    await screen.findByLabelText('Reading of 待って');
    expect(screen.queryByRole('button', { name: '待っ' })).toBeNull();
    expect(vi.isMockFunction(repos.items.get)).toBe(false);
  });
});
