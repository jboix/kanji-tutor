import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient, SignReading } from '../../ai/types.ts';
import { rebuildKanjiReadings } from '../../domain/services/kanji-readings.ts';
import { readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { WildScreen } from './wild-screen.tsx';

vi.mock('../../ui/image.ts', async (load) => ({
  ...(await load<typeof import('../../ui/image.ts')>()),
  prepareImage: async () => ({
    blob: new Blob(['jpeg'], { type: 'image/jpeg' }),
    media: { mime: 'image/jpeg', data: 'AAAA' },
  }),
}));

const SIGN: SignReading = {
  place: 'Station sign',
  lines: ['学生 待合室'],
  kanji: [
    { char: '学', box: [0, 0, 100, 100] },
    { char: '待', box: [0, 200, 100, 300] },
  ],
  words: [{ surface: '待つ', reading: 'まつ', meaning: 'to wait' }],
  readings: [{ surface: '待つ', reading: 'まつ', verified: true }],
};

async function render(readSign: AiClient['readSign']) {
  const repos = await readingRepos();
  await track(repos, [[W.gakusei, 4]], { kind: 'textbook' });
  await rebuildKanjiReadings(repos);
  const ai = fakeAi({ readSign, peek: async () => undefined });
  renderWithServices(<WildScreen />, { services: fakeServices({ repos, ai }), path: '/wild' });
  return repos;
}

const photo = () =>
  fireEvent.change(screen.getByTestId('wild-library'), {
    target: { files: [new File(['x'], 'sign.jpg', { type: 'image/jpeg' })] },
  });

describe('In the wild', () => {
  it('reads a photo only when asked, then outlines known and new kanji', async () => {
    const readSign = vi.fn<AiClient['readSign']>(async () => ({
      ok: true,
      cached: false,
      value: SIGN,
    }));
    await render(readSign);
    expect(screen.getByRole('button', { name: 'Take a photo' })).toBeTruthy();
    photo();
    const read = await screen.findByRole('button', { name: /^Read this photo, / });
    expect(readSign).not.toHaveBeenCalled();
    await userEvent.click(read);
    expect(
      await screen.findByRole('heading', { name: 'You can read 1 of the 2 kanji here.' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /学/ }).getAttribute('href')).toBe('/kanji/%E5%AD%A6');
    expect(screen.getByRole('note', { name: 'What the tutor read' }).textContent).toContain(
      'Reading checked',
    );
    expect(readSign.mock.calls[0]?.[0]).toEqual({ image: { mime: 'image/jpeg', data: 'AAAA' } });
  });

  it('adds a new word to study', async () => {
    const repos = await render(async () => ({ ok: true, cached: false, value: SIGN }));
    photo();
    await userEvent.click(await screen.findByRole('button', { name: /^Read this photo, / }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add 待つ to your words' }));
    expect(await screen.findByText('Added')).toBeTruthy();
    await waitFor(async () => expect(await repos.items.get(`word:${W.matsu.id}`)).toBeTruthy());
  });
});
