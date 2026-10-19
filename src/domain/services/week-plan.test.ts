import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import type { SessionMix } from '../types.ts';
import {
  acceptPlan,
  clampMinutes,
  currentMix,
  nextWeekPlan,
  planLines,
  planSpecs,
  proposePlan,
} from './week-plan.ts';
import type { WeekReport, WeekStats } from './week-stats.ts';

const NOW = new Date(2026, 9, 18, 20).getTime();

function report(stats: Partial<WeekStats>, extra: Partial<WeekReport> = {}): WeekReport {
  return {
    stats: {
      week: '2026-W42',
      sentencesRead: 0,
      correct: 0,
      byErrorType: {},
      missExamples: [],
      unusedGrammar: [],
      ...stats,
    },
    start: 0,
    end: 0,
    unusedGrammarIds: [],
    activeDays: 5,
    minutesPerDay: 14,
    ...extra,
  };
}

const longVowelWeek = report(
  {
    sentencesRead: 212,
    correct: 186,
    byErrorType: { 'long-vowel': 7, sokuon: 1, 'wrong-kanji': 1 },
    unusedGrammar: ['〜わけではない', '〜に対して', '〜ことにする'],
  },
  { unusedGrammarIds: ['わけではない', 'に対して', 'ことにする'] },
);

const lookalikeWeek = report(
  { sentencesRead: 90, correct: 70, byErrorType: { 'wrong-kanji': 8, sokuon: 2 } },
  { minutesPerDay: 31, activeDays: 3 },
);

const emptyWeek = report({}, { activeDays: 0, minutesPerDay: 0 });

describe('proposePlan', () => {
  it.each([
    {
      name: 'long-vowel-heavy week',
      week: longVowelWeek,
      mix: {
        dailyMinutes: 15,
        focusErrorTypes: { 'long-vowel': 0.25 },
        grammarIds: ['わけではない', 'に対して'],
        drillShare: 0.05,
      },
    },
    {
      name: 'wrong-kanji-heavy week',
      week: lookalikeWeek,
      mix: { dailyMinutes: 30, focusErrorTypes: { sokuon: 0.25 }, grammarIds: [], drillShare: 0.3 },
    },
    {
      name: 'empty week',
      week: emptyWeek,
      mix: { dailyMinutes: 15, focusErrorTypes: {}, grammarIds: [], drillShare: 0 },
    },
  ])('$name', ({ week, mix }) => {
    expect(proposePlan(week).mix).toEqual(mix);
  });

  it('gives different review histories different mixes', () => {
    const mixes = [longVowelWeek, lookalikeWeek, emptyWeek].map((w) => proposePlan(w).mix);
    expect(new Set(mixes.map((m) => JSON.stringify(m))).size).toBe(3);
  });

  it('writes plan lines that say what the mix does', () => {
    expect(proposePlan(longVowelWeek).lines).toEqual([
      { when: 'Daily', what: '15 minutes of reading. One in four sentences has a long vowel.' },
      {
        when: 'Daily',
        what: 'Lookalike kanji drills, about 1 card in 20, for the kanji you mixed up.',
      },
      { when: 'Tue, Thu', what: 'Write one sentence each with 〜わけではない and 〜に対して.' },
    ]);
    expect(proposePlan(emptyWeek).lines).toEqual([
      { when: 'Daily', what: '15 minutes of reading.' },
    ]);
  });

  it('gives the same lines as data for the UI to word', () => {
    const { mix } = proposePlan(longVowelWeek);
    expect(planSpecs(mix, longVowelWeek)).toEqual([
      { kind: 'reading', minutes: 15, focus: ['long-vowel'] },
      { kind: 'drills', cards: 1 },
      { kind: 'grammar', patterns: ['〜わけではない', '〜に対して'] },
    ]);
  });

  it('ignores a single slip and slips the selector cannot find', () => {
    const week = report({ byErrorType: { 'long-vowel': 1, other: 6 } });
    expect(proposePlan(week).mix.focusErrorTypes).toEqual({});
  });

  it('keeps the previous mix through an empty week', () => {
    const previous: SessionMix = {
      dailyMinutes: 20,
      focusErrorTypes: { rendaku: 0.25 },
      grammarIds: ['old'],
      drillShare: 0.1,
    };
    expect(proposePlan(emptyWeek, previous).mix).toEqual({ ...previous, grammarIds: [] });
  });

  it('names one grammar point on its own', () => {
    const week = report({ unusedGrammar: ['〜ために'] }, { unusedGrammarIds: ['ために'] });
    const mix = proposePlan(week).mix;
    expect(planLines(mix, week).at(-1)).toEqual({
      when: 'Tue',
      what: 'Write one sentence with 〜ために.',
    });
  });
});

describe('clampMinutes', () => {
  it('rounds to five and stays within 10–30', () => {
    expect([2, 12, 13, 22.4, 45].map(clampMinutes)).toEqual([10, 10, 15, 20, 30]);
  });
});

describe('acceptPlan', () => {
  it('saves an accepted plan for next week, which sessions read from Monday', async () => {
    const repos = createMemoryRepos();
    const { lines, mix } = proposePlan(longVowelWeek);
    const plan = await acceptPlan(repos, { now: NOW, letter: ['A letter.'], lines, mix });
    expect(plan).toMatchObject({ id: '2026-W43', status: 'accepted', mix, lines });
    expect(await nextWeekPlan(repos, NOW)).toEqual(plan);
    expect(await currentMix(repos, NOW)).toBeUndefined();
    const monday = new Date(2026, 9, 19, 8).getTime();
    expect(await currentMix(repos, monday)).toEqual(mix);
  });

  it('ignores a plan that was only proposed', async () => {
    const repos = createMemoryRepos();
    const { lines, mix } = proposePlan(lookalikeWeek);
    await repos.plans.put({
      id: '2026-W42',
      createdAt: NOW,
      letter: [],
      lines,
      mix,
      status: 'proposed',
    });
    expect(await currentMix(repos, NOW)).toBeUndefined();
  });
});
