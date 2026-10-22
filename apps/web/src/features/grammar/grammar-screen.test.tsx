import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { grammarRepos } from '../../test/grammar-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import type { Slots } from '../../ui/slots.tsx';
import { GrammarScreen } from './grammar-screen.tsx';

async function open(
  path: string,
  options: { slots?: Slots; level?: 1 | 3; lang?: UiLanguage } = {},
) {
  const repos = await grammarRepos(options);
  const services = fakeServices({ repos });
  return renderWithServices(
    <Routes>
      <Route path="/grammar" element={<GrammarScreen />} />
      <Route path="/grammar/:id" element={<GrammarScreen />} />
      <Route path="/read" element={<p>session</p>} />
    </Routes>,
    {
      services,
      path,
      ...(options.slots ? { slots: options.slots } : {}),
      ...(options.lang ? { language: options.lang } : {}),
    },
  );
}

describe('grammar page (G4)', () => {
  it('shows the pattern, level, meaning, formation and explanation', async () => {
    await open('/grammar/te-mo-ii');
    expect(screen.getByRole('heading', { level: 1, name: '〜てもいい' })).toBeTruthy();
    const meaning = screen.getAllByText('it is all right to; may')[0];
    expect(meaning?.closest('header')?.querySelector('h1')).toBeTruthy();
    expect(screen.getByText('N5 · Permission')).toBeTruthy();
    const formed = screen.getByRole('region', { name: "How it's formed" });
    expect(within(formed).getByText('もいい').getAttribute('lang')).toBe('ja');
    expect(screen.getByText(/gives or asks for permission/)).toBeTruthy();
    const jisho = screen.getByRole('link', { name: 'Open 〜てもいい on Jisho (new tab)' });
    expect(jisho.getAttribute('href')).toBe(
      `https://jisho.org/search/${encodeURIComponent('てもいい')}`,
    );
  });

  it('lists example sentences with the grammar span and translations', async () => {
    await open('/grammar/te-mo-ii');
    const where = screen.getByRole('region', { name: "Where you'll see it" });
    expect(await within(where).findByText('“May I take a photo?”')).toBeTruthy();
    const span = where.querySelector('[data-target]');
    expect(span?.textContent).toBe('てもいい');
  });

  it('marks an English fallback translation', async () => {
    await open('/grammar/te-mo-ii', { lang: 'fr' });
    expect(await screen.findByText('« Puis-je prendre une photo ? »')).toBeTruthy();
    expect(screen.getByText('« You may sit. »').textContent).toContain('(en)');
    expect(screen.getByRole('note', { name: 'en anglais' })).toBeTruthy();
  });

  it('opens the word sheet slot on a tapped word', async () => {
    const wordSheet: Slots['wordSheet'] = ({ tokenIndex }) => <p>sheet {tokenIndex}</p>;
    await open('/grammar/te-mo-ii', { slots: { wordSheet } });
    fireEvent.click((await screen.findAllByRole('button', { name: '写真' }))[0] as HTMLElement);
    expect(screen.getByText('sheet 0')).toBeTruthy();
  });

  it('shows the learner state and related points', async () => {
    await open('/grammar/te-mo-ii', { level: 1 });
    expect(await screen.findByText('Learning · last reviewed 12 October')).toBeTruthy();
    const related = screen.getByRole('region', { name: 'Easy to confuse with' });
    const link = within(related).getByRole('link', { name: /〜てはいけない/ });
    expect(link.getAttribute('href')).toBe('/grammar/te-wa-ikenai');
  });

  it('says unseen points are not met yet and links practice', async () => {
    await open('/grammar/te-mo-ii');
    expect(await screen.findByText('Not met in a session yet')).toBeTruthy();
    const practise = screen.getByRole('link', { name: 'A full session on this point' });
    expect(practise.getAttribute('href')).toBe('/read?grammar=te-mo-ii');
  });

  it('asks the tutor only after the button, through the ask box slot', async () => {
    const askBox: Slots['askBox'] = ({ surface }) => <p>ask about {surface}</p>;
    await open('/grammar/te-mo-ii', { slots: { askBox } });
    const button = await screen.findByRole('button', { name: 'Ask the tutor' });
    expect(screen.queryByText(/ask about/)).toBeNull();
    fireEvent.click(button);
    expect(screen.getByText('ask about てもいい')).toBeTruthy();
  });

  it('falls back to harder sentences for a point above the level, and says so', async () => {
    await open('/grammar/kamoshirenai');
    expect(await screen.findByText('None at your level yet: these are N4 sentences.')).toBeTruthy();
    expect(screen.getByText('“It might rain.”')).toBeTruthy();
    expect(document.querySelector('[data-target]')?.textContent).toBe('かもしれ');
  });

  it('says when no sentence uses a point', async () => {
    await open('/grammar/ni-kawatte');
    expect(await screen.findByText('No sentence in your packs uses it yet.')).toBeTruthy();
  });

  it('handles an id outside the catalogue', async () => {
    await open('/grammar/no-such-point');
    expect(screen.getByText(/is not in the app's grammar list/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'All grammar' }).getAttribute('href')).toBe('/grammar');
  });

  it('shows the intro card with ?intro=1 and goes to the page on Got it', async () => {
    await open('/grammar/te-mo-ii?intro=1');
    expect(screen.getByRole('region', { name: 'New grammar: 〜てもいい' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(await screen.findByRole('heading', { level: 1, name: '〜てもいい' })).toBeTruthy();
  });
});

describe('particle pages (G5)', () => {
  it('shows a particle with its uses instead of a formation', async () => {
    await open('/grammar/particle-kara-from');
    expect(screen.getByRole('heading', { level: 1, name: 'から (from)' })).toBeTruthy();
    expect(screen.getByText('N5 · Particles and function words')).toBeTruthy();
    expect(screen.queryByRole('region', { name: "How it's formed" })).toBeNull();
    const uses = screen.getByRole('region', { name: "How it's used" });
    expect(uses.querySelectorAll('li').length).toBeGreaterThanOrEqual(2);
    const related = screen.getByRole('region', { name: 'Easy to confuse with' });
    expect(within(related).getByRole('link', { name: /から \(because\)/ })).toBeTruthy();
  });
});

describe('grammar index (P3)', () => {
  it('lists particles and function words in their own group', async () => {
    await open('/grammar');
    const group = screen.getByRole('region', { name: 'Particles and function words' });
    const ga = within(group).getByRole('link', { name: /subject marker/ });
    expect(ga.getAttribute('href')).toBe('/grammar/particle-ga');
  });

  it('groups the catalogue by level and family with each state', async () => {
    await open('/grammar', { level: 3 });
    expect(screen.getByRole('heading', { level: 1, name: 'Grammar' })).toBeTruthy();
    const n5 = screen.getByRole('region', { name: 'N5 grammar' });
    expect(within(n5).getAllByText('Permission').length).toBeGreaterThan(0);
    const row = within(n5).getByRole('link', { name: /〜てもいい/ });
    expect(row.getAttribute('href')).toBe('/grammar/te-mo-ii');
    expect(await within(row).findByText(/known/)).toBeTruthy();
    expect(screen.getByRole('region', { name: 'N3 grammar' })).toBeTruthy();
  });

  it('searches by pattern or meaning', async () => {
    await open('/grammar');
    const search = screen.getByRole('searchbox', { name: /Search grammar/ });
    fireEvent.change(search, { target: { value: 'all right to' } });
    expect(await screen.findByRole('link', { name: /〜てもいい/ })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'N3 grammar' })).toBeNull();
    fireEvent.change(search, { target: { value: 'qqqq' } });
    expect(await screen.findByText(/No grammar point matches/)).toBeTruthy();
  });
});
