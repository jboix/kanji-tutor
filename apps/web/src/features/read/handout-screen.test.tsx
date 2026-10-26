import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HandoutQuestion, ScannedLesson } from '../../domain/scan-types.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { HandoutScreen } from './handout-screen.tsx';
import { splitBlank } from './handout-stem.tsx';

const CHOOSE: HandoutQuestion = {
  id: '0-4',
  page: 0,
  number: '4',
  type: 'choose-form',
  stem: '雨が降り＿＿です。',
  choices: ['そう', 'よう'],
  answer: 'そう',
  answerVerified: true,
  explanation: 'The sky looks dark, so it looks about to rain.',
  readings: [],
  practises: [],
};

const FREE: HandoutQuestion = {
  ...CHOOSE,
  id: '0-8',
  number: '8',
  type: 'free',
  stem: '週末の天気について、一文を書きなさい。',
  choices: [],
  answer: '週末は晴れるでしょう。',
  explanation: 'でしょう says what you expect.',
};

const LESSON: ScannedLesson = {
  id: 'scan1',
  createdAt: 1,
  updatedAt: 1,
  title: 'Weather',
  suggestedTitle: 'Weather',
  week: '2026-W43',
  pages: [
    { kind: 'handout', lines: [{ text: '雨が降り＿＿です。', verified: true, sentenceId: 's' }] },
  ],
  items: [],
  questions: [CHOOSE, FREE],
  practised: {},
};

function cardOf(question: HandoutQuestion): SessionCard {
  const sentence = {
    id: 'h',
    text: question.stem,
    source: 'capture' as const,
    tokens: [],
    wordIds: [],
    verified: true,
  };
  return {
    sentence,
    targets: [],
    reason: 'drill',
    handout: question,
    scan: { lessonId: 'scan1', key: `question:${question.id}` },
  };
}

async function show(question: HandoutQuestion) {
  const repos = createMemoryRepos();
  await repos.scans.put(LESSON);
  const onDone = vi.fn();
  renderWithServices(<HandoutScreen card={cardOf(question)} topBar={null} onDone={onDone} />, {
    services: fakeServices({ repos }),
  });
  return { repos, onDone };
}

describe('splitBlank', () => {
  it('finds the one blank, and none when there are several or none', () => {
    expect(splitBlank('雨が降り＿＿です。')).toEqual({ before: '雨が降り', after: 'です。' });
    expect(splitBlank('＿＿は＿＿です。')).toBeUndefined();
    expect(splitBlank('雨です。')).toBeUndefined();
  });
});

describe('a handout question', () => {
  it('says where it is printed and keeps the tutor’s answer hidden until answered', async () => {
    await show(CHOOSE);
    expect(screen.getByText('From your handout · page 1, question 4')).toBeTruthy();
    expect(screen.queryByText(CHOOSE.explanation)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'See the page' }));
    expect(await screen.findByRole('dialog', { name: 'Page 1 of your handout' })).toBeTruthy();
  });

  it('grades a choice against the tutor’s answer, then shows it as the tutor’s', async () => {
    const { repos, onDone } = await show(CHOOSE);
    expect(document.querySelector('[data-blank]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'そう' }));
    expect(await screen.findByText('Right')).toBeTruthy();
    expect(document.querySelector('[data-fill]')?.textContent).toBe('そう');
    expect(document.querySelector('[data-blank]')).toBeNull();
    expect(screen.getByLabelText('Answer from the tutor')).toBeTruthy();
    expect(screen.getByText(CHOOSE.explanation)).toBeTruthy();
    expect(screen.getByText('Your handout prints none.')).toBeTruthy();
    await waitFor(async () =>
      expect((await repos.scans.get('scan1'))?.practised['question:0-4']).toBeDefined(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'handout', right: true });
  });

  it('lets the learner mark a free answer once the tutor’s shows', async () => {
    const { repos, onDone } = await show(FREE);
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: '週末は雨です。' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show the tutor’s answer' }));
    expect(await screen.findByText(/says what you expect/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'I had it right' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'handout', right: true });
    expect((await repos.scans.get('scan1'))?.practised['question:0-8']).toBeDefined();
  });
});
