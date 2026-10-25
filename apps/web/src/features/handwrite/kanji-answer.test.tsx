import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithServices } from '../../test/render.tsx';
import { KanjiAnswer, readDrawing } from './kanji-answer.tsx';
import type { Pattern } from './recognizer/geometry.ts';
import type { Candidate, Recognizer } from './recognizer/index.ts';
import { SAMPLES } from './recognizer/sample-strokes.ts';

function draw(strokes: Pattern) {
  const canvas = screen.getByRole('img', { name: /Drawing area/ });
  const at = ([x, y]: readonly [number, number]) => ({ clientX: x, clientY: y, isPrimary: true });
  for (const stroke of strokes) {
    const [first, ...rest] = stroke;
    if (!first) continue;
    fireEvent.pointerDown(canvas, { ...at(first), pointerId: 1, button: 0 });
    for (const point of rest) fireEvent.pointerMove(canvas, at(point));
    fireEvent.pointerUp(canvas, at(stroke.at(-1) ?? first));
  }
}

const ranking = (chars: string[]): Recognizer => ({
  recognize: (_strokes, limit = 10): Candidate[] =>
    chars.slice(0, limit).map((char, i) => ({ char, score: 10 + i })),
});

describe('readDrawing', () => {
  it('reads a drawing as the kanji meant when it ranks in the top three', () => {
    const strokes = SAMPLES.待 ?? [];
    expect(readDrawing(ranking(['持', '待', '特']), strokes, '待')).toBe('待');
    expect(readDrawing(ranking(['持', '特', '時', '待']), strokes, '待')).toBe('持');
    expect(readDrawing(ranking([]), strokes, '待')).toBe('？');
  });
});

describe('KanjiAnswer · Write the kanji', { timeout: 60_000 }, () => {
  it('draws each kanji in turn, then hands back how they were read', async () => {
    const onAnswer = vi.fn();
    renderWithServices(<KanjiAnswer kanji={['山', '口']} onAnswer={onAnswer} />);
    expect(screen.getByRole('list', { name: 'Kanji 1 of 2' })).toBeTruthy();
    const next = screen.getByRole('button', { name: 'Next kanji' }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    draw(SAMPLES.山 ?? []);
    // The recognizer's patterns load on first use: slow under a loaded test run.
    await vi.waitFor(() => expect(next.disabled).toBe(false), { timeout: 30_000 });
    await userEvent.click(next);
    expect(screen.getByRole('list', { name: 'Kanji 2 of 2' }).textContent).toBe('山');
    draw(SAMPLES.人 ?? []);
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(onAnswer).toHaveBeenCalledWith('山人');
  });
});
