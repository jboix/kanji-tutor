import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

function setup(section: 'sessions' | 'tutor' = 'sessions') {
  const repos = createMemoryRepos();
  renderSettingsSection(section, { services: fakeServices({ repos }) });
  return repos;
}

describe('Reading settings', () => {
  it('sets the furigana default (R4)', async () => {
    const repos = setup();
    const group = await screen.findByRole('group', { name: 'Furigana' });
    expect(within(group).getByLabelText('New words only')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('All words'));
    expect((await repos.settings.get()).furigana).toBe('all');
  });

  it('has no sound field: Sound moved to Appearance', async () => {
    setup();
    await screen.findByRole('group', { name: 'Furigana' });
    expect(screen.queryByRole('group', { name: 'Sound' })).toBeNull();
  });

  it('sets the session length, 5 minutes by default (L6)', async () => {
    const repos = setup();
    const group = await screen.findByRole('group', { name: 'Session length' });
    expect(within(group).getByLabelText('5 min')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('15 min'));
    expect((await repos.settings.get()).sessionMinutes).toBe(15);
  });

  it('turns "Explain new things first" off, on by default (L7)', async () => {
    const repos = setup();
    const group = await screen.findByRole('group', { name: 'Explain new things first' });
    expect(within(group).getByLabelText('On')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('Off'));
    expect((await repos.settings.get()).explainFirst).toBe(false);
    expect(
      screen.getByText(/A "New" chip on the exercise opens the same explanation/),
    ).toBeTruthy();
  });

  it('switches "Write the kanji" from drawn to typed, drawn by default', async () => {
    const repos = setup();
    const group = await screen.findByRole('group', { name: 'Write the kanji' });
    expect(within(group).getByLabelText('Draw')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('Type'));
    expect((await repos.settings.get()).writeKanji).toBe('type');
  });

  it('turns listening exercises off, on by default', async () => {
    const repos = setup();
    const group = await screen.findByRole('group', { name: 'Listening exercises' });
    expect(within(group).getByLabelText('On')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('Off'));
    expect((await repos.settings.get()).listening).toBe(false);
  });

  it('keeps each explanation behind its ? until asked for', async () => {
    setup();
    const help = await screen.findByRole('button', { name: 'About Write the kanji' });
    const hint = screen.getByText(/Draw each kanji with your finger/);
    expect(hint.closest('[hidden]')).toBeTruthy();
    await userEvent.click(help);
    expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(hint.closest('[hidden]')).toBeNull();
  });

  it('saves the current lesson and shows its Japanese in Japanese type (K5, issue 57)', async () => {
    const repos = setup();
    const field = await screen.findByLabelText('Current lesson');
    await userEvent.type(field, 'Tobira 第4課');
    const section = screen.getByRole('region', { name: 'Reading' });
    await userEvent.click(within(section).getByRole('button', { name: 'Save' }));
    expect((await repos.settings.get()).currentLesson).toBe('Tobira 第4課');
    const tag = await screen.findByText('第4課', { selector: '[lang="ja"]' });
    expect(tag.parentElement?.textContent).toContain('Tobira 第4課');
    expect(screen.getByText(/Tobira/).closest('[lang="ja"]')).toBeNull();
  });

  it('picks a listed fast model or takes any ID (N3, A12)', async () => {
    const repos = setup('tutor');
    const field = await screen.findByLabelText('Fast model');
    const fast = field.closest('div[class]')?.parentElement as HTMLElement;
    await userEvent.click(within(fast).getByRole('button', { name: 'gemini-3.1-flash-lite' }));
    expect((await repos.settings.get()).modelId).toBe('gemini-3.1-flash-lite');
    await userEvent.clear(field);
    await userEvent.type(field, 'gemini-3.7-flash');
    await userEvent.click(within(fast).getByRole('button', { name: 'Use' }));
    expect((await repos.settings.get()).modelId).toBe('gemini-3.7-flash');
    expect(screen.getByText(/estimates use the Flash-Lite price/)).toBeTruthy();
  });

  it('sets the teacher model apart, with its dated price (A12)', async () => {
    const repos = setup('tutor');
    const field = await screen.findByLabelText('Teacher model');
    expect(field).toHaveProperty('value', 'gemini-3.5-flash-lite');
    const teacher = field.closest('div[class]')?.parentElement as HTMLElement;
    await userEvent.click(within(teacher).getByRole('button', { name: 'gemini-3.8-flash' }));
    const settings = await repos.settings.get();
    expect([settings.teacherModelId, settings.modelId]).toEqual([
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ]);
    expect(within(teacher).getByText(/then \$1\.50 and \$7\.50/)).toBeTruthy();
  });
});
