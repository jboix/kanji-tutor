import { describe, expect, it } from 'vitest';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { bookName, bookOf, lessonNumberOf } from './class-books.ts';
import { knownText, markingText } from './known-text.ts';
import { joinLesson, resumeStep, splitLesson, startOf, stepAfter, stepBefore } from './steps.ts';
import {
  classKnown,
  classTag,
  initialDraft,
  marksOnClass,
  type WizardDraft,
} from './use-wizard.ts';

const SETTINGS = {
  modelId: 'm',
  furigana: 'new' as const,
  theme: 'system' as const,
  onboarded: false,
};

describe('wizard steps', () => {
  it('resumes at a saved step; a step from before D134 starts at the welcome', () => {
    expect(resumeStep(undefined)).toBe('welcome');
    expect(resumeStep('')).toBe('welcome');
    expect(resumeStep('nonsense')).toBe('welcome');
    expect(resumeStep('dictionary')).toBe('welcome');
    expect(resumeStep('known')).toBe('welcome');
    expect(resumeStep('feel')).toBe('feel');
  });

  it('goes back to the summary after a change', () => {
    expect(stepAfter('welcome', false)).toBe('language');
    expect(stepAfter('start', false)).toBe('class');
    expect(stepAfter('feel', false)).toBe('summary');
    expect(stepAfter('summary', false)).toBe('summary');
    expect(stepAfter('start', true)).toBe('summary');
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

  it('reads the start a level stands for (D38)', () => {
    expect(startOf(undefined)).toBe('zero');
    expect(startOf(4)).toBe('n4');
    expect(startOf(3)).toBe('n3');
  });

  it('starts the draft from the saved settings', () => {
    const settings = {
      ...SETTINGS,
      uiLanguage: 'es',
      learnerLevel: 4 as const,
      currentLesson: 'Tobira 第4課',
    };
    expect(initialDraft(settings)).toMatchObject({
      language: 'es',
      start: 'n4',
      book: 'tobira',
      textbook: '',
      lesson: 4,
      known: { n5: false, minna: true },
    });
    expect(initialDraft({ ...SETTINGS, currentLesson: 'Marugoto 第2課' })).toMatchObject({
      book: 'other',
      textbook: 'Marugoto',
      lesson: 2,
    });
    expect(initialDraft(SETTINGS)).toMatchObject({ book: 'none', lesson: 1 });
  });
});

describe('your class (D134)', () => {
  const draft = (change: Partial<WizardDraft>): WizardDraft => ({
    ...initialDraft(SETTINGS),
    ...change,
  });

  it('reads books and lessons', () => {
    expect(bookOf('')).toBe('none');
    expect(bookOf('Minna no Nihongo')).toBe('minna');
    expect(bookOf('genki')).toBe('genki');
    expect(bookOf('Marugoto')).toBe('other');
    expect(bookName('other', ' Marugoto ')).toBe('Marugoto');
    expect(bookName('none', 'x')).toBe('');
    expect(lessonNumberOf('第12課')).toBe(12);
    expect(lessonNumberOf('')).toBe(1);
    expect(lessonNumberOf('第99課')).toBe(50);
  });

  it('tags the lesson, or nothing for None', () => {
    expect(classTag(draft({ book: 'tobira', lesson: 4 }))).toBe('Tobira 第4課');
    expect(classTag(draft({ book: 'other', textbook: 'Marugoto', lesson: 2 }))).toBe(
      'Marugoto 第2課',
    );
    expect(classTag(draft({ book: 'none', lesson: 7 }))).toBe('');
  });

  it("marks Minna's earlier lessons only for Minna past lesson 1, and never the JLPT lists", () => {
    expect(classKnown(draft({ book: 'minna', lesson: 12 }))).toMatchObject({
      n5: false,
      n4: false,
      minna: true,
      minnaUpTo: '11',
    });
    expect(classKnown(draft({ book: 'minna', lesson: 1 })).minna).toBe(false);
    expect(classKnown(draft({ book: 'genki', lesson: 12 })).minna).toBe(false);
    expect(marksOnClass(draft({ book: 'none' }))).toBe(false);
    expect(marksOnClass(draft({ book: 'minna', lesson: 3 }))).toBe(true);
    const pasted = draft({ known: { ...initialDraft(SETTINGS).known, pasted: '学校' } });
    expect(marksOnClass(pasted)).toBe(true);
  });
});

const t = createTranslator('en', ENGLISH, ENGLISH);

describe('wizard text', () => {
  it('counts what was marked, then the lists the start implies', () => {
    expect(knownText(t, undefined)).toBe('Nothing marked yet');
    expect(knownText(t, { marked: { words: 1, already: 0, missing: 0 }, pending: [] })).toBe(
      '1 word marked as known',
    );
    expect(knownText(t, { marked: { words: 1200, already: 3, missing: 2 }, pending: [] })).toBe(
      '1,200 words marked as known; 3 words were already known; 2 lines not found',
    );
    expect(knownText(t, { marked: { words: 4, already: 0, missing: 0 }, pending: ['n5'] })).toBe(
      '4 words marked as known; JLPT N5: marked as known when you start reading',
    );
    expect(knownText(t, { pending: ['n5', 'n4'] })).toBe(
      'JLPT N5, N4: marked as known when you start reading',
    );
    expect(markingText(t, 0, 0)).toBe('Finding the words…');
    expect(markingText(t, 5, 2400)).toBe('Marking 5 of 2,400');
  });
});
