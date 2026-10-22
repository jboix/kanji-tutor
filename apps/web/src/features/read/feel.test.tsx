import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReadingsDrill } from '../../domain/drills/index.ts';
import type { Repos } from '../../domain/repos.ts';
import { drillRepos } from '../../test/drill-fixtures.ts';
import { knowBasics, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { MistakeSlotProps, Slots } from '../../ui/slots.tsx';
import { sound } from '../../ui/sound.ts';
import { DrillScreen } from './drill-screen.tsx';
import { ReadScreen } from './read-screen.tsx';

async function waitingRepos(sounds = true): Promise<Repos> {
  const repos = await readingRepos({ sound: sounds, learnerLevel: 3 });
  await knowBasics(repos);
  await repos.sentences.delete(S.waitPlain.id);
  await repos.sentences.delete(S.came.id);
  await repos.sentences.delete(S.student.id);
  await track(repos, [[W.matsu, 2]]);
  return repos;
}

async function open(repos: Repos, slots: Slots = {}) {
  renderWithServices(<ReadScreen />, { services: fakeServices({ repos }), slots, path: '/read' });
  return screen.findByLabelText('Reading of 待って');
}

const state = () => document.querySelector('[data-answer]')?.getAttribute('data-answer');
const target = () => document.querySelector('[data-target]')?.getAttribute('data-target');

let play: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  play = vi.spyOn(sound, 'play').mockImplementation(() => undefined);
});
afterEach(() => {
  play.mockRestore();
});

describe('answer feedback (U2)', () => {
  it('turns a right answer green with a check, and plays the rising tone', async () => {
    const input = await open(await waitingRepos());
    expect(target()).toBe('');
    await userEvent.type(input, 'matte{Enter}');
    expect(await screen.findByText('Read as')).toBeTruthy();
    expect(state()).toBe('correct');
    expect(target()).toBe('correct');
    expect(screen.getByText('Right')).toBeTruthy();
    expect(document.querySelector('[data-check]')).toBeTruthy();
    expect(play).toHaveBeenCalledWith('correct');
    expect(document.body.textContent).not.toMatch(/great|well done|nice|correct!/i);
  });

  it('marks a miss as wrong with the crimson cross, no green, and the low tone', async () => {
    const input = await open(await waitingRepos());
    await userEvent.type(input, 'motte{Enter}');
    expect(await screen.findByText('You wrote')).toBeTruthy();
    expect(state()).toBe('wrong');
    expect(target()).toBe('missed');
    expect(screen.getByText('Not quite')).toBeTruthy();
    expect(document.querySelector('[data-check]')).toBeNull();
    expect(document.querySelector('[data-answer] [data-cross]')).toBeTruthy();
    // A plain grading result never shows the 解 seal: that is the tutor's.
    expect(document.querySelector('[data-answer] [data-seal]')).toBeNull();
    expect(play).toHaveBeenCalledWith('wrong');
  });

  it('treats a near-miss as a miss', async () => {
    const input = await open(await waitingRepos());
    await userEvent.type(input, 'mate{Enter}');
    expect(await screen.findByText('Expected')).toBeTruthy();
    expect(state()).toBe('wrong');
  });

  it('stays silent when answer sounds are off in Settings', async () => {
    const input = await open(await waitingRepos(false));
    await userEvent.type(input, 'matte{Enter}');
    expect(await screen.findByText('Read as')).toBeTruthy();
    expect(play).not.toHaveBeenCalled();
  });
});

function Teaching({ grade, target: t }: MistakeSlotProps) {
  return (
    <p>
      teach {t.surface} {grade.skipped ? 'skipped' : 'missed'}
    </p>
  );
}

describe('"I don\'t know" (L4)', () => {
  it('shows the reading, records a skip, and moves on to the second target only', async () => {
    const repos = await waitingRepos();
    await open(repos, { mistakeExplanation: Teaching });
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    expect(await screen.findByText('Here it is:')).toBeTruthy();
    expect(screen.getByText('まっ')).toBeTruthy();
    expect(state()).toBe('skipped');
    expect(screen.queryByRole('deletion')).toBeNull();
    expect(screen.getByText('teach 待っ skipped')).toBeTruthy();
    expect(play).not.toHaveBeenCalled();
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({ skipped: true, verdict: 'wrong', answer: '' });
    expect((await repos.items.get(`word:${W.matsu.id}`))?.card?.reps).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Next word' }));
    const second = await screen.findByLabelText('Reading of 間');
    await userEvent.type(second, 'aida{Enter}');
    expect(await screen.findByText('Read as')).toBeTruthy();
    expect((await repos.reviews.all()).map((r) => r.skipped ?? false)).toEqual([true, false]);
  });

  it('skips one word of a drill and shows its reading', async () => {
    const repos = await drillRepos();
    const drill: ReadingsDrill = {
      kind: 'readings',
      kanji: '生',
      items: [
        {
          wordId: W.ikiru.id,
          itemId: `word:${W.ikiru.id}`,
          form: '生きる',
          kanjiReading: 'い.きる',
          readings: ['いきる'],
        },
      ],
    };
    const onDone = vi.fn();
    renderWithServices(<DrillScreen drill={drill} topBar={null} onDone={onDone} />, {
      services: fakeServices({ repos }),
    });
    await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
    expect(await screen.findByText('Here it is:')).toBeTruthy();
    expect(screen.getByText('いきる')).toBeTruthy();
    expect(state()).toBe('skipped');
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'readings', right: false });
    expect((await repos.reviews.all())[0]).toMatchObject({ mode: 'drill', skipped: true });
  });
});
