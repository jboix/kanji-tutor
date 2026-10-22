import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Answer, Result } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import { saveCapture } from '../../domain/services/capture.ts';
import {
  CAPTURE_LINES,
  captureDictionary,
  fixtureTokenize,
  CAPTURE_WORDS as W,
} from '../../domain/services/capture-fixtures.ts';
import { newWordItem } from '../../domain/services/items.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeAi, fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import { CaptureScreen } from './capture-screen.tsx';

vi.mock('./image.ts', async (load) => ({
  ...(await load<typeof import('./image.ts')>()),
  prepareImage: async () => ({
    blob: new Blob(['jpeg'], { type: 'image/jpeg' }),
    media: { mime: 'image/jpeg', data: 'anBlZw==' },
  }),
}));

const LINE = CAPTURE_LINES.map((line) => line.text);
const TEXT = LINE.join('\n');
const KNOWN = [W.nihon.id, W.wakai.id, W.hito.id, W.hanasu.id, W.ooi.id];

const ANSWER: Answer = {
  answer:
    '"However, it isn\'t that fewer people speak dialects." That\'s the job わけではない does.',
  readings: [
    { surface: '方言', reading: 'ほうげん', verified: true },
    { surface: '減っている', reading: 'へていいる', verified: false },
  ],
};

async function setup(overrides: { answer?: Result<Answer> } = {}) {
  const repos = createMemoryRepos({
    dictionary: captureDictionary(),
    settings: { currentLesson: 'Tobira 第4課' },
  });
  await repos.items.putMany(
    KNOWN.map((wordId) => newWordItem({ wordId, kind: 'import', now: 0, level: 3 })),
  );
  const answerQuestion = vi.fn(
    async () => overrides.answer ?? { ok: true as const, value: ANSWER, cached: false },
  );
  const extractFromImage = vi.fn(async () => ({
    ok: true as const,
    value: { lines: [...CAPTURE_LINES.map((l) => l.text), ' '] },
    cached: false,
  }));
  const services = fakeServices({
    repos,
    lang: fakeLang({ tokenize: fixtureTokenize }),
    ai: fakeAi({ answerQuestion, extractFromImage }),
  });
  return { repos, services, answerQuestion, extractFromImage };
}

async function pasteText() {
  fireEvent.click(screen.getByRole('button', { name: 'Paste text instead' }));
  fireEvent.change(screen.getByLabelText('Japanese text, one line per sentence'), {
    target: { value: TEXT },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Use this text' }));
  return screen.findByRole('heading', { name: 'You can read 50% of this' });
}

async function wordItems(repos: Repos) {
  return (await repos.items.byKind('word')).filter((item) => item.source.kind === 'capture');
}

afterEach(() => vi.restoreAllMocks());

describe('CaptureScreen', () => {
  it('turns pasted text into readiness, new words and items for the lesson', async () => {
    const { repos, services } = await setup();
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    await pasteText();
    expect(screen.getByText('Pasted text · added today')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
    const list = screen.getByRole('region', { name: 'New words and grammar points' });
    expect(list.textContent).toContain('6 new words and grammar points');
    expect(list.textContent).toContain('地域様々方言影響標準語+1');

    fireEvent.click(within(list).getByRole('button', { name: 'Review list' }));
    const hyoujungo = within(list).getByRole('checkbox', { name: /標準語/ });
    expect((hyoujungo as HTMLInputElement).checked).toBe(true);
    expect(within(list).getByText('ひょうじゅんご')).toBeTruthy();
    expect(within(list).queryByText('unverified')).toBeNull();
    fireEvent.click(hyoujungo);
    fireEvent.click(screen.getByRole('button', { name: 'Add to Tobira 第4課' }));

    expect((await screen.findByRole('status')).textContent).toBe('Added 5 words to Tobira 第4課.');
    const items = await wordItems(repos);
    expect(items.map((item) => item.ref).sort()).toEqual(
      [W.chiiki.id, W.samazama.id, W.hougen.id, W.eikyou.id, W.heru.id].sort(),
    );
    expect(items[0]?.source).toMatchObject({
      lesson: 'Tobira 第4課',
      captureId: expect.any(String),
    });
    expect(await repos.sentences.bySource('capture')).toHaveLength(3);
    expect(list.textContent).toContain('1 new words and grammar points');
  });

  it('explains a tapped line, marks unverified readings and offers the cited grammar', async () => {
    const { repos, services, answerQuestion } = await setup();
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    await pasteText();
    fireEvent.click(screen.getByRole('button', { name: LINE[2] ?? '' }));
    // Static first (A13): the line's words and grammar, and no AI call until asked.
    expect(await screen.findByRole('region', { name: 'Grammar in this line' })).toBeTruthy();
    expect(answerQuestion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Ask the tutor about this line, / }));
    const note = await screen.findByRole('note', { name: 'Explanation of this line' });
    expect(note.textContent).toContain("it isn't that fewer people speak dialects");
    expect(within(note).getByText('へていいる')).toBeTruthy();
    expect(within(note).getAllByText('unverified')).toHaveLength(1);
    expect(answerQuestion).toHaveBeenCalledWith({
      scope: 'sentence',
      sentence: { text: LINE[2] ?? '', lesson: 'Tobira 第4課' },
      question: 'Translate and explain this line for an N3 learner.',
    });
    expect(screen.getByRole('button', { name: LINE[2] ?? '' }).ariaPressed).toBe('true');

    const list = screen.getByRole('region', { name: 'New words and grammar points' });
    fireEvent.click(within(list).getByRole('button', { name: 'Review list' }));
    const grammar = within(list).getByRole('checkbox', { name: /〜わけではない/ });
    expect((grammar as HTMLInputElement).checked).toBe(false);
    expect(list.textContent).toContain('suggested by the explanation');

    fireEvent.click(within(note).getByRole('button', { name: 'Turn into an exercise' }));
    expect((await screen.findByRole('status')).textContent).toBe("It's in your next session.");
    expect((await wordItems(repos)).map((i) => i.ref).sort()).toEqual(
      [W.hougen.id, W.heru.id].sort(),
    );

    fireEvent.click(screen.getByRole('button', { name: LINE[0] ?? '' }));
    fireEvent.click(screen.getByRole('button', { name: LINE[2] ?? '' }));
    expect(answerQuestion).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: LINE[0] ?? '' }));
    fireEvent.click(screen.getByRole('button', { name: /^Ask the tutor about this line, / }));
    expect(answerQuestion).toHaveBeenCalledTimes(2);
  });

  it('adds a grammar point typed by the learner', async () => {
    const { repos, services } = await setup();
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    await pasteText();
    fireEvent.click(screen.getByRole('button', { name: 'Review list' }));
    fireEvent.change(screen.getByLabelText('Lesson tag'), { target: { value: 'Tobira 第5課' } });
    fireEvent.change(screen.getByLabelText('Add a grammar point from the page'), {
      target: { value: '〜わけではない' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    for (const word of ['地域', '様々', '方言', '影響', '標準語', '減る']) {
      fireEvent.click(screen.getByRole('checkbox', { name: new RegExp(word) }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Add to Tobira 第5課' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Added 1 grammar point to Tobira 第5課.',
    );
    expect((await repos.grammar.get('わけではない'))?.lesson).toBe('Tobira 第5課');
    expect((await repos.settings.get()).currentLesson).toBe('Tobira 第4課');
  });

  it('reads a photo through OCR and keeps it with the capture', async () => {
    const { repos, services, extractFromImage } = await setup();
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    const file = new File(['png'], 'page.png', { type: 'image/png' });
    fireEvent.click(
      screen.getByRole('button', { name: /^Photograph a page, 1 request, uses AI$/ }),
    );
    fireEvent.change(screen.getByTestId('camera-input'), { target: { files: [file] } });
    await screen.findByRole('heading', { name: 'You can read 50% of this' });
    expect(extractFromImage).toHaveBeenCalledWith({
      image: { mime: 'image/jpeg', data: 'anBlZw==' },
    });
    expect(screen.getByText('Handout · photographed today')).toBeTruthy();
    const [capture] = await repos.captures.all();
    expect(capture?.photo).toBeInstanceOf(Blob);
    expect(capture?.lines).toHaveLength(3);
    expect(capture?.lesson).toBe('Tobira 第4課');
  });

  it('says plainly that a photo needs AI when offline, and pasting still works', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { services, extractFromImage } = await setup();
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    const file = new File(['png'], 'page.png', { type: 'image/png' });
    fireEvent.click(
      screen.getByRole('button', { name: /^Choose from library, 1 request, uses AI/ }),
    );
    fireEvent.change(screen.getByTestId('library-input'), { target: { files: [file] } });
    expect((await screen.findByRole('alert')).textContent).toContain(
      "You're offline. Reading a photo needs AI",
    );
    expect(extractFromImage).not.toHaveBeenCalled();
    await pasteText();
  });

  it('links to Settings when there is no key', async () => {
    const { services, extractFromImage } = await setup();
    extractFromImage.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'no-key', message: 'No key' },
    } as never);
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    fireEvent.click(screen.getByRole('button', { name: /^Photograph a page, / }));
    fireEvent.change(screen.getByTestId('camera-input'), {
      target: { files: [new File(['x'], 'x.png')] },
    });
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('needs a Gemini key');
    expect(within(alert).getByRole('link', { name: 'Open Settings' })).toBeTruthy();
  });

  it('opens a saved capture without AI and shows the offline explanation state', async () => {
    const { repos, services } = await setup({
      answer: { ok: false, error: { kind: 'offline', message: 'offline' } },
    });
    const createdAt = Date.now() - 86_400_000;
    await saveCapture(repos, { id: 'saved', createdAt, lines: CAPTURE_LINES });
    renderWithServices(<CaptureScreen />, { services, path: '/capture' });
    const row = await screen.findByRole('link', { name: /日本には/ });
    expect(row.textContent).toContain('Pasted text · added yesterday · You can read 50%');
    expect(row.getAttribute('href')).toBe('/capture?id=saved');

    await act(async () => fireEvent.click(row));
    await screen.findByRole('heading', { name: 'You can read 50% of this' });
    fireEvent.click(screen.getByRole('button', { name: LINE[1] ?? '' }));
    fireEvent.click(screen.getByRole('button', { name: /^Ask the tutor about this line, / }));
    await waitFor(() =>
      expect(screen.getByText(/You're offline. Explanations need AI/)).toBeTruthy(),
    );
  });

  it('says when a capture is gone', async () => {
    const { services } = await setup();
    renderWithServices(<CaptureScreen />, { services, path: '/capture?id=nope' });
    expect(await screen.findByText('This capture is no longer saved.')).toBeTruthy();
  });
});
