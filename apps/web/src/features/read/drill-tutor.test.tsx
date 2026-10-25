import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { particleDrill } from '../../domain/drills/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { fixturePack } from '../../test/fixture-pack.ts';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { TutorSheetSlotProps } from '../../ui/slots.tsx';
import { DrillScreen } from './drill-screen.tsx';

const line = (i: number): Sentence => {
  const found = fixturePack().sentences.find((s) => s.id === `unit:i-am-a-student:${i}`);
  if (!found) throw new Error(`no line ${i}`);
  return found;
};

function FakeSheet(props: TutorSheetSlotProps) {
  return (
    <div role="dialog" aria-label="tutor">
      <p>{props.topic.about}</p>
      <p>{props.topic.sentence.text}</p>
      <p>first: {props.first?.question ?? 'none'}</p>
      <p>starters: {props.starters.join(' | ')}</p>
      <button type="button" onClick={props.onClose}>
        close
      </button>
    </div>
  );
}

async function answered() {
  const drill = particleDrill({ sentences: [line(0)], level: 5, seed: 'x' });
  if (!drill) throw new Error('no particle drill');
  const repos = await readingRepos();
  renderWithServices(<DrillScreen drill={drill} topBar={null} onDone={vi.fn()} />, {
    services: fakeServices({ repos }),
    slots: { tutorSheet: FakeSheet },
  });
  expect(document.querySelector('[data-tutor]')).toBeNull();
  const choices = screen.getByRole('group', { name: 'Choices' });
  await userEvent.click(within(choices).getByRole('button', { name: drill.answer }));
  return drill;
}

describe('the tutor after a drill', () => {
  it('sits beside Next once answered and opens on the drill', async () => {
    const drill = await answered();
    await userEvent.click(
      screen.getByRole('button', { name: `Ask the tutor about ${drill.answer}` }),
    );
    const sheet = screen.getByRole('dialog', { name: 'tutor' });
    expect(sheet.textContent).toContain(drill.sentence.text);
    expect(sheet.textContent).toContain('first: none');
    await userEvent.click(within(sheet).getByRole('button', { name: 'close' }));
    expect(screen.queryByRole('dialog', { name: 'tutor' })).toBeNull();
  });

  it('keeps the suggested questions inside the sheet, never beside Next', async () => {
    const drill = await answered();
    const why = `Why ${drill.answer} here?`;
    expect(screen.queryByRole('button', { name: `${why}, 1 request, uses AI` })).toBeNull();
    await userEvent.click(
      screen.getByRole('button', { name: `Ask the tutor about ${drill.answer}` }),
    );
    expect(screen.getByRole('dialog', { name: 'tutor' }).textContent).toContain(why);
  });
});
