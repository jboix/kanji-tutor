import { describe, expect, it } from 'vitest';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { knownText, markingText } from './known-text.ts';
import { joinLesson, resumeStep, splitLesson, startOf, stepAfter, stepBefore } from './steps.ts';
import { stageText } from './use-pack-install.ts';
import { initialDraft, knownFor } from './use-wizard.ts';

describe('wizard steps', () => {
  it('resumes at a saved step, but not past a dictionary that is not loaded', () => {
    expect(resumeStep(undefined, false)).toBe('welcome');
    expect(resumeStep('', true)).toBe('welcome');
    expect(resumeStep('nonsense', true)).toBe('welcome');
    expect(resumeStep('feel', true)).toBe('feel');
    expect(resumeStep('feel', false)).toBe('dictionary');
    expect(resumeStep('language', false)).toBe('language');
  });

  it('goes back to the summary after a change, via the lists for a new start', () => {
    expect(stepAfter('welcome', false)).toBe('language');
    expect(stepAfter('feel', false)).toBe('summary');
    expect(stepAfter('summary', false)).toBe('summary');
    expect(stepAfter('class', true)).toBe('summary');
    expect(stepAfter('start', true)).toBe('known');
    expect(stepBefore('language')).toBe('welcome');
    expect(stepBefore('welcome')).toBe('welcome');
  });

  it('splits and joins the lesson tag at the last space', () => {
    expect(splitLesson('Tobira 第4課')).toEqual({ textbook: 'Tobira', lesson: '第4課' });
    expect(splitLesson('Minna no Nihongo 第12課')).toEqual({
      textbook: 'Minna no Nihongo',
      lesson: '第12課',
    });
    expect(splitLesson('第4課')).toEqual({ textbook: '', lesson: '第4課' });
    expect(splitLesson(undefined)).toEqual({ textbook: '', lesson: '' });
    expect(joinLesson(' Tobira ', '第4課')).toBe('Tobira 第4課');
    expect(joinLesson('', '')).toBe('');
  });

  it('ticks the lists a start stands for (D38)', () => {
    expect(startOf(undefined)).toBe('zero');
    expect(startOf(3)).toBe('n3');
    expect(knownFor('zero')).toMatchObject({ n5: false, n4: false, minna: false });
    expect(knownFor('n4')).toMatchObject({ n5: true, n4: false });
    expect(knownFor('n3')).toMatchObject({ n5: true, n4: true });
  });

  it('starts the draft from the saved settings', () => {
    const settings = {
      modelId: 'm',
      furigana: 'new' as const,
      theme: 'system' as const,
      onboarded: false,
      uiLanguage: 'es',
      learnerLevel: 4 as const,
      currentLesson: 'Tobira 第4課',
    };
    expect(initialDraft(settings)).toMatchObject({
      language: 'es',
      start: 'n4',
      textbook: 'Tobira',
      lesson: '第4課',
      known: { n5: true },
    });
  });
});

const t = createTranslator('en', ENGLISH, ENGLISH);

describe('wizard text', () => {
  it('formats the dictionary stage with grouped numbers', () => {
    expect(stageText(t, { stage: 'words', loaded: 12_000, total: 48_000 })).toBe(
      'Words 12,000 of 48,000',
    );
    expect(stageText(t, { stage: 'sentences', loaded: 1, total: 2 })).toBe('Sentences 1 of 2');
  });

  it('counts what was marked', () => {
    expect(knownText(t, undefined)).toBe('Nothing marked yet');
    expect(knownText(t, { marked: { words: 1, already: 0, missing: 0 }, pending: [] })).toBe(
      '1 word marked as known',
    );
    expect(knownText(t, { marked: { words: 1200, already: 3, missing: 2 }, pending: [] })).toBe(
      '1,200 words marked as known; 3 words were already known; 2 lines not found',
    );
    expect(markingText(t, 0, 0)).toBe('Finding the words…');
    expect(markingText(t, 5, 2400)).toBe('Marking 5 of 2,400');
  });
});
