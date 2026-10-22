import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { AiClient, Result } from '../../ai/types.ts';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { HandwriteScreen } from './handwrite-screen.tsx';
import { polyline } from './recognizer/sample-strokes.ts';

vi.mock('./stroke-image.ts', () => ({
  strokesToPng: () => ({ mime: 'image/png', data: 'cG5n' }),
}));

beforeAll(() => {
  // jsdom has no canvas; painting is skipped when there is no 2D context.
  HTMLCanvasElement.prototype.getContext = () => null;
});

/** A 429 with the wait Google asked for (A14). */
const rateLimited = (retryAfterMs: number) => (): Promise<Result<never>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

async function render(ai: Partial<AiClient>) {
  const services = fakeServices({ repos: await readingRepos(), ai: fakeAi(ai) });
  renderWithServices(
    <Routes>
      <Route path="/handwrite" element={<HandwriteScreen />} />
    </Routes>,
    { services, path: '/handwrite' },
  );
}

/** Two strokes nothing matches well, so the AI fallback is offered; then asks it. */
async function drawAndAsk() {
  const canvas = screen.getByRole('img', { name: /Drawing area/ });
  const strokes = [
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
  ];
  for (const stroke of strokes) {
    const [first, ...rest] = stroke;
    if (!first) continue;
    fireEvent.pointerDown(canvas, {
      clientX: first[0],
      clientY: first[1],
      isPrimary: true,
      pointerId: 1,
      button: 0,
    });
    for (const [x, y] of rest)
      fireEvent.pointerMove(canvas, { clientX: x, clientY: y, isPrimary: true });
    fireEvent.pointerUp(canvas, { clientX: first[0], clientY: first[1], isPrimary: true });
  }
  await userEvent.click(
    await screen.findByRole('button', { name: /^Ask AI to read it, / }, { timeout: 5000 }),
  );
}

async function describeIt(ai: Partial<AiClient>) {
  await render(ai);
  await userEvent.click(screen.getByRole('radio', { name: 'Describe' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Describe the kanji' }), 'temple');
  await userEvent.click(screen.getByRole('button', { name: /^Find the kanji, / }));
}

/** The first stroke match is slow under coverage, as in handwrite-screen.test.tsx. */
function waitBox(): Promise<HTMLElement> {
  return waitFor(
    () => {
      const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
      if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
      return box;
    },
    { timeout: 5000 },
  );
}

describe('rate limit in the handwriting AI fallback (A14, D57)', { timeout: 20_000 }, () => {
  it('draw: shows the countdown with Retry disabled during the wait', async () => {
    await render({ recognizeHandwriting: vi.fn(rateLimited(30_000)) });
    await drawAndAsk();
    const box = await waitBox();
    expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
  });

  it('draw: asks again on Retry once the wait has passed', async () => {
    const recognizeHandwriting = vi.fn(rateLimited(0));
    await render({ recognizeHandwriting });
    await drawAndAsk();
    await userEvent.click(within(await waitBox()).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(recognizeHandwriting).toHaveBeenCalledTimes(2));
  });

  it('describe: asks again on Retry once the wait has passed', async () => {
    const describeKanji = vi.fn(rateLimited(0));
    await describeIt({ describeKanji });
    await userEvent.click(within(await waitBox()).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(describeKanji).toHaveBeenCalledTimes(2));
    expect(describeKanji).toHaveBeenLastCalledWith({ description: 'temple' });
  });
});
