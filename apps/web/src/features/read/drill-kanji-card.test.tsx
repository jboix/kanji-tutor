import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type KanjiCardDrill, kanjiCardDrill } from '../../domain/drills/index.ts';
import { K, readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { typeKanji } from '../../ui/kanji-drawing.ts';
import type { KanjiDrawSlotProps, Slots } from '../../ui/slots.tsx';
import { DRAW_LATER_MS, drawLater } from './draw-later.ts';
import { DrillScreen } from './drill-screen.tsx';

const card = (char: string, direction: 'read' | 'write') => {
  const kanji = K.find((k) => k.char === char);
  if (!kanji) throw new Error(char);
  return kanjiCardDrill({ kanji, known: [], direction, others: K, seed: 'a' }) as KanjiCardDrill;
};

function FakePad({ kanji, onAnswer }: KanjiDrawSlotProps) {
  return (
    <button type="button" onClick={() => onAnswer(kanji.join(''))}>
      Draw it
    </button>
  );
}

async function show(drill: KanjiCardDrill, slots: Slots = { kanjiDraw: FakePad }) {
  const repos = await readingRepos();
  renderWithServices(<DrillScreen drill={drill} topBar={null} onDone={vi.fn()} />, {
    services: fakeServices({ repos }),
    slots,
  });
  return repos;
}

afterEach(() => {
  drawLater(Date.now() - DRAW_LATER_MS);
  typeKanji(false);
});

describe('Kanji cards', () => {
  it('reads a kanji: a reading typed in kana, then all its readings', async () => {
    const repos = await show(card('生', 'read'));
    expect(screen.getByText('How is it read?')).toBeTruthy();
    expect(document.querySelector('[data-card-kanji]')?.textContent).toBe('生');
    await userEvent.type(screen.getByLabelText('Type a reading'), 'sei{Enter}');
    await waitFor(() => expect(document.querySelector('[data-answer="correct"]')).toBeTruthy());
    expect(document.querySelector('main')?.textContent).toContain('い(きる)');
    expect(screen.getByRole('button', { name: 'Next card' })).toBeTruthy();
    expect((await repos.reviews.all()).at(-1)).toMatchObject({ itemId: 'kanji:生', mode: 'drill' });
  });

  it('writes a kanji from its readings on the pad', async () => {
    await show(card('待', 'write'));
    expect(screen.getByText('Write the kanji')).toBeTruthy();
    expect(document.querySelector('[data-card-readings]')?.textContent).toContain('タイ');
    expect(document.querySelector('[data-card-kanji]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Draw it' }));
    await waitFor(() => expect(document.querySelector('[data-answer="correct"]')).toBeTruthy());
  });

  it("chooses the kanji among lookalikes when drawing is off, or after I can't draw now", async () => {
    await show(card('待', 'write'));
    await userEvent.click(screen.getByRole('button', { name: "I can't draw now" }));
    expect(screen.getByText('Which kanji is it?')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '持' }));
    await waitFor(() => expect(document.querySelector('[data-answer="wrong"]')).toBeTruthy());
  });

  it('is a choice from the start when Settings says Type', async () => {
    typeKanji(true);
    await show(card('待', 'write'));
    expect(screen.getByRole('button', { name: '待' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Draw it' })).toBeNull();
  });
});
