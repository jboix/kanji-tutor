import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Answer } from '../../ai/types.ts';
import { buildScan, emptyScan, saveScan } from '../../domain/services/index.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import {
  GRAMMAR_PAGE,
  HANDOUT_PAGE,
  KANJI_PAGE,
  scanDictionary,
} from '../../test/scan-fixtures.ts';
import { CaptureScreen } from './capture-screen.tsx';

const NOW = Date.parse('2026-10-25T10:00:00Z');

const ANSWER: Answer = {
  answer: 'It rains: 雨が降ります.',
  readings: [{ surface: '雨', reading: 'あめ', verified: true }],
};

async function setup(path: string) {
  const repos = createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 5 } });
  const base = emptyScan({ id: 'scan1', now: NOW });
  const pages = [KANJI_PAGE, GRAMMAR_PAGE, HANDOUT_PAGE];
  await saveScan(repos, await buildScan(repos, { base, pages, level: 5 }), NOW);
  const answerQuestion = vi.fn(async () => ({ ok: true as const, value: ANSWER, cached: false }));
  const services = fakeServices({ repos, ai: fakeAi({ answerQuestion }) });
  renderWithServices(<CaptureScreen />, { services, path });
  return { repos, answerQuestion };
}

describe('scanned lessons', () => {
  it('lists each lesson as a card with what it holds and its progress', async () => {
    await setup('/capture');
    expect(screen.getByRole('heading', { name: 'Scanned lessons' })).toBeTruthy();
    expect(screen.getByText(/comes back in daily reviews/)).toBeTruthy();
    const card = await screen.findByRole('link', { name: /Weather and plans/ });
    expect(card.getAttribute('href')).toBe('/capture?id=scan1');
    expect(within(card).getByText('3 pages · Kanji, words, grammar, exercises')).toBeTruthy();
    expect(within(card).getByText('Not started')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'New scan' }).getAttribute('href')).toBe(
      '/capture?new=1',
    );
  });

  it('shows a lesson with its parts, practice and photos', async () => {
    await setup('/capture?id=scan1');
    expect(await screen.findByRole('heading', { name: 'Weather and plans' })).toBeTruthy();
    expect(screen.getByText(/^Scanned .* · 3 pages$/)).toBeTruthy();
    const parts = screen.getByRole('region', { name: 'What the lesson holds' });
    expect(within(parts).getByText('Kanji')).toBeTruthy();
    expect(within(parts).getByText('雨 晴')).toBeTruthy();
    expect(within(parts).getByText('Exercises from page 3')).toBeTruthy();
    const practise = screen.getByRole('link', { name: /^Practise this lesson/ });
    expect(practise.getAttribute('href')).toBe('/read?scan=scan1');
    fireEvent.click(screen.getByRole('button', { name: 'See the photo of page 1' }));
    expect(await screen.findByRole('dialog', { name: 'Page 1' })).toBeTruthy();
  });

  it('explains a tapped line only when asked', async () => {
    const { answerQuestion } = await setup('/capture?id=scan1');
    fireEvent.click(await screen.findByRole('button', { name: '雨が降ります。' }));
    expect(answerQuestion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Ask the tutor about this line/ }));
    expect(await screen.findByLabelText('Explanation of this line')).toBeTruthy();
    expect(answerQuestion).toHaveBeenCalledTimes(1);
  });

  it('renames and deletes a lesson from its menu', async () => {
    const { repos } = await setup('/capture?id=scan1');
    fireEvent.click(await screen.findByRole('button', { name: 'Rename' }));
    fireEvent.change(screen.getByLabelText('Name of the lesson'), { target: { value: 'Rain' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save the name' }));
    await waitFor(async () => expect((await repos.scans.get('scan1'))?.title).toBe('Rain'));
    fireEvent.click(screen.getByRole('button', { name: 'More: add pages, rename, delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete the lesson' }));
    await waitFor(async () => expect(await repos.scans.get('scan1')).toBeUndefined());
  });
});
