import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import { rebuildKanjiReadings } from '../../domain/services/kanji-readings.ts';
import { readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { HandwriteScreen } from './handwrite-screen.tsx';
import type { Pattern } from './recognizer/geometry.ts';
import { polyline, SAMPLES } from './recognizer/sample-strokes.ts';

vi.mock('./stroke-image.ts', () => ({
  strokesToPng: () => ({ mime: 'image/png', data: 'cG5n' }),
}));

beforeAll(() => {
  // jsdom has no canvas; painting is skipped when there is no 2D context.
  HTMLCanvasElement.prototype.getContext = () => null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function repos(): Promise<Repos> {
  const r = await readingRepos();
  await track(r, [
    [W.matsu, 3],
    [W.motsu, 2],
    [W.ji, 3],
  ]);
  await rebuildKanjiReadings(r);
  return r;
}

async function render(ai: Partial<AiClient> = {}) {
  const services = fakeServices({ repos: await repos(), ai: fakeAi(ai) });
  return renderWithServices(
    <Routes>
      <Route path="/handwrite" element={<HandwriteScreen />} />
      <Route path="/kanji/:char" element={<p>kanji page</p>} />
    </Routes>,
    { services, path: '/handwrite' },
  );
}

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

const candidates = () => screen.getByRole('list', { name: 'Candidates' });

describe('HandwriteScreen · draw (I4)', () => {
  it('ranks candidates after each stroke and shows the first one', async () => {
    await render();
    expect(screen.getByText('Draw a kanji, in any stroke order.')).toBeTruthy();
    draw(SAMPLES.待 ?? []);
    // The first test loads the recognizer's patterns (500 KB): slow under a loaded test run.
    const first = await screen.findByRole(
      'button',
      { name: '待', pressed: true },
      { timeout: 5000 },
    );
    expect(within(candidates()).getAllByRole('button')[0]).toBe(first);
    const detail = await screen.findByRole('region', { name: 'About 待' });
    expect(detail.textContent).toContain('タイ · ま・つ');
    expect(detail.textContent).toContain(
      "In 1 of your words. Shares 寺 with 持 and 時, which you've also met.",
    );
    expect(within(detail).getByRole('link').getAttribute('href')).toBe(
      `/kanji/${encodeURIComponent('待')}`,
    );
  });

  it('opens another candidate, then its kanji page', async () => {
    await render();
    draw(SAMPLES.待 ?? []);
    await userEvent.click(await screen.findByRole('button', { name: '時' }));
    expect(screen.getByRole('button', { name: '時', pressed: true })).toBeTruthy();
    const detail = await screen.findByRole('region', { name: 'About 時' });
    await userEvent.click(within(detail).getByRole('link'));
    expect(screen.getByText('kanji page')).toBeTruthy();
  });

  it('undoes and clears strokes', async () => {
    await render();
    const undo = screen.getByRole('button', { name: 'Undo last stroke' });
    expect((undo as HTMLButtonElement).disabled).toBe(true);
    draw(SAMPLES.十 ?? []);
    expect(screen.getByText('2 strokes')).toBeTruthy();
    await userEvent.click(undo);
    expect(screen.getByText('1 stroke')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Clear drawing' }));
    expect(screen.getByText('0 strokes')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Candidates' })).toBeNull();
  });

  it('offers AI when nothing matches well, and marks AI candidates with the seal', async () => {
    const recognizeHandwriting = vi.fn<AiClient['recognizeHandwriting']>(async () => ({
      ok: true,
      cached: false,
      value: { candidates: ['龍', '持', '待'] },
    }));
    await render({ recognizeHandwriting });
    draw([
      polyline([
        [10, 10],
        [290, 280],
        [20, 270],
        [280, 15],
      ]),
      polyline([
        [150, 0],
        [140, 290],
      ]),
    ]);
    await userEvent.click(await screen.findByRole('button', { name: /^Ask AI to read it, / }));
    expect(recognizeHandwriting).toHaveBeenCalledWith({
      image: { mime: 'image/png', data: 'cG5n' },
    });
    // 龍 is not in the dictionary, so it is dropped.
    const row = await screen.findByRole('list', { name: 'Candidates' });
    await vi.waitFor(() =>
      expect(
        within(row)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['持', '待']),
    );
    expect(screen.getByRole('note', { name: 'From AI' }).textContent).toContain('Read by AI');
  });

  it('switches to describe from the panel', async () => {
    await render();
    await userEvent.click(screen.getByRole('button', { name: "Can't draw it? Describe it." }));
    expect(screen.getByRole('textbox', { name: 'Describe the kanji' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Describe' })).toHaveProperty('checked', true);
  });
});

describe('HandwriteScreen · describe (I5)', () => {
  async function describeIt(ai: Partial<AiClient>) {
    await render(ai);
    await userEvent.click(screen.getByRole('radio', { name: 'Describe' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Describe the kanji' }),
      'temple on the right, it meant waiting',
    );
    await userEvent.click(screen.getByRole('button', { name: /^Find the kanji, / }));
  }

  it('lists dictionary kanji with the reason for the picked one', async () => {
    const describeKanji = vi.fn<AiClient['describeKanji']>(async () => ({
      ok: true,
      cached: false,
      value: {
        candidates: [
          { char: '待', reason: '寺 on the right, means to wait' },
          { char: '龍', reason: 'not in this dictionary' },
          { char: '持', reason: '寺 on the right, means to hold' },
        ],
        readings: [],
      },
    }));
    await describeIt({ describeKanji });
    expect(describeKanji).toHaveBeenCalledWith({
      description: 'temple on the right, it meant waiting',
    });
    expect(await screen.findByRole('button', { name: '待', pressed: true })).toBeTruthy();
    expect(
      within(candidates())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['待', '持']);
    expect(screen.getByRole('note', { name: 'Why 待' }).textContent).toContain(
      '寺 on the right, means to wait',
    );
    await userEvent.click(screen.getByRole('button', { name: '持' }));
    expect(screen.getByRole('note', { name: 'Why 持' })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'About 持' })).toBeTruthy();
  });

  it('marks a reading in the reason the dictionary could not confirm', async () => {
    await describeIt({
      describeKanji: async () => ({
        ok: true,
        cached: false,
        value: {
          candidates: [
            { char: '待', reason: 'as in 待つ (もつ), to wait' },
            { char: '持', reason: '寺 on the right, means to hold' },
          ],
          readings: [
            { surface: '待つ', reading: 'もつ', verified: false },
            { surface: '寺', reading: 'てら', verified: true },
          ],
        },
      }),
    });
    const note = await screen.findByRole('note', { name: 'Why 待' });
    expect(note.textContent).toContain('Not confirmed by the dictionary: 待つ');
    expect(within(note).getAllByText('unverified')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: '持' }));
    const other = screen.getByRole('note', { name: 'Why 持' });
    expect(within(other).queryByText('unverified')).toBeNull();
  });

  it('explains a missing key and AI errors calmly', async () => {
    await describeIt({
      describeKanji: async () => ({ ok: false, error: { kind: 'no-key', message: '' } }),
    });
    expect((await screen.findByRole('status')).textContent).toBe(
      'Add a Gemini key in Settings to describe a kanji.',
    );
  });

  it('says nothing fits when every candidate is unknown', async () => {
    await describeIt({
      describeKanji: async () => ({
        ok: true,
        cached: false,
        value: { candidates: [{ char: '龍', reason: 'dragon' }], readings: [] },
      }),
    });
    expect((await screen.findByRole('status')).textContent).toContain('No kanji in the dictionary');
  });
});

describe('HandwriteScreen · offline', () => {
  it('keeps drawing offline and disables describe with a calm note', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await render();
    draw(SAMPLES.待 ?? []);
    expect(await screen.findByRole('button', { name: '待', pressed: true })).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: 'Describe' }));
    expect(screen.getByRole('status').textContent).toBe(
      "You're offline. Describing needs a connection; drawing works offline.",
    );
    expect(
      (screen.getByRole('button', { name: /^Find the kanji, / }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('shows the AI offline message when a call fails offline', async () => {
    await render({
      recognizeHandwriting: async () => ({ ok: false, error: { kind: 'offline', message: '' } }),
    });
    draw([
      polyline([
        [10, 10],
        [290, 280],
        [20, 270],
        [280, 15],
      ]),
      polyline([
        [150, 0],
        [140, 290],
      ]),
    ]);
    await userEvent.click(await screen.findByRole('button', { name: /^Ask AI to read it, / }));
    expect(await screen.findByText(/You're offline\. Drawing works offline/)).toBeTruthy();
  });
});
