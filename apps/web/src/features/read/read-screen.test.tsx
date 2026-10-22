import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { knowBasics, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { MistakeSlotProps, Slots } from '../../ui/slots.tsx';
import { diffParts } from './read-copy.ts';
import { ReadScreen } from './read-screen.tsx';

async function waitingRepos(): Promise<Repos> {
  const repos = await readingRepos({ currentLesson: 'Tobira 第4課', learnerLevel: 3 });
  await knowBasics(repos);
  await repos.sentences.delete(S.waitPlain.id);
  await repos.sentences.delete(S.came.id);
  await repos.sentences.delete(S.student.id);
  await track(repos, [[W.matsu, 2]], { lesson: 'Tobira 第4課' });
  return repos;
}

function Mistake({ grade, target }: MistakeSlotProps) {
  return (
    <p>
      explain {target.surface} {grade.errorType}
    </p>
  );
}

async function open(repos: Repos, slots: Slots = {}, path = '/read') {
  renderWithServices(<ReadScreen />, { services: fakeServices({ repos }), slots, path });
  return screen.findByLabelText('Reading of 待って');
}

describe('read copy', () => {
  it('finds the kana that differ', () => {
    expect(diffParts('しょうかい', 'しょかい')).toEqual(['しょ', 'う', 'かい']);
    expect(diffParts('まって', 'まて')).toEqual(['ま', 'っ', 'て']);
  });
});

describe('ReadScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('turns romaji into kana, grades a lookalike as wrong and shows the struck answer', async () => {
    const repos = await waitingRepos();
    const input = await open(repos, { mistakeExplanation: Mistake });
    const line = (_: string, el: Element | null) =>
      el?.tagName === 'P' && el.textContent === 'Tobira 第4課 · tap any word to look it up';
    expect(await screen.findByText(line)).toBeTruthy();
    await userEvent.type(input, 'motte');
    expect((input as HTMLInputElement).value).toBe('もって');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('You wrote')).toBeTruthy();
    expect(screen.getByRole('deletion').textContent).toBe('もって');
    expect(screen.getByText('explain 待っ wrong-kanji')).toBeTruthy();
    const ruby = document.querySelector('rt');
    expect(ruby?.textContent).toBe('ま');
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({ answer: 'もって', verdict: 'wrong', errorType: 'wrong-kanji' });
  });

  it('confirms a right answer quietly and moves to the next target with Enter', async () => {
    const repos = await waitingRepos();
    const input = await open(repos);
    await userEvent.type(input, 'matte{Enter}');
    expect(await screen.findByText('Read as')).toBeTruthy();
    expect(screen.getByText('まって')).toBeTruthy();
    const next = screen.getByRole('button', { name: 'Next word' });
    expect(document.activeElement).toBe(next);
    await userEvent.keyboard('{Enter}');
    const second = await screen.findByLabelText('Reading of 間');
    await userEvent.type(second, 'aida{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'Next sentence' }));
    const counts = await screen.findByRole('list', { name: 'Counts' });
    expect(counts.textContent).toContain('2 read right');
    expect(counts.textContent).toContain('0 to look at again');
  });

  it('retries only the missed target, then ends that round on its own', async () => {
    const repos = await waitingRepos();
    const input = await open(repos);
    await userEvent.type(input, 'nu{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'Next word' }));
    await userEvent.type(await screen.findByLabelText('Reading of 間'), 'aida{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'Next sentence' }));
    const before = (await repos.reviews.all()).length;
    await userEvent.click(await screen.findByRole('button', { name: 'Retry 1 missed' }));
    await userEvent.type(await screen.findByLabelText('Reading of 待って'), 'matte{Enter}');
    // Only 待って is asked again: its card ends the round.
    await userEvent.click(await screen.findByRole('button', { name: 'Next sentence' }));
    const counts = await screen.findByRole('list', { name: 'Counts' });
    expect(counts.textContent).toContain('1 read right');
    expect(screen.queryByRole('button', { name: /^Retry/ })).toBeNull();
    // The retry answer is graded and recorded like any review.
    expect((await repos.reviews.all()).length).toBe(before + 1);
  });

  it('shows the expected reading with the missing kana for a near-miss', async () => {
    const repos = await waitingRepos();
    const input = await open(repos);
    await userEvent.type(input, 'mate{Enter}');
    expect(await screen.findByText('Expected')).toBeTruthy();
    expect(document.querySelector('main b')?.textContent).toBe('っ');
    expect(screen.getByText('Almost: small っ')).toBeTruthy();
  });

  it('shows furigana on known words when ふ is pressed', async () => {
    const repos = await waitingRepos();
    await open(repos);
    expect(document.querySelectorAll('rt')).toHaveLength(0);
    const toggle = screen.getByRole('button', { name: 'Show furigana on known words' });
    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    const readings = [...document.querySelectorAll('rt')].map((rt) => rt.textContent);
    expect(readings).toEqual(['えき', 'ともだち', 'ほん', 'よ']);
  });

  it('keeps unanswered targets untappable so the sheet cannot leak their reading', async () => {
    const repos = await waitingRepos();
    const input = await open(repos);
    expect(screen.queryByRole('button', { name: '待っ' })).toBeNull();
    expect(screen.queryByRole('button', { name: '間' })).toBeNull();
    expect(screen.getByRole('button', { name: '駅' })).toBeTruthy();
    await userEvent.type(input, 'matte{Enter}');
    // Answered, the word shows its furigana, and its name says what it shows (WCAG 2.5.3).
    await userEvent.click(await screen.findByRole('button', { name: /^待\s*\(?ま\)?\s*っ$/ }));
    expect(await screen.findByRole('dialog', { name: '待っ in the dictionary' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '間' })).toBeNull();
  });

  it('plays the sentence aloud (R7)', async () => {
    const spoken: string[] = [];
    vi.stubGlobal('speechSynthesis', {
      cancel: () => undefined,
      speak: (u: { text: string }) => spoken.push(u.text),
    });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        constructor(readonly text: string) {}
      },
    );
    const repos = await waitingRepos();
    await open(repos);
    await userEvent.click(screen.getByRole('button', { name: 'Play the sentence' }));
    expect(spoken).toEqual([S.waiting.text]);
  });

  it('opens the offline dictionary sheet for a tapped word', async () => {
    const repos = await waitingRepos();
    await open(repos);
    await userEvent.click(screen.getByRole('button', { name: '駅' }));
    const sheet = await screen.findByRole('dialog', { name: '駅 in the dictionary' });
    expect(within(sheet).getByText(/station/)).toBeTruthy();
    expect(within(sheet).getByRole('link', { name: '駅' }).getAttribute('href')).toBe(
      '/kanji/%E9%A7%85',
    );
  });

  it('uses the word sheet slot when one is wired', async () => {
    const repos = await waitingRepos();
    const wordSheet = ({ tokenIndex }: { tokenIndex: number }) => <p>slot sheet {tokenIndex}</p>;
    await open(repos, { wordSheet });
    const line = (_: string, el: Element | null) =>
      el?.tagName === 'P' && el.textContent === 'Tobira 第4課 · tap any word to ask about it';
    expect(await screen.findByText(line)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '駅' }));
    expect(screen.getByText('slot sheet 0')).toBeTruthy();
  });

  it('switches to the voice slot and back', async () => {
    const repos = await waitingRepos();
    const voiceAnswer = ({
      onAnswer,
      onTypeInstead,
    }: {
      onAnswer: (k: string, ms: number) => void;
      onTypeInstead: () => void;
    }) => (
      <>
        <button type="button" onClick={() => onAnswer('まって', 2000)}>
          say it
        </button>
        <button type="button" onClick={onTypeInstead}>
          Type instead
        </button>
      </>
    );
    await open(repos, { voiceAnswer });
    await userEvent.click(screen.getByRole('button', { name: 'Answer by voice' }));
    await userEvent.click(screen.getByRole('button', { name: 'Type instead' }));
    await userEvent.click(screen.getByRole('button', { name: 'Answer by voice' }));
    await userEvent.click(screen.getByRole('button', { name: 'say it' }));
    expect(await screen.findByText('Read as')).toBeTruthy();
    expect((await repos.reviews.all())[0]).toMatchObject({ mode: 'voice', durationMs: 2000 });
  });

  it('shows what was said with a gap for a spoken near-miss, and keeps voice for the next word', async () => {
    const repos = await waitingRepos();
    const voiceAnswer = ({ onAnswer }: { onAnswer: (k: string, ms: number) => void }) => (
      <button type="button" onClick={() => onAnswer('まて', 1500)}>
        say it
      </button>
    );
    await open(repos, { voiceAnswer });
    await userEvent.click(screen.getByRole('button', { name: 'Answer by voice' }));
    await userEvent.click(screen.getByRole('button', { name: 'say it' }));
    expect(await screen.findByText('What you said')).toBeTruthy();
    expect(screen.getByText('What you said').nextElementSibling?.textContent).toBe('ま(no っ)て');
    const expected = screen.getByText('Expected').nextElementSibling;
    expect(expected?.querySelector('b')?.textContent).toBe('っ');
    expect(screen.queryByText('You wrote')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next word' }));
    expect(await screen.findByRole('button', { name: 'say it' })).toBeTruthy();
  });

  it('says so when a focused session has nothing to read', async () => {
    const repos = await waitingRepos();
    renderWithServices(<ReadScreen />, {
      services: fakeServices({ repos }),
      path: '/read?kanji=生&reading=い.きる',
    });
    expect((await screen.findByText(/fits/)).textContent).toContain(
      'No sentence with 生 read い・きる',
    );
  });
});
