import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../../ai/types.ts';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { HandwriteScreen } from './handwrite-screen.tsx';

vi.mock('./recognizer/index.ts', () => ({
  loadRecognizer: () => Promise.reject(new Error('chunk failed to load')),
}));
vi.mock('./stroke-image.ts', () => ({
  strokesToPng: () => ({ mime: 'image/png', data: 'cG5n' }),
}));

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

describe('HandwriteScreen without the offline recognizer', () => {
  it('says so and falls back to AI (I4)', async () => {
    const recognizeHandwriting = vi.fn<AiClient['recognizeHandwriting']>(async () => ({
      ok: true,
      cached: false,
      value: { candidates: ['待'] },
    }));
    const services = fakeServices({
      repos: await readingRepos(),
      ai: fakeAi({ recognizeHandwriting }),
    });
    renderWithServices(<HandwriteScreen />, { services, path: '/handwrite' });
    const canvas = screen.getByRole('img', { name: /Drawing area/ });
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 150, isPrimary: true, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 280, clientY: 150, isPrimary: true });
    fireEvent.pointerUp(canvas, { clientX: 280, clientY: 150, isPrimary: true });
    expect(await screen.findByText("The offline recognizer didn't load.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /^Ask AI to read it, / }));
    expect(await screen.findByRole('button', { name: '待', pressed: true })).toBeTruthy();
    expect(screen.queryByText("The offline recognizer didn't load.")).toBeNull();
  });
});
