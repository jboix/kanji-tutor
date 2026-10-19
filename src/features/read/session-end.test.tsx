import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import type { Grade, Word } from '../../domain/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { NOW, readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { againPlan } from './session-again.ts';
import { SessionEnd, type SessionEndProps } from './session-end.tsx';
import { retryOf, roundOf } from './session-round.ts';
import type { Answered } from './session-state.ts';

function Where() {
  const { pathname, search, state } = useLocation();
  const retry = retryOf(state);
  const round = roundOf(state) > 0 ? 'new' : 0;
  const what = retry ? ` retry ${retry.map((c) => c.targets.length).join('+')}` : '';
  return <output aria-label="where">{`${pathname}${search} #${round}${what}`}</output>;
}

const target = (tokenIndex: number, word: Word): Target => ({
  tokenIndex,
  itemId: `word:${word.id}`,
  wordId: word.id,
  surface: word.forms[0] ?? '',
  readings: [...word.readings],
});

const sentence = (s: SessionCard['sentence'], t: Target): SessionCard => ({
  sentence: s,
  targets: [t],
  reason: 'due',
});

// 待っ in 駅で友達を待っている間に…, 学生 in 学生が本を…, 友達 in 友達が来ました。
const cards = [
  sentence(S.waiting, target(4, W.matsu)),
  sentence(S.student, target(0, W.gakusei)),
  sentence(S.came, target(0, W.tomodachi)),
  sentence(S.waitPlain, target(0, W.eki)),
];

const answer = (card: number, grade: Partial<Grade>): Answered => {
  const t = cards[card]?.targets[0] as Target;
  const full = { verdict: 'correct' as const, expected: t.readings[0] ?? '', given: '', ...grade };
  return { target: t, answer: full.given, mode: 'typed', card, grade: full };
};

const RIGHT = [0, 1, 2, 3].map((i) =>
  answer(i, { given: cards[i]?.targets[0]?.readings[0] ?? '' }),
);

async function end(props: Partial<SessionEndProps>, path = '/read', repos?: Repos) {
  const all: SessionEndProps = { cards, results: RIGHT, again: { replay: true }, ...props };
  const services = fakeServices({ repos: repos ?? createMemoryRepos() });
  renderWithServices(
    <>
      <SessionEnd {...all} />
      <Where />
    </>,
    { services, path },
  );
  // The lists show once "New today" is looked up.
  await screen.findByRole('list', { name: 'Counts' });
}

describe('againPlan', () => {
  it('asks Start for a mix after the plain session, and for the saved choice after a lesson', () => {
    expect(againPlan({})).toEqual({ start: 'mix' });
    expect(againPlan({ focus: undefined, grammar: undefined })).toEqual({ start: 'mix' });
    expect(againPlan({ unit: 'u1', section: 'words', part: 2 })).toEqual({ start: undefined });
  });

  it('plays any other session again', () => {
    expect(againPlan({ grammar: 'te-mo-ii' })).toEqual({ replay: true });
    expect(againPlan({ drillShare: 0, questionEvery: 0 })).toEqual({ replay: true });
    expect(againPlan({ unit: 'u1', passage: false })).toEqual({ replay: true });
    expect(againPlan({ focus: { kanji: '生', reading: 'ショウ' } })).toEqual({ replay: true });
  });

  it('reads the round stamp and the retry cards from link state', () => {
    expect(roundOf(undefined)).toBe(0);
    expect(roundOf({ sessionBuiltAt: 4 })).toBe(0);
    expect(roundOf({ round: 'x' })).toBe(0);
    expect(roundOf({ round: 12 })).toBe(12);
    expect(retryOf({ round: 1 })).toBeUndefined();
    expect(retryOf({ round: 1, retry: [] })).toBeUndefined();
    expect(retryOf({ round: 1, retry: cards })).toEqual(cards);
  });
});

describe('SessionEnd', () => {
  it('says お疲れさまでした with the time taken, and plain counts', async () => {
    await end({ startedAt: Date.now() - 9 * 60_000 });
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.getAttribute('lang')).toBe('ja');
    expect(title.querySelector('rt')?.textContent).toBe('つか');
    expect(screen.getByText('Session done · about 9 minutes')).toBeTruthy();
    const counts = screen.getByRole('list', { name: 'Counts' });
    const items = within(counts)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual(['4 sentences', '4 read right', '0 to look at again']);
    expect(document.querySelector('[data-done-mark]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('with nothing missed, has no list to look at again and no Retry', async () => {
    await end({});
    expect(screen.queryByRole('heading', { name: 'To look at again' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Retry/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Next session' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Back to Home' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
  });

  it('keeps the copy factual: no praise', async () => {
    await end({});
    expect(document.body.textContent).not.toMatch(/great|amazing|well done|congrat|!/i);
  });

  it('lists the misses: the word and its reading, what was written and why', async () => {
    const results = [
      answer(0, { verdict: 'near-miss', errorType: 'sokuon', given: 'まて' }),
      answer(1, { verdict: 'wrong', skipped: true }),
      RIGHT[2] as Answered,
      RIGHT[3] as Answered,
    ];
    await end({ results });
    const section = screen.getByRole('region', { name: 'To look at again' });
    const entries = within(section).getAllByRole('listitem');
    expect(entries).toHaveLength(2);
    expect(entries[0]?.querySelector('[data-target="missed"]')?.textContent).toContain('待');
    expect(entries[0]?.querySelector('rt')?.textContent).toBe('ま');
    expect(within(entries[0] as HTMLElement).getByRole('deletion').textContent).toBe('まて');
    expect(entries[0]?.textContent).toContain('You wrote まて · a small っ');
    expect(entries[1]?.textContent).toContain('You didn’t know it');
    const counts = screen.getByRole('list', { name: 'Counts' });
    expect(counts.textContent).toContain('2 to look at again');
    expect(screen.getByRole('button', { name: 'Retry 2 missed' })).toBeTruthy();
  });

  it('shows two misses first and the rest in place with See all', async () => {
    const results = [0, 1, 2, 3].map((i) => answer(i, { verdict: 'wrong', given: 'ぬ' }));
    await end({ results });
    const section = screen.getByRole('region', { name: 'To look at again' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'See all 4' }));
    expect(within(section).getAllByRole('listitem')).toHaveLength(4);
    expect(document.activeElement).toBe(within(section).getAllByRole('listitem')[2]);
  });

  it('names a missed exercise', async () => {
    const drill: SessionCard = {
      sentence: S.came,
      targets: [],
      reason: 'drill',
      question: {} as never,
    };
    await end({
      cards: [...cards, drill],
      drills: [{ kind: 'kanji-reading', right: false, card: 4 }],
    });
    expect(screen.getByText('A question, not right this time')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry 1 missed' })).toBeTruthy();
  });

  it('retries only the missed cards, right away, as a new round', async () => {
    const results = [
      answer(0, { verdict: 'wrong' }),
      RIGHT[1] as Answered,
      answer(3, { verdict: 'wrong' }),
    ];
    await end({ results }, '/read?grammar=te-mo-ii');
    await userEvent.click(screen.getByRole('button', { name: 'Retry 2 missed' }));
    expect(await screen.findByText('/read?grammar=te-mo-ii #new retry 1+1')).toBeTruthy();
  });

  it('plays the same request again as a new round with Next session', async () => {
    await end({ again: { replay: true } }, '/read?grammar=te-mo-ii');
    expect(screen.getByLabelText('where').textContent).toBe('/read?grammar=te-mo-ii #0');
    await userEvent.click(screen.getByRole('button', { name: 'Next session' }));
    expect(await screen.findByText('/read?grammar=te-mo-ii #new')).toBeTruthy();
  });

  it("asks Start's resolver for the next mix", async () => {
    await end({ again: { start: 'mix' } });
    await userEvent.click(screen.getByRole('button', { name: 'Next session' }));
    expect(await screen.findByText('/read #new')).toBeTruthy();
  });

  it('keeps a unit practice its way back to the unit', async () => {
    await end({ unit: 'u1' }, '/read?unit=u1');
    expect(screen.getByRole('link', { name: 'Back to the unit' }).getAttribute('href')).toBe(
      '/units/u1',
    );
    expect(screen.getByRole('button', { name: 'Next session' })).toBeTruthy();
  });

  it('keeps the lesson part its own next step, with Retry beside it', async () => {
    const lesson = { unit: 'u1', section: 'words' as const, part: 1 };
    const results = [answer(0, { verdict: 'wrong' })];
    await end(
      { unit: 'u1', lesson, again: { start: undefined }, results },
      '/read?unit=u1&section=words',
    );
    expect(await screen.findByRole('link', { name: /^Next: / })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next session' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry 1 missed' })).toBeTruthy();
  });

  it('shows what was met for the first time in this session', async () => {
    const repos = await readingRepos();
    const at = NOW + 1000;
    const add = (word: Word) =>
      repos.reviews.add({
        at,
        itemId: `word:${word.id}`,
        answer: '',
        expected: '',
        verdict: 'correct',
        durationMs: 1,
        mode: 'typed',
      });
    await add(W.matsu);
    await add(W.gakusei);
    await repos.reviews.add({
      ...{ at: NOW - 1, itemId: `word:${W.eki.id}` },
      answer: '',
      expected: '',
      verdict: 'correct',
      durationMs: 1,
      mode: 'typed',
    });
    await add(W.eki);
    await end({ startedAt: NOW }, '/read', repos);
    const section = await screen.findByRole('region', { name: 'New today' });
    const kinds = [...section.querySelectorAll('[data-met]')].map((el) =>
      el.getAttribute('data-met'),
    );
    // 待 学 生 and 待つ 学生 are new; 駅 was read before. One of each kind first, then in order.
    expect(kinds).toEqual(['kanji', 'kanji', 'word']);
    expect(section.textContent).toContain('to wait');
    expect(section.textContent).toContain('and 2 more');
    expect(section.textContent).not.toContain('station');
  });
});
