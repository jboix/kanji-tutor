import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AnalysePageInput, PageAnalysis, Result } from '../../ai/types.ts';
import { newWordItem } from '../../domain/services/items.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeAi, fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import {
  LINE_DESHOU,
  LINE_RAIN,
  scanDictionary,
  SCAN_WORDS as W,
} from '../../test/scan-fixtures.ts';
import { CaptureScreen } from './capture-screen.tsx';

vi.mock('../../ui/image.ts', async (load) => ({
  ...(await load<typeof import('../../ui/image.ts')>()),
  prepareImage: async () => ({
    blob: new Blob(['jpeg'], { type: 'image/jpeg' }),
    media: { mime: 'image/jpeg', data: 'anBlZw==' },
  }),
}));

const empty = { kanji: [], words: [], grammar: [], questions: [], readings: [] };

const PAGES: Record<number, PageAnalysis> = {
  1: {
    ...empty,
    kind: 'kanji-list',
    title: 'Weather and plans',
    lines: [{ text: LINE_RAIN.text, unsure: true }],
    kanji: [
      { char: '雨', meaning: 'rain' },
      { char: '曇', meaning: 'cloudy' },
    ],
    words: [
      {
        written: '天気予報',
        meaning: 'weather forecast',
        reading: { surface: '天気予報', reading: 'てんきよほう', verified: true },
      },
      {
        written: '雪見日和',
        meaning: 'a fine day for viewing snow',
        reading: { surface: '雪見日和', reading: 'ゆきみびより', verified: false },
      },
    ],
  },
  2: {
    ...empty,
    kind: 'handout',
    title: 'Exercises',
    lines: [{ text: LINE_DESHOU.text, unsure: false }],
    questions: [
      {
        type: 'choose-form',
        stem: '雨が降り＿＿です。',
        choices: ['そう', 'よう'],
        answer: 'そう',
        answerVerified: true,
        explanation: 'The verb stem takes this ending.',
        readings: [],
      },
      {
        type: 'particle',
        stem: '駅＿＿待ちます。',
        choices: [],
        answer: 'で',
        answerVerified: true,
        explanation: 'The place of an action.',
        readings: [],
      },
    ],
  },
};

const tokenize = async (text: string) =>
  [LINE_RAIN, LINE_DESHOU].find((line) => line.text === text)?.tokens ?? [];

async function setup(analyse?: (input: AnalysePageInput) => Promise<Result<PageAnalysis>>) {
  const repos = createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 5 } });
  await repos.items.put(newWordItem({ wordId: W.yohou.id, kind: 'import', now: 0, level: 3 }));
  const analysePage = vi.fn(
    analyse ??
      (async (input: AnalysePageInput) => ({
        ok: true as const,
        value: PAGES[input.page] ?? PAGES[1]!,
        cached: false,
      })),
  );
  const services = fakeServices({
    repos,
    lang: fakeLang({ tokenize }),
    ai: fakeAi({ analysePage, answerQuestion: vi.fn() }),
  });
  renderWithServices(<CaptureScreen />, { services, path: '/capture?new=1' });
  return { repos, analysePage };
}

const photo = (name: string) => new File(['jpeg'], name, { type: 'image/jpeg' });

function pick(...files: File[]) {
  fireEvent.change(screen.getByTestId('library-input'), { target: { files } });
}

describe('new scan', () => {
  it('counts the requests before sending any, and picking sends nothing', async () => {
    const { analysePage } = await setup();
    expect(screen.getByRole('heading', { name: 'New scan' })).toBeTruthy();
    pick(photo('a.jpg'), photo('b.jpg'), photo('c.jpg'));
    expect(
      await screen.findByRole('button', { name: 'Read 3 pages, 3 requests, uses AI' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove page 2' }));
    expect(screen.getByRole('button', { name: 'Read 2 pages, 2 requests, uses AI' })).toBeTruthy();
    expect(screen.getByText(/The photos are sent to Gemini to be read/)).toBeTruthy();
    expect(analysePage).not.toHaveBeenCalled();
  });

  it('reads each page, then shows what was found, labelled against our lists', async () => {
    const { analysePage } = await setup();
    pick(photo('a.jpg'), photo('b.jpg'));
    fireEvent.click(screen.getByRole('button', { name: /^Read 2 pages/ }));
    expect(await screen.findByLabelText('Title · suggested, edit it')).toHaveProperty(
      'value',
      'Weather and plans',
    );
    expect(analysePage).toHaveBeenCalledTimes(2);
    expect(analysePage.mock.calls.map(([input]) => [input.page, input.pages])).toEqual([
      [1, 2],
      [2, 2],
    ]);
    const pages = screen.getByRole('region', { name: 'The pages' });
    expect(within(pages).getByText('Kanji list')).toBeTruthy();
    expect(within(pages).getByText('Exercise handout')).toBeTruthy();
    expect(within(pages).getByText('Page 2 · 1 grammar point, 2 questions')).toBeTruthy();
    const kanji = screen.getByRole('region', { name: 'Kanji · 2' });
    expect(within(kanji).getByText(/cloudy · not in our lists/)).toBeTruthy();
    const words = screen.getByRole('region', { name: 'Words · 2' });
    expect(within(words).getByText('Known')).toBeTruthy();
    expect(within(words).getByText(/not in our lists · reading unverified/)).toBeTruthy();
    expect(screen.getByRole('region', { name: /^Grammar · / })).toBeTruthy();
    const exercises = screen.getByRole('region', { name: 'Exercises from page 2 · 2' });
    expect(within(exercises).getByText('Choose the right form · 1 question')).toBeTruthy();
    // The tutor's answers and explanations stay hidden.
    expect(screen.queryByText('The verb stem takes this ending.')).toBeNull();
  });

  it('saves the lesson with the edited title, a changed kind and a checked line', async () => {
    const { repos } = await setup();
    pick(photo('a.jpg'), photo('b.jpg'));
    fireEvent.click(screen.getByRole('button', { name: /^Read 2 pages/ }));
    const title = await screen.findByLabelText('Title · suggested, edit it');
    fireEvent.change(title, { target: { value: 'Rain week' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change what page 1 is' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Word list' }));
    await screen.findByText('Word list');
    fireEvent.click(screen.getByRole('button', { name: /1 line may be misread/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'This is right' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /may be misread/ })).toBeNull(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save the lesson' }));
    expect(await screen.findByText(/^Scanned /)).toBeTruthy();
    const [lesson] = await repos.scans.all();
    expect(lesson?.title).toBe('Rain week');
    expect(lesson?.pages.map((p) => p.kind)).toEqual(['word-list', 'handout']);
    expect(lesson?.pages[0]?.lines[0]?.verified).toBe(true);
    expect(lesson?.questions.map((q) => q.answer)).toEqual(['そう', 'で']);
    expect(await repos.sentences.get(lesson?.pages[0]?.lines[0]?.sentenceId ?? '')).toBeDefined();
  });

  it('reads pasted text on the device, without AI', async () => {
    const { analysePage } = await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Paste text instead' }));
    fireEvent.change(screen.getByLabelText('Japanese text, one line per sentence'), {
      target: { value: LINE_RAIN.text },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add this text as a page' }));
    expect(screen.getByText('Pasted text is read on this device, without AI.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Read 1 page' }));
    expect(await screen.findByText('Reading passage')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Words · 2' })).toBeTruthy();
    expect(analysePage).not.toHaveBeenCalled();
  });

  it('says what to do when the key is missing', async () => {
    await setup(async () => ({ ok: false, error: { kind: 'no-key', message: '' } }));
    pick(photo('a.jpg'));
    fireEvent.click(screen.getByRole('button', { name: /^Read 1 page/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('needs a Gemini key');
    expect(screen.getByRole('link', { name: 'Open Settings' })).toBeTruthy();
  });

  it('adds pages to an existing lesson', async () => {
    const { repos } = await setup();
    pick(photo('a.jpg'));
    fireEvent.click(screen.getByRole('button', { name: /^Read 1 page/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save the lesson' }));
    fireEvent.click(await screen.findByRole('button', { name: 'More: add pages, rename, delete' }));
    fireEvent.click(await screen.findByRole('link', { name: 'Add pages' }));
    pick(photo('b.jpg'));
    fireEvent.click(await screen.findByRole('radio', { name: /^Add to Weather and plans/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Read 1 page/ }));
    expect(await screen.findByText('2 pages read')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save the lesson' }));
    await screen.findByText(/^Scanned /);
    const lessons = await repos.scans.all();
    expect(lessons).toHaveLength(1);
    expect(lessons[0]?.pages).toHaveLength(2);
  });
});
