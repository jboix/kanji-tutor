import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type WriteDrill, writeDrill } from '../../domain/drills/index.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { typeKanji } from '../../ui/kanji-drawing.ts';
import type { KanjiDrawSlotProps, Slots } from '../../ui/slots.tsx';
import { DRAW_LATER_MS, drawingQuiet, drawLater } from './draw-later.ts';
import { DrillScreen } from './drill-screen.tsx';

const drill = writeDrill({
  sentence: S.student,
  target: { tokenIndex: 0, wordId: W.gakusei.id, surface: '学生', readings: ['がくせい'] },
  word: W.gakusei,
}) as WriteDrill;

/** The pad stands in as buttons that hand back a drawing. */
function FakePad({ kanji, onAnswer }: KanjiDrawSlotProps) {
  return (
    <>
      <button type="button" onClick={() => onAnswer(kanji.join(''))}>
        Draw it right
      </button>
      <button type="button" onClick={() => onAnswer('学牛')}>
        Draw it wrong
      </button>
    </>
  );
}

const PAD: Slots = { kanjiDraw: FakePad };

async function show(slots: Slots = PAD) {
  const repos = await readingRepos();
  renderWithServices(<DrillScreen drill={drill} topBar={null} onDone={vi.fn()} />, {
    services: fakeServices({ repos }),
    slots,
  });
  return repos;
}

const main = () => document.querySelector('main')?.textContent ?? '';

afterEach(() => {
  drawLater(Date.now() - DRAW_LATER_MS);
  typeKanji(false);
});

describe('Write the kanji', () => {
  it('blanks the word and shows its reading and meaning above the pad', async () => {
    await show();
    expect(screen.getByText('Write the kanji')).toBeTruthy();
    expect(main()).not.toContain('学生');
    expect(main()).toContain('〇〇が本を読む');
    expect(document.querySelector('[data-write-reading]')?.textContent).toBe('がくせい');
    expect(document.querySelector('[data-write-meaning]')?.textContent).toBe('student');
    expect(screen.getByRole('button', { name: 'Draw it right' })).toBeTruthy();
  });

  it('marks a drawing that reads as the word right, and logs it against the word', async () => {
    const repos = await show();
    await userEvent.click(screen.getByRole('button', { name: 'Draw it right' }));
    await waitFor(() => expect(document.querySelector('[data-answer="correct"]')).toBeTruthy());
    expect(main()).toContain('学生が本を読む');
    expect((await repos.reviews.all()).at(-1)).toMatchObject({
      itemId: `word:${W.gakusei.id}`,
      verdict: 'correct',
      mode: 'drill',
    });
  });

  it('shows how a wrong drawing was read, struck, beside the word', async () => {
    await show();
    await userEvent.click(screen.getByRole('button', { name: 'Draw it wrong' }));
    await waitFor(() => expect(screen.getByText('You wrote')).toBeTruthy());
    expect(document.querySelector('del')?.textContent).toBe('学牛');
  });

  it("turns into its typed twin on I can't draw now, for the next 15 minutes", async () => {
    await show();
    await userEvent.click(screen.getByRole('button', { name: "I can't draw now" }));
    expect(screen.getByText('Which word fits? Type its reading')).toBeTruthy();
    expect(document.querySelector('[data-write-reading]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Draw it right' })).toBeNull();
    expect(drawingQuiet()).toBe(true);
    expect(drawingQuiet(Date.now() + DRAW_LATER_MS)).toBe(false);
    await userEvent.type(screen.getByLabelText('Type its reading'), 'gakusei{Enter}');
    await waitFor(() => expect(document.querySelector('[data-answer="correct"]')).toBeTruthy());
  });

  it('is typed from the start when Settings says Type, with nothing to draw', async () => {
    typeKanji(true);
    await show();
    expect(screen.getByText('Which word fits? Type its reading')).toBeTruthy();
    expect(screen.queryByRole('button', { name: "I can't draw now" })).toBeNull();
    expect(screen.getByLabelText('Type its reading')).toBeTruthy();
  });

  it('is typed when no drawing pad is wired', async () => {
    await show({});
    expect(screen.getByLabelText('Type its reading')).toBeTruthy();
  });
});
