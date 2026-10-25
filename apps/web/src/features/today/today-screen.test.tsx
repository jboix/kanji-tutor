import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HON, withJlptIndex } from '../../test/jlpt-index.ts';
import { knowBasics, NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { offerUpdate, resetAppUpdate } from '../../ui/app-update.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { dateLine, missLead, whenLine } from './today-copy.ts';
import { TodayScreen } from './today-screen.tsx';

const t = createTranslator('en', ENGLISH, ENGLISH);

describe('today copy', () => {
  it('counts plainly', () => {
    expect(t('today.minutes', { n: 1 })).toBe('1 minute');
    expect(t('today.minutes', { n: 12 })).toBe('12 minutes');
    expect(dateLine(NOW)).toBe('10月17日（土）');
  });

  it('describes the misses and when', () => {
    expect(missLead(t, 'long-vowel', 3)).toBe('Most misses were long vowels, like');
    expect(missLead(t, 'sokuon', 1)).toBe('The one miss was a missing or extra small っ, like');
    expect(whenLine(t, 0)).toBe('today');
    expect(whenLine(t, 1)).toBe('yesterday');
    expect(whenLine(t, 3)).toBe('3 days ago');
  });
});

describe('TodayScreen', () => {
  it('offers a new version at the top, under the date (N1e)', async () => {
    await offerUpdate(
      async () => undefined,
      async () => ({ version: '9.9.9', notes: [] }),
    );
    renderWithServices(<TodayScreen />, {
      services: fakeServices({ repos: await readingRepos() }),
    });
    const card = screen.getByRole('region', { name: 'A new version' });
    expect(card.previousElementSibling?.tagName).toBe('HEADER');
    expect(card.textContent).toContain('9.9.9');
    resetAppUpdate();
  });

  it('shows where you are, last time, what Start plays and the class (IA2)', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]], { lesson: 'Tobira 第4課' });
    await repos.reviews.add({
      at: Date.now() - 1000,
      itemId: `word:${W.shoukai.id}`,
      answer: 'shokai',
      expected: 'しょうかい',
      verdict: 'near-miss',
      errorType: 'long-vowel',
      durationMs: 3000,
      mode: 'typed',
    });
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    // The daily mix's tile gives the session's size once it is built (N10).
    const mix = await screen.findByRole('link', {
      name: /^Daily mix\s?\d+ sentences? · \d+ minutes?$/,
    });
    expect(mix.getAttribute('href')).toBe('/read');
    const where = screen.getByRole('region', { name: 'Where you are' });
    expect(where.textContent).toContain(
      'Last time, today: 1 sentence, 0 read right. The one miss was a long vowel, like しょかい for しょうかい.',
    );
    expect(within(where).getByRole('link', { name: 'Details' }).getAttribute('href')).toBe(
      '/learned',
    );
    expect(
      await within(where).findByRole('progressbar', { name: /^Kanji: \d+ of \d+ known$/ }),
    ).toBeTruthy();
    // The gear went: Settings is a tab of the bar (IA3).
    expect(screen.queryByRole('link', { name: 'Settings' })?.closest('nav')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'This week in class' }).textContent).toContain(
      '0 of 1',
    );
    expect(screen.getByRole('link', { name: "Change this week's plan" }).getAttribute('href')).toBe(
      '/plan',
    );
  });

  it('has a tile for each round and for writing and photos, and what you know (IA2)', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    const practise = await screen.findByRole('region', { name: 'Practise' });
    const href = (name: RegExp) =>
      within(practise).getByRole('link', { name }).getAttribute('href');
    expect(href(/^Just read/)).toBe('/read?only=reading');
    expect(href(/^Write a sentence/)).toBe('/compose');
    expect(href(/^Read a photo/)).toBe('/capture');
    await waitFor(() => expect(href(/^Kanji readings/)).toMatch(/^\/read\?/));
    expect(href(/^Grammar drills/)).toMatch(/^\/read\?/);
    const known = await screen.findByRole('region', { name: 'What you know' });
    expect(
      within(known)
        .getByRole('link', { name: /^\d+\s?words?$/ })
        .getAttribute('href'),
    ).toBe('/learned');
    expect(screen.getByRole('link', { name: /^Find my level/ }).getAttribute('href')).toBe(
      '/placement',
    );
  });

  it('links a brand-new learner to the known-words import', async () => {
    const repos = await readingRepos();
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    const link = await screen.findByRole('link', { name: /Mark what you already know/ });
    expect(link.getAttribute('href')).toBe('/import');
  });

  it('gives a learner from zero a session and the level bars (P1)', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    await repos.sentences.put(HON);
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    expect(await screen.findByText(/1 sentence/)).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Where you are · N5' })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: /^Words: 0 of \d+ known$/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Mark what you already know/ })).toBeTruthy();
  });

  it('says plainly when nothing fits', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.eki, 3]], { dueIn: 9e9 });
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    expect(
      await screen.findByRole('link', { name: /^Daily mix\s?Nothing due right now$/ }),
    ).toBeTruthy();
  });

  it('shows the swapped lookalike pair and the next grammar point', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
    await knowBasics(repos);
    await repos.grammar.put({
      id: 'wake',
      pattern: '〜わけではない',
      meaning: 'not that',
      lesson: 'Tobira 第4課',
      exampleSentenceIds: [],
    });
    for (const answer of ['もつ', 'もって']) {
      await repos.reviews.add({
        at: Date.now() - 1000,
        itemId: `word:${W.matsu.id}`,
        answer,
        expected: answer === 'もつ' ? 'まつ' : 'まっ',
        verdict: 'wrong',
        errorType: 'wrong-kanji',
        durationMs: 3000,
        mode: 'typed',
      });
    }
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    const pair = await screen.findByRole('link', { name: /still swapping these · 2 times/ });
    expect(pair.getAttribute('href')).toBe('/kanji/%E5%BE%85');
    const compose = screen.getByRole('link', { name: /Write one sentence with/ });
    expect(compose.getAttribute('href')).toBe('/compose?grammar=wake');
    expect(screen.getByRole('region', { name: 'Where you are' }).textContent).toContain(
      'Most misses were lookalike kanji, like',
    );
  });
});
