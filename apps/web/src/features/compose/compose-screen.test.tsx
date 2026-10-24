import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiClient, AiErrorKind, Correction } from '../../ai/index.ts';
import type { Repos } from '../../domain/repos.ts';
import type { GrammarPoint, Token } from '../../domain/types.ts';
import type { Lang } from '../../lang/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import type { Slots } from '../../ui/slots.tsx';
import { errorCopy, headerLine, jaRuns } from './compose-copy.ts';
import { ComposeScreen } from './compose-screen.tsx';

const t = createTranslator('en', ENGLISH, ENGLISH);
const LESSON = 'Tobira 第4課';
const SENTENCE = '日本語が嫌いわけではないが、漢字を書くのは好きじゃない。';
const WAKE: GrammarPoint = {
  id: 'わけではない',
  pattern: '〜わけではない',
  meaning: "It's not that…",
  lesson: LESSON,
  exampleSentenceIds: [],
};

const CORRECTION: Correction = {
  corrected: '日本語が嫌いなわけではないが、漢字を書くのは好きではない。',
  marks: [
    {
      kind: 'insert',
      severity: 'error',
      start: 6,
      end: 6,
      text: 'な',
      title: 'Needed: な.',
      note: '嫌い is a na-adjective, so it takes な before わけ.',
    },
    {
      kind: 'replace',
      severity: 'style',
      start: 21,
      end: 27,
      text: '好きではない',
      title: 'Correct, but casual.',
      note: 'After ではないが, written style flows better with 好きではない.',
    },
  ],
  verdict: 'needs-work',
  works: 'わけではない softens it just right.',
  next: 'Say why.',
  usesTarget: true,
  readings: [{ surface: '嫌い', reading: 'きらい', verified: true }],
};

const TOKENS: Token[] = [
  { surface: '日本語', reading: 'にほんご', base: '日本語', pos: 'noun', wordId: '1', start: 0 },
];

async function withGrammar(points: GrammarPoint[] = [WAKE]): Promise<Repos> {
  const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
  for (const point of points) await repos.grammar.put(point);
  return repos;
}

function Today() {
  const location = useLocation();
  const state = location.state as { notice?: string } | null;
  return <p>Today screen: {state?.notice}</p>;
}

/**
 * `fakeAi`/`fakeLang` from test/render.tsx ignore their overrides (the proxy's get trap always
 * answers "unwired"), so this local stand-in looks at the overrides first.
 */
function stub<T extends object>(overrides: Partial<T>): T {
  const unwired = (name: string) => () => Promise.reject(new Error(`not wired: ${name}`));
  return new Proxy(overrides, {
    get: (target, name) => Reflect.get(target, name) ?? unwired(String(name)),
  }) as T;
}

function renderCompose(
  repos: Repos,
  ai: Partial<AiClient>,
  path = '/compose',
  language: 'en' | 'fr' | 'es' = 'en',
  slots: Slots = {},
) {
  const lang = stub<Lang>({ tokenize: async () => TOKENS });
  const services = fakeServices({ repos, ai: stub<AiClient>(ai), lang });
  return renderWithServices(
    <Routes>
      <Route path="/compose" element={<ComposeScreen />} />
      <Route path="/" element={<Today />} />
      <Route path="/settings/tutor" element={<p>Settings screen</p>} />
    </Routes>,
    { services, path, language, slots },
  );
}

const ok = (value: Correction) => async () => ({ ok: true as const, value, cached: false });
const failing = (kind: AiErrorKind) => async () => ({
  ok: false as const,
  error: { kind, message: kind },
});

async function typeAndCheck(text = SENTENCE) {
  fireEvent.change(await screen.findByLabelText('Your sentence'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /^Check, / }));
}

afterEach(() => localStorage.clear());

/** A stand-in tutor sheet, so the tutor's buttons show. */
const SHEET: Slots = { tutorSheet: () => null };

describe('compose copy', () => {
  it('names the grammar position and splits Japanese runs', () => {
    expect(headerLine(t, undefined)).toBe('Use it');
    expect(headerLine(t, { grammar: WAKE, position: 3, total: 6 })).toBe('Use it · grammar 3 of 6');
    expect(jaRuns('Needed: な.')).toEqual([
      { ja: false, text: 'Needed: ', start: 0 },
      { ja: true, text: 'な', start: 8 },
      { ja: false, text: '.', start: 9 },
    ]);
    expect(jaRuns('𠮟る!')[0]).toEqual({ ja: true, text: '𠮟る', start: 0 });
    expect(errorCopy(t, 'provider').text).toMatch(/draft is kept/);
    expect(errorCopy(t, 'rate-limit').text).toMatch(/too many requests/);
  });
});

describe('ComposeScreen', () => {
  it('asks for the next unused grammar point and shows the red pen after Check', async () => {
    const correctSentence = vi.fn(ok(CORRECTION));
    renderCompose(await withGrammar(), { correctSentence }, '/compose', 'en', SHEET);
    expect(await screen.findByRole('heading', { name: 'Use it · grammar 1 of 1' })).toBeTruthy();
    expect(screen.getByText('〜わけではない', { selector: 'p' })).toBeTruthy();
    // The meaning and the instruction are two lines, never one run-on sentence.
    const meaning = (_: string, el: Element | null) => el?.textContent === "“It's not that…”";
    expect(screen.getByText(meaning, { selector: 'p' })).toBeTruthy();
    expect(screen.getByText('Say something true about yourself with it.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Check, / })).toHaveProperty('disabled', true);
    await typeAndCheck(`  ${SENTENCE}\n`);
    const error = await screen.findByRole('note', { name: 'Correction' });
    expect(correctSentence).toHaveBeenCalledWith({
      grammar: { pattern: '〜わけではない', meaning: "It's not that…" },
      sentence: SENTENCE,
    });
    expect(error.textContent).toContain('Needed: な.');
    const style = screen.getByRole('note', { name: 'Style note' });
    expect(style.textContent).toContain('Correct, but casual.');
    expect(style.className).toMatch(/styleMark/);
    expect(style.closest('[data-ai-block]')).toBeTruthy();
    const sentence = document.querySelector('p[lang="ja"].sentence, p[lang="ja"]:has(ruby)');
    expect(sentence?.textContent).toContain('Insert: な');
    expect(screen.getByText('好きじゃない').className).toContain('wavy');
    expect(screen.getByRole('region', { name: 'Needs work' }).textContent).toContain('1 fix');
    expect(screen.getByText('What works')).toBeTruthy();
    expect(screen.getByText('One thing to try')).toBeTruthy();
    expect(screen.getByText('It joins your review deck')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rewrite' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Why add な?, 1 request, uses AI' })).toBeTruthy();
  });

  it('calls a right sentence natural, in green, with Save and go on and no Rewrite', async () => {
    const natural: Correction = { ...CORRECTION, marks: [], verdict: 'natural' };
    renderCompose(await withGrammar(), { correctSentence: ok(natural) }, '/compose', 'en', SHEET);
    await typeAndCheck();
    const card = await screen.findByRole('region', { name: 'Natural' });
    expect(card.dataset.verdict).toBe('natural');
    expect(card.textContent).toContain('Nothing to correct');
    expect(screen.getByRole('button', { name: 'Save and go on' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rewrite' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Another way to say it, 1 request, uses AI' }),
    ).toBeTruthy();
  });

  it('says what the tutor looks at while it reads the sentence', async () => {
    renderCompose(await withGrammar(), { correctSentence: () => new Promise(() => {}) });
    await typeAndCheck();
    expect(await screen.findByText('The tutor is reading it')).toBeTruthy();
    expect(screen.getByText('Particles and word order')).toBeTruthy();
  });

  it('opens the tutor on the grammar point from beside Check', async () => {
    const tutorSheet: Slots['tutorSheet'] = ({ topic }) => <p>tutor on {topic.about}</p>;
    renderCompose(await withGrammar(), {}, '/compose', 'en', { tutorSheet });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Ask the tutor about 〜わけではない' }),
    );
    expect(screen.getByText('tutor on 〜わけではない')).toBeTruthy();
  });

  it('keeps the draft when offline and links to Settings without a key', async () => {
    const repos = await withGrammar();
    const view = renderCompose(repos, { correctSentence: failing('offline') });
    await typeAndCheck();
    expect(await screen.findByText(/Corrections need a connection/)).toBeTruthy();
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your sentence').value).toBe(SENTENCE);
    view.unmount();
    renderCompose(repos, { correctSentence: failing('no-key') });
    expect((await screen.findByLabelText<HTMLTextAreaElement>('Your sentence')).value).toBe(
      SENTENCE,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Check, / }));
    expect(await screen.findByText(/Add a Gemini key in Settings/)).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Open Settings' }));
    expect(await screen.findByText('Settings screen')).toBeTruthy();
  });

  it('treats a thrown call as a provider error', async () => {
    renderCompose(await withGrammar(), { correctSentence: () => Promise.reject(new Error('x')) });
    await typeAndCheck();
    expect(await screen.findByText(/Couldn't get a correction just now/)).toBeTruthy();
  });

  it('returns to editing with the same text on Rewrite', async () => {
    renderCompose(await withGrammar(), { correctSentence: ok(CORRECTION) });
    await typeAndCheck();
    fireEvent.click(await screen.findByRole('button', { name: 'Rewrite' }));
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your sentence').value).toBe(SENTENCE);
  });

  it('saves the corrected sentence on Accept and goes back to Today after the last point', async () => {
    const repos = await withGrammar();
    renderCompose(repos, { correctSentence: ok(CORRECTION) });
    await typeAndCheck();
    fireEvent.click(await screen.findByRole('button', { name: 'Save fixed' }));
    expect(
      await screen.findByText(/^Today screen: Saved to your sentences\. You have/),
    ).toBeTruthy();
    const [saved] = await repos.sentences.bySource('compose');
    expect(saved).toMatchObject({
      text: CORRECTION.corrected,
      grammarIds: ['わけではない'],
      tokens: TOKENS,
      verified: true,
    });
    expect((await repos.items.get('grammar:わけではない'))?.level).toBe(3);
    expect(localStorage.length).toBe(0);
  });

  it('goes on to the next grammar point of the lesson on Accept', async () => {
    const tai: GrammarPoint = { ...WAKE, id: 'たい', pattern: '〜たい', meaning: 'want to' };
    const repos = await withGrammar([WAKE, tai]);
    renderCompose(repos, { correctSentence: ok(CORRECTION) });
    await typeAndCheck();
    fireEvent.click(await screen.findByRole('button', { name: 'Save fixed' }));
    expect(await screen.findByText('〜たい')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Saved to your sentences.');
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your sentence').value).toBe('');
    expect((await repos.items.get('grammar:わけではない'))?.level).toBe(3);
  });

  it('marks unverified readings and a sentence that misses the target', async () => {
    const correction: Correction = {
      ...CORRECTION,
      marks: [],
      usesTarget: false,
      readings: [{ surface: '嫌い', reading: 'けんい', verified: false }],
    };
    renderCompose(await withGrammar(), { correctSentence: ok(correction) });
    await typeAndCheck();
    expect(await screen.findByText('unverified')).toBeTruthy();
    expect(screen.getByText(/couldn't confirm/)).toBeTruthy();
    expect(screen.getByText(/so it won't count as used/)).toBeTruthy();
  });

  it('says so when saving fails, keeping the correction', async () => {
    const repos = await withGrammar();
    repos.sentences.put = () => Promise.reject(new Error('disk full'));
    renderCompose(repos, { correctSentence: ok(CORRECTION) });
    await typeAndCheck();
    fireEvent.click(await screen.findByRole('button', { name: 'Save fixed' }));
    expect(await screen.findByText(/Couldn't save the sentence/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save fixed' })).toHaveProperty('disabled', false);
  });

  it('takes the grammar point from the query', async () => {
    const other: GrammarPoint = { ...WAKE, id: 'ばかり', pattern: '〜ばかり', meaning: 'only' };
    renderCompose(await withGrammar([WAKE, other]), {}, '/compose?grammar=ばかり');
    expect(await screen.findByRole('heading', { name: 'Use it · grammar 2 of 2' })).toBeTruthy();
    expect(screen.getByText('〜ばかり')).toBeTruthy();
  });

  it('offers to add a grammar point when there are none', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    renderCompose(repos, {});
    const pattern = await screen.findByLabelText('PATTERN');
    expect(screen.getByLabelText<HTMLInputElement>('LESSON').value).toBe(LESSON);
    const add = screen.getByRole('button', { name: 'Add grammar point' });
    expect(add).toHaveProperty('disabled', true);
    fireEvent.change(pattern, { target: { value: '〜わけではない' } });
    fireEvent.change(screen.getByLabelText('MEANING'), { target: { value: "It's not that…" } });
    fireEvent.click(add);
    expect(await screen.findByRole('heading', { name: 'Use it · grammar 1 of 1' })).toBeTruthy();
    await waitFor(async () =>
      expect((await repos.items.get('grammar:わけではない'))?.level).toBe(1),
    );
  });
});

describe('ComposeScreen in French and Spanish', () => {
  it('shows the screen and the red pen in French', async () => {
    renderCompose(
      await withGrammar(),
      { correctSentence: vi.fn(ok(CORRECTION)) },
      '/compose',
      'fr',
    );
    expect(
      await screen.findByRole('heading', { name: 'Employer · grammaire 1 sur 1' }),
    ).toBeTruthy();
    expect(screen.getByText(/Dites quelque chose de vrai/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Votre phrase'), { target: { value: SENTENCE } });
    fireEvent.click(screen.getByRole('button', { name: /^Vérifier, / }));
    expect(await screen.findByRole('note', { name: 'Correction' })).toBeTruthy();
    expect(screen.getByRole('note', { name: 'Note de style' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer corrigée' })).toBeTruthy();
  });

  it('offers to add a grammar point in Spanish', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    renderCompose(repos, {}, '/compose', 'es');
    expect(await screen.findByLabelText('ESTRUCTURA')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Añadir punto gramatical' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Úsalo' })).toBeTruthy();
  });
});
