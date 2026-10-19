import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiClient, SentenceExplanation } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { noKey, offline, ok, TARGET, WRONG } from '../../test/explain-results.ts';
import { readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { resetIntroduced } from './intro-once.ts';
import { NewItemIntro, TeachingCard } from './new-item-intro.tsx';
import { NewWordChip } from './new-word-chip.tsx';
import { SentenceHelp } from './sentence-help.tsx';
import { SentenceWrapUp } from './sentence-wrap-up.tsx';
import { TargetHint } from './target-hint.tsx';

const CARD: SessionCard = { sentence: S.waiting, targets: [TARGET], reason: 'new' };
const TRANSLATED = { ...S.waiting, translation: 'While I waited for a friend, I read a book.' };

async function render(ui: React.ReactElement, ai: Partial<AiClient> = {}, repos?: Repos) {
  const services = fakeServices({
    repos: repos ?? (await readingRepos()),
    ai: fakeAi({ memoryHook: noKey, ...ai }),
  });
  return renderWithServices(ui, { services });
}

beforeEach(() => {
  resetIntroduced();
  localStorage.clear();
});

describe('NewItemIntro (L1)', () => {
  it('introduces a never-met word, then goes on with "Got it", once', async () => {
    const onDone = vi.fn();
    const view = await render(<NewItemIntro card={CARD} target={TARGET} onDone={onDone} />);
    const card = await screen.findByRole('region', { name: 'New word: 待つ' });
    // Furigana over the kanji only (R11), and the reading this word gives 待.
    expect(await within(card).findAllByText('ま', { selector: 'rt' })).toHaveLength(2);
    expect(card.textContent).toContain('待(ま)つ');
    expect(card.textContent).toContain('In this word ま・つ');
    expect(card.textContent).toContain('to wait');
    expect(card.textContent).toContain('godan verb');
    expect(card.textContent).toContain('彳 going');
    expect(card.textContent).toContain('New at your level: a JLPT N5 word.');
    expect(card.textContent).toContain('待 = 彳 (going) + 寺');
    const jisho = within(card).getByRole('link', { name: 'Open 待 on Jisho (new tab)' });
    expect(jisho.getAttribute('href')).toBe('https://jisho.org/search/%E5%BE%85%20%23kanji');
    expect(card.querySelector('[role="note"]')).toBeNull();
    expect(within(card).getByRole('button', { name: /^Ask the tutor for a hook, / })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(onDone).toHaveBeenCalledOnce();
    view.unmount();

    const again = vi.fn();
    await render(<NewItemIntro card={CARD} target={TARGET} onDone={again} />);
    await waitFor(() => expect(again).toHaveBeenCalledOnce());
    expect(screen.queryByRole('region', { name: /New word/ })).toBeNull();
  });

  it('goes straight on for a word the learner has met', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 2]]);
    const onDone = vi.fn();
    await render(<NewItemIntro card={CARD} target={TARGET} onDone={onDone} />, {}, repos);
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
  });

  it('asks the tutor for a hook only on request, with the seal and its marks', async () => {
    const memoryHook = vi.fn<AiClient['memoryHook']>(async () => ({
      ok: true as const,
      cached: false,
      offLanguage: true as const,
      value: {
        hook: 'You read 時 with the same 寺 inside.',
        readings: [{ surface: '時', reading: 'じ', verified: false }],
      },
    }));
    await render(<NewItemIntro card={CARD} target={TARGET} onDone={() => undefined} />, {
      memoryHook,
    });
    const ask = await screen.findByRole('button', { name: /^Ask the tutor for a hook, / });
    expect(memoryHook).not.toHaveBeenCalled();
    await userEvent.click(ask);
    const note = await screen.findByRole('note', { name: 'Memory hook' });
    expect(note.querySelector('[data-seal="解"]')).toBeTruthy();
    expect(note.textContent).toContain('unverified');
    expect(note.textContent).toContain('Not in your language');
    expect(memoryHook.mock.calls[0]?.[0]).toMatchObject({
      word: { surface: '待つ', reading: 'まつ', meaning: 'to wait' },
      kanji: [{ char: '待', parts: [{ char: '彳', meaning: 'going' }, { char: '寺' }] }],
    });
  });
});

describe('TeachingCard (L1, L4)', () => {
  it('teaches under a skip or a miss, with the reading, and fires no AI', async () => {
    const memoryHook = vi.fn<AiClient['memoryHook']>(noKey);
    await render(<TeachingCard card={CARD} target={TARGET} grade={WRONG} />, { memoryHook });
    const card = await screen.findByRole('region', { name: 'About 待つ' });
    expect(card.textContent).toContain('待(ま)つ');
    expect(card.textContent).toContain('Other readings');
    expect(card.textContent).toContain('待 = 彳 (going) + 寺');
    expect(within(card).queryByRole('button', { name: /Ask the tutor/ })).toBeNull();
    expect(memoryHook).not.toHaveBeenCalled();
  });
});

describe('TargetHint (L2)', () => {
  it('shows meaning and parts, never the reading, and offers the skip', async () => {
    const onShowReading = vi.fn();
    const onClose = vi.fn();
    await render(
      <TargetHint card={CARD} target={TARGET} onShowReading={onShowReading} onClose={onClose} />,
    );
    const sheet = await screen.findByRole('dialog', { name: 'Hint for 待って' });
    await within(sheet).findByText('to wait');
    const text = document.body.textContent ?? '';
    for (const leak of ['まつ', 'まって', 'まっ', 'タイ', 'ま・つ', 'matsu', 'matte']) {
      expect(text).not.toContain(leak);
    }
    expect(document.querySelector('rt')).toBeNull();
    expect(sheet.querySelector('a[href*="jisho"]')).toBeNull();
    expect(sheet.textContent).toContain('彳 going');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Show the reading' }));
    expect(onClose).toHaveBeenCalled();
    expect(onShowReading).toHaveBeenCalledOnce();
  });

  it('has no skip for a later target', async () => {
    await render(<TargetHint card={CARD} target={TARGET} onClose={() => undefined} />);
    await screen.findByText('to wait');
    expect(screen.queryByRole('button', { name: 'Show the reading' })).toBeNull();
  });
});

const EXPLAINED: SentenceExplanation = {
  meaning: 'You read a book while you waited. 待って is read as […] here.',
  grammar: [{ pattern: '〜ている', note: 'An action going on.' }],
  readings: [],
  redacted: true,
};

describe('NewWordChip (L7)', () => {
  it('opens the intro without the reading before the answer, and is not a skip', async () => {
    await render(<NewWordChip card={CARD} target={TARGET} answered={false} />);
    await userEvent.click(await screen.findByRole('button', { name: 'New: 待っ' }));
    const sheet = await screen.findByRole('dialog', { name: 'New word: 待っ' });
    await within(sheet).findByText('to wait');
    const text = sheet.textContent ?? '';
    for (const leak of ['まつ', 'まって', 'ま・つ', 'matsu']) expect(text).not.toContain(leak);
    expect(sheet.querySelector('rt')).toBeNull();
    expect(within(sheet).queryByRole('button', { name: 'Show the reading' })).toBeNull();
  });

  it('shows the whole intro, reading included, once answered', async () => {
    await render(<NewWordChip card={CARD} target={TARGET} answered />);
    await userEvent.click(await screen.findByRole('button', { name: 'New: 待っ' }));
    const sheet = await screen.findByRole('dialog', { name: 'New word: 待っ' });
    expect(await within(sheet).findByText('ま', { selector: 'rt' })).toBeTruthy();
  });

  it('shows nothing for a word the learner has met', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 2]]);
    const view = await render(
      <NewWordChip card={CARD} target={TARGET} answered={false} />,
      {},
      repos,
    );
    await new Promise((done) => setTimeout(done, 50));
    expect(view.container.textContent).toBe('');
  });
});

describe('SentenceHelp (L3)', () => {
  const card: SessionCard = { ...CARD, sentence: TRANSLATED };

  it('shows the translation and the catalogue grammar first, the tutor only when asked', async () => {
    const explainSentence = vi.fn<AiClient['explainSentence']>(offline);
    await render(<SentenceHelp card={card} step={0} />, { explainSentence });
    await userEvent.click(screen.getByRole('button', { name: 'Explain this sentence' }));
    const sheet = await screen.findByRole('dialog', { name: 'About this sentence' });
    expect(sheet.textContent).toContain('While I waited for a friend, I read a book.');
    const grammar = within(sheet).getByRole('region', { name: 'Grammar in it' });
    expect(grammar.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(grammar.querySelector('a')?.getAttribute('href')).toMatch(/^\/grammar\//);
    expect(explainSentence).not.toHaveBeenCalled();
    await userEvent.click(within(sheet).getByRole('button', { name: /^Ask the tutor, / }));
    expect(await within(sheet).findByText(/You're offline/)).toBeTruthy();
    expect(sheet.querySelector('[role="note"]')).toBeNull();
    expect(explainSentence.mock.calls[0]?.[0]).toMatchObject({
      sentence: { text: S.waiting.text, translation: TRANSLATED.translation },
      hidden: [{ surface: '待って', readings: ['まっ', 'まって', 'まつ'] }],
    });
  });

  it('shows the tutor note with the seal and says a reading was hidden', async () => {
    await render(<SentenceHelp card={card} step={0} />, { explainSentence: () => ok(EXPLAINED) });
    await userEvent.click(screen.getByRole('button', { name: 'Explain this sentence' }));
    await userEvent.click(await screen.findByRole('button', { name: /^Ask the tutor, / }));
    const note = await screen.findByRole('note', { name: 'The tutor on this sentence' });
    expect(note.textContent).toContain('A reading was hidden so you can still answer.');
    expect(note.textContent).toContain('〜ている');
  });

  it('without a key, points to Settings', async () => {
    await render(<SentenceHelp card={card} step={0} />, { explainSentence: noKey });
    await userEvent.click(screen.getByRole('button', { name: 'Explain this sentence' }));
    await userEvent.click(await screen.findByRole('button', { name: /^Ask the tutor, / }));
    expect(await screen.findByRole('link', { name: 'Settings' })).toBeTruthy();
  });
});

describe('SentenceWrapUp (L5)', () => {
  it('shows the translation and the hardest grammar point, without the seal', async () => {
    await render(<SentenceWrapUp sentence={TRANSLATED} />);
    const wrap = await screen.findByRole('region', { name: 'This sentence' });
    expect(wrap.textContent).toContain('“While I waited for a friend, I read a book.”');
    expect(wrap.textContent).toMatch(/Grammar: .+ · .+ \(N[345]\)/u);
    expect(wrap.querySelector('a')?.getAttribute('href')).toMatch(/^\/grammar\//);
    expect(wrap.querySelector('[data-seal]')).toBeNull();
  });

  it('credits a Tatoeba sentence with a link to it (R9)', async () => {
    await render(<SentenceWrapUp sentence={{ ...TRANSLATED, sourceRef: '4711' }} />);
    const wrap = await screen.findByRole('region', { name: 'This sentence' });
    const link = within(wrap).getByRole('link', { name: 'Open #4711 on Tatoeba (new tab)' });
    expect(link.getAttribute('href')).toBe('https://tatoeba.org/en/sentences/show/4711');
  });

  it('renders nothing with neither', async () => {
    const view = await render(<SentenceWrapUp sentence={{ ...S.misfit, translation: '' }} />);
    expect(view.container.textContent).toBe('');
  });
});
