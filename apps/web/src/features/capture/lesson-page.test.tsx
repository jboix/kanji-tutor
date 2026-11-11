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
  ORDERED_PAGE,
  scanDictionary,
} from '../../test/scan-fixtures.ts';
import { CaptureScreen } from './capture-screen.tsx';

const NOW = Date.parse('2026-10-25T10:00:00Z');

const ANSWER: Answer = {
  answer: 'It rains: 雨が降ります.',
  readings: [{ surface: '雨', reading: 'あめ', verified: true }],
};

const OLD_PAGES = [KANJI_PAGE, GRAMMAR_PAGE, HANDOUT_PAGE];

async function setup(path: string, pages = OLD_PAGES) {
  const repos = createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 5 } });
  const base = emptyScan({ id: 'scan1', now: NOW });
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
    expect(within(parts).getByText('Exercises')).toBeTruthy();
    const practise = screen.getByRole('link', { name: /^Practise this lesson/ });
    expect(practise.getAttribute('href')).toBe('/read?scan=scan1');
    fireEvent.click(screen.getByRole('button', { name: 'See the photo of page 1' }));
    expect(await screen.findByRole('dialog', { name: 'Page 1' })).toBeTruthy();
  });

  it('leaves a part out and adds it back from its sheet, greyed in between', async () => {
    const { repos } = await setup('/capture?id=scan1');
    const parts = await screen.findByRole('region', { name: 'What the lesson holds' });
    fireEvent.click(within(parts).getByRole('button', { name: /^Kanji/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Kanji' });
    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Practise all the kanji' }));
    await waitFor(async () =>
      expect((await repos.scans.get('scan1'))?.dropped).toEqual(['kanji:雨', 'kanji:晴']),
    );
    expect(within(parts).getByRole('button', { name: /^Kanji.*Left out/ })).toBeTruthy();
    // Still listed, a tick away from coming back.
    fireEvent.click(within(sheet).getByRole('checkbox', { name: 'Practise 晴' }));
    await waitFor(async () =>
      expect((await repos.scans.get('scan1'))?.dropped).toEqual(['kanji:雨']),
    );
    expect(within(sheet).getByRole('region', { name: 'Kanji · 1 of 2' })).toBeTruthy();
    expect(within(parts).getByRole('button', { name: /^Kanji.*晴.*0 of 1/ })).toBeTruthy();
  });

  it('opens a scan saved before there was a choice with everything kept', async () => {
    await setup('/capture?id=scan1');
    const parts = await screen.findByRole('region', { name: 'What the lesson holds' });
    fireEvent.click(within(parts).getByRole('button', { name: /^Exercises/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Exercises' });
    expect(within(sheet).getByRole('region', { name: 'Exercises from page 3 · 2' })).toBeTruthy();
    const ticks = within(sheet).getAllByRole('checkbox');
    expect(ticks).toHaveLength(3);
    expect(ticks.every((tick) => (tick as HTMLInputElement).checked)).toBe(true);
  });

  it('shows a page in its printed order: instruction, exercise, what cannot be imported', async () => {
    await setup('/capture?id=scan1', [KANJI_PAGE, GRAMMAR_PAGE, ORDERED_PAGE]);
    const page = await screen.findByRole('region', { name: 'Page 3 · Exercise handout' });
    const text = page.textContent ?? '';
    const order = [
      'Instruction',
      '正しいものを選びなさい。',
      '1. 雨が降り',
      'Can’t be imported',
      '①＿＿',
    ];
    // The last place each shows: the photo's thumbnail repeats the page's lines before them.
    const places = order.map((part) => text.lastIndexOf(part));
    expect(places).toEqual([...places].sort((a, b) => a - b));
    expect(order.every((part) => text.includes(part))).toBe(true);
    // The questions as printed, with their choices; never the tutor's answers.
    expect(within(page).getByText('そう ・ よう')).toBeTruthy();
    expect(within(page).queryByText('そう joins the ます stem.')).toBeNull();
    // A form to choose and a reading to write, under the one instruction.
    expect(within(page).getByText('Several kinds of question')).toBeTruthy();
    expect(within(page).getByText('Not practised yet')).toBeTruthy();
    const practise = within(page).getByRole('link', { name: 'Practise these 2' });
    expect(practise.getAttribute('href')).toBe('/read?scan=scan1&exercise=2.1');
    // What cannot be imported keeps its text and says why, as the tutor's words.
    expect(within(page).getByText('The tutor: It needs the pictures.')).toBeTruthy();
    expect(within(page).getByRole('button', { name: '①＿＿　②＿＿' })).toBeTruthy();
  });

  it('marks a practised question with a check and offers what is left', async () => {
    const pages = [KANJI_PAGE, GRAMMAR_PAGE, ORDERED_PAGE];
    const repos = createMemoryRepos({
      dictionary: scanDictionary(),
      settings: { learnerLevel: 5 },
    });
    const built = await buildScan(repos, {
      base: emptyScan({ id: 'scan1', now: NOW }),
      pages,
      level: 5,
    });
    const lesson = {
      ...built.lesson,
      practised: { 'question:2-1': NOW },
      dropped: ['question:2-2'],
    };
    await saveScan(repos, { ...built, lesson }, NOW);
    renderWithServices(<CaptureScreen />, {
      services: fakeServices({ repos }),
      path: '/capture?id=scan1',
    });
    const page = await screen.findByRole('region', { name: 'Page 3 · Exercise handout' });
    const [first, second] = within(page)
      .getAllByRole('listitem')
      .filter((li) => li.textContent?.includes('.'));
    expect(first?.textContent).toMatch(/^Practised:1\. 雨が降り/);
    expect(second?.textContent).toMatch(/Left out$/);
    expect(within(page).getByText('1 of 1 practised')).toBeTruthy();
    expect(within(page).getByRole('link', { name: 'Practise this one' })).toBeTruthy();
  });

  it('adds back an exercise left out whole, from the page', async () => {
    const pages = [KANJI_PAGE, GRAMMAR_PAGE, ORDERED_PAGE];
    const repos = createMemoryRepos({
      dictionary: scanDictionary(),
      settings: { learnerLevel: 5 },
    });
    const built = await buildScan(repos, {
      base: emptyScan({ id: 'scan1', now: NOW }),
      pages,
      level: 5,
    });
    const lesson = { ...built.lesson, dropped: ['question:2-1', 'question:2-2'] };
    await saveScan(repos, { ...built, lesson }, NOW);
    renderWithServices(<CaptureScreen />, {
      services: fakeServices({ repos }),
      path: '/capture?id=scan1',
    });
    const page = await screen.findByRole('region', { name: 'Page 3 · Exercise handout' });
    expect(within(page).getByText('Left out of the lesson')).toBeTruthy();
    fireEvent.click(within(page).getByRole('button', { name: 'Add back' }));
    await waitFor(async () => expect((await repos.scans.get('scan1'))?.dropped).toBeUndefined());
    expect(within(page).getByRole('link', { name: 'Practise these 2' })).toBeTruthy();
  });

  it('shows a scan saved before pages kept their order as lines, then exercises', async () => {
    await setup('/capture?id=scan1');
    const page = await screen.findByRole('region', { name: 'Page 3 · Exercise handout' });
    expect(within(page).getByText(/^Scanned before pages kept their order/)).toBeTruthy();
    expect(within(page).getByRole('link', { name: 'Practise these 2' }).getAttribute('href')).toBe(
      '/read?scan=scan1&exercise=2.0',
    );
    const first = screen.getByRole('region', { name: 'Page 1 · Kanji list' });
    expect(within(first).getByRole('button', { name: '雨が降ります。' })).toBeTruthy();
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
