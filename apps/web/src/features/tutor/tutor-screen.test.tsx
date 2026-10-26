import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { saveLastConversation } from '../../ui/last-conversation.ts';
import type { TutorSheetSlotProps } from '../../ui/slots.tsx';
import { TutorScreen } from './tutor-screen.tsx';

/** A stand-in sheet that says what it was opened with. */
function Sheet({ topic, first, resume }: TutorSheetSlotProps) {
  return (
    <div role="dialog" aria-label={`About ${topic.about}`}>
      {first?.question}
      {resume?.map((turn) => turn.question).join('|')}
    </div>
  );
}

const LESSON = {
  id: 'scan-1',
  title: 'Weather and plans',
  createdAt: 1,
  pages: [],
  items: [],
  questions: [],
  practised: {},
} as unknown as ScannedLesson;

function render(options: { ready?: boolean; scans?: ScannedLesson[] } = {}) {
  const repos = createMemoryRepos();
  for (const scan of options.scans ?? []) void repos.scans.put(scan);
  const services = fakeServices({ repos, tutorReady: () => options.ready ?? true });
  return renderWithServices(<TutorScreen />, {
    services,
    slots: { tutorSheet: Sheet },
    path: '/tutor',
  });
}

describe('TutorScreen', () => {
  it('asks the tutor, with starters, and brings in what is studied in class', async () => {
    render();
    expect(screen.getByRole('heading', { name: 'Tutor', level: 1 })).toBeTruthy();
    expect(
      await screen.findByRole('textbox', { name: /^Your question to the tutor/ }),
    ).toBeTruthy();
    const href = (name: RegExp) => screen.getByRole('link', { name }).getAttribute('href');
    expect(href(/^Scanned lessons/)).toBe('/capture');
    expect(href(/^Write a sentence/)).toBe('/compose');
    expect(href(/^Words from class/)).toBe('/import');
    expect(href(/Tutor settings$/)).toBe('/settings/tutor');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const tab = within(nav).getByRole('link', { name: 'Tutor' });
    expect(tab.getAttribute('aria-current')).toBe('page');
  });

  it('opens the sheet on a general topic with the starter pressed', async () => {
    render();
    fireEvent.click(await screen.findByRole('button', { name: /^は or が\?, 1 request/ }));
    const sheet = await screen.findByRole('dialog', { name: 'About anything Japanese' });
    expect(sheet.textContent).toBe('は or が?');
  });

  it('carries on the last conversation, on its own topic', async () => {
    saveLastConversation({
      topic: { about: '〜そうだ', sentence: { text: '雨が降りそうだ。' } },
      turns: [{ question: '〜そうだ or 〜ようだ?', answer: { answer: 'A', readings: [] } }],
      at: Date.now(),
    });
    render();
    fireEvent.click(await screen.findByRole('button', { name: /^Carry on · today/ }));
    const sheet = await screen.findByRole('dialog', { name: 'About 〜そうだ' });
    expect(sheet.textContent).toBe('〜そうだ or 〜ようだ?');
  });

  it('names the newest scanned lesson and how much of it is practised', async () => {
    render({ scans: [LESSON] });
    expect(await screen.findByText(/Weather and plans/)).toBeTruthy();
    expect(screen.getByText(/Not started/)).toBeTruthy();
  });

  it('offers to set the tutor up when it is not, and keeps the week’s words', async () => {
    render({ ready: false });
    expect(await screen.findByRole('heading', { name: 'The tutor isn’t set up yet' })).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    const setUp = screen.getByRole('link', { name: 'Set up the tutor' });
    expect(setUp.getAttribute('href')).toBe('/settings/tutor');
    expect(screen.queryByRole('link', { name: /^Scanned lessons/ })).toBeNull();
    expect(screen.getAllByText('Needs the tutor')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /^Words from class/ })).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(await within(nav).findByRole('link', { name: 'Tutor, not set up yet' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Where do I get a key?' }));
    expect(screen.getByRole('dialog', { name: 'Getting a Gemini key' })).toBeTruthy();
  });

  it('reads in French and Spanish', async () => {
    const { unmount } = renderWithServices(<TutorScreen />, { language: 'fr' });
    expect(screen.getByRole('heading', { name: 'Tuteur', level: 1 })).toBeTruthy();
    unmount();
    renderWithServices(<TutorScreen />, { language: 'es' });
    expect(await screen.findByRole('link', { name: /^Escribir una frase/ })).toBeTruthy();
  });
});
