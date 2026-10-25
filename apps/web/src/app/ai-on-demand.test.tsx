/**
 * A13: no screen or slot calls the AI on its own. Every slot and AI-backed screen is mounted with
 * the real AI client over a counting mock provider; requests happen only after a button press,
 * and with "Also explain my mistakes automatically" exactly one per miss and none per skip.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createAiClient } from '../ai/client.ts';
import { createMockProvider } from '../ai/providers/mock.ts';
import { fakeVerifier, testContext } from '../ai/testing/context.ts';
import type { AiProvider, AiRequest } from '../ai/types.ts';
import type { Repos } from '../domain/repos.ts';
import { CAPTURE_LINES } from '../domain/services/capture-fixtures.ts';
import { buildScan, emptyScan, saveScan } from '../domain/services/index.ts';
import type { Settings } from '../domain/types.ts';
import { CaptureScreen } from '../features/capture/capture-screen.tsx';
import { NotesScreen } from '../features/notes/notes-screen.tsx';
import { ReadScreen } from '../features/read/read-screen.tsx';
import { CARD, TARGET, WRONG } from '../test/explain-results.ts';
import { knowBasics, readingRepos, S, track, W } from '../test/reading-fixtures.ts';
import { fakeLang, fakeServices, renderWithServices } from '../test/render.tsx';
import { SLOTS } from './slots.tsx';

/** The mock provider, counting every request that would have gone to Gemini. */
function countingProvider(): AiProvider & { tasks: string[] } {
  const mock = createMockProvider();
  const tasks: string[] = [];
  return {
    id: 'mock',
    tasks,
    generate: (request: AiRequest, signal?: AbortSignal) => {
      tasks.push(request.task);
      return mock.generate(request, signal);
    },
  };
}

async function setup(settings: Partial<Settings> = {}) {
  const repos = await readingRepos({ sound: false, learnerLevel: 3, ...settings });
  await knowBasics(repos);
  for (const id of [S.waitPlain.id, S.came.id, S.student.id]) await repos.sentences.delete(id);
  await track(repos, [[W.matsu, 2]]);
  const provider = countingProvider();
  const context = testContext({
    provider,
    cache: repos.aiCache,
    log: repos.aiLog,
    lang: fakeVerifier(),
  });
  const ai = createAiClient(async () => context);
  const lang = fakeLang({
    tokenize: async (text) => Object.values(S).find((s) => s.text === text)?.tokens ?? [],
  });
  return { repos, provider, services: fakeServices({ repos, ai, lang }) };
}

/** The first task call loads the task module (Zod, prompts): give it time under load. */
const SLOW = { timeout: 5000 };

/** Lets lazy slots, peeks and effects settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

async function answerField() {
  const field = () => screen.queryByLabelText(/^Reading of /);
  // The real client and the lazy slots load under a loaded machine: wait longer than 1 s.
  await waitFor(
    () => expect(field() ?? screen.queryByRole('button', { name: 'Got it' })).toBeTruthy(),
    SLOW,
  );
  const gotIt = screen.queryByRole('button', { name: 'Got it' });
  if (gotIt) await userEvent.click(gotIt);
  return (await screen.findByLabelText(/^Reading of /)) as HTMLInputElement;
}

async function tapAndClose(name: string, dialog: RegExp) {
  await userEvent.click(screen.getAllByRole('button', { name })[0] as HTMLElement);
  const sheet = await screen.findByRole('dialog', { name: dialog });
  await settle();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
}

describe('AI only on demand (A13)', () => {
  it('a reading session calls nothing until a button is pressed', async () => {
    const { services, provider } = await setup();
    renderWithServices(<ReadScreen />, { services, slots: SLOTS, path: '/read' });
    const field = await answerField();
    await userEvent.click(await screen.findByRole('button', { name: 'Explain this sentence' }));
    await screen.findByRole('dialog', { name: 'About this sentence' });
    await settle();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await tapAndClose('友達', /^友達 in this sentence$/);
    await tapAndClose('で', /^で in this sentence$/);
    await userEvent.type(field, 'motte{Enter}');
    expect(await screen.findByRole('region', { name: 'What went wrong' })).toBeTruthy();
    await settle();
    expect(provider.tasks).toEqual([]);

    await userEvent.click(screen.getByRole('button', { name: /^Ask the tutor why, / }));
    expect(await screen.findByRole('note', { name: 'Why this reading' }, SLOW)).toBeTruthy();
    expect(provider.tasks).toEqual(['explainMistake']);
  });

  it('explains each miss once, and no skip, with the automatic setting on', async () => {
    const { services, provider } = await setup({ tutor: 'auto-mistakes' });
    renderWithServices(<ReadScreen />, { services, slots: SLOTS, path: '/read' });
    await userEvent.type(await answerField(), 'motte{Enter}');
    expect(await screen.findByRole('note', { name: 'Why this reading' }, SLOW)).toBeTruthy();
    await settle();
    expect(provider.tasks).toEqual(['explainMistake']);
    await userEvent.click(await screen.findByRole('button', { name: /^Next (word|sentence)$/ }));
    await answerField();
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    expect(await screen.findByText(/Here it is:/)).toBeTruthy();
    await settle();
    expect(provider.tasks).toEqual(['explainMistake']);
  });

  it('every explain and teach slot mounts without a call', async () => {
    const { services, provider } = await setup();
    const { MistakeExplanation, ReadingHook, TeachingCard, SentenceWrapUp, NewItemIntro } = {
      MistakeExplanation: SLOTS.mistakeExplanation,
      ReadingHook: SLOTS.readingHook,
      TeachingCard: SLOTS.teachingCard,
      SentenceWrapUp: SLOTS.sentenceWrapUp,
      NewItemIntro: SLOTS.newItemIntro,
    };
    if (!(MistakeExplanation && ReadingHook && TeachingCard && SentenceWrapUp && NewItemIntro)) {
      throw new Error('slots not wired');
    }
    const noop = () => undefined;
    renderWithServices(
      <>
        <MistakeExplanation
          card={CARD}
          target={TARGET}
          answer="motte"
          grade={WRONG}
          onOpenWord={noop}
        />
        <TeachingCard card={CARD} target={TARGET} grade={WRONG} />
        <NewItemIntro card={CARD} target={TARGET} onDone={noop} />
        <SentenceWrapUp sentence={S.waiting} />
        <ReadingHook kanji="待" reading="ま.つ" wordIds={[W.matsu.id]} />
      </>,
      { services },
    );
    expect(await screen.findByRole('region', { name: 'What went wrong' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: /^Show a memory hook, / })).toBeTruthy();
    await settle();
    expect(provider.tasks).toEqual([]);
  });

  it('notes and a scanned lesson call nothing until asked', async () => {
    const { services, provider, repos } = await setup();
    const base = emptyScan({ id: 'saved', now: Date.now() });
    const pages = [
      {
        kind: 'reading' as const,
        lines: CAPTURE_LINES.map((l) => ({ ...l, verified: true })),
        questions: [],
      },
    ];
    await saveScan(
      repos as Repos,
      await buildScan(repos as Repos, { base, pages, level: 3 }),
      Date.now(),
    );
    const notes = renderWithServices(<NotesScreen />, { services, path: '/notes' });
    await screen.findByRole('heading', { name: 'This week' });
    await settle();
    notes.unmount();
    renderWithServices(<CaptureScreen />, { services, slots: SLOTS, path: '/capture?id=saved' });
    await screen.findByRole('region', { name: 'The pages’ text' });
    await userEvent.click(screen.getByRole('button', { name: /^Ask the tutor about / }));
    await settle();
    expect(provider.tasks).toEqual([]);
  });
});
