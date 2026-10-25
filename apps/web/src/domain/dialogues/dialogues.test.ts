import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { GRAMMAR_DIALOGUES } from './catalogue.ts';
import { blankedText, dialogueText, focusRange, loadDialogues, spokenLines } from './index.ts';
import type { Dialogue, DialogueText } from './types.ts';

const ALL: Dialogue[] = GRAMMAR_DIALOGUES.flatMap((set) => [...set.dialogues]);
const CATALOGUE = new Map(GRAMMAR_CATALOGUE.map((entry) => [entry.id, entry]));
const LANGUAGES = ['en', 'fr', 'es'] as const;

const JA_RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+/gu;
const japaneseOf = (text: string) => [...new Set(text.match(JA_RUN) ?? [])].sort().join('|');

/** Every problem of one text: a language missing or empty, or Japanese that differs from English. */
function textProblems(where: string, text: DialogueText): string[] {
  return LANGUAGES.flatMap((language) => {
    const value = text[language];
    if (value.trim() === '') return [`${where}.${language}: empty`];
    return japaneseOf(value) === japaneseOf(text.en)
      ? []
      : [`${where}.${language}: Japanese differs from the English`];
  });
}

describe('the grammar dialogues', () => {
  it('cover 12 to 15 catalogue points, each once, with two or three dialogues', () => {
    const ids = GRAMMAR_DIALOGUES.map((set) => set.grammarId);
    expect(ids.length).toBeGreaterThanOrEqual(12);
    expect(ids.length).toBeLessThanOrEqual(15);
    expect(new Set(ids).size).toBe(ids.length);
    for (const set of GRAMMAR_DIALOGUES) {
      expect(CATALOGUE.has(set.grammarId), set.grammarId).toBe(true);
      expect(set.dialogues.length, set.grammarId).toBeGreaterThanOrEqual(2);
      expect(set.dialogues.length, set.grammarId).toBeLessThanOrEqual(3);
    }
  });

  it('compare each point with another catalogue point', () => {
    for (const { grammarId, compare } of GRAMMAR_DIALOGUES) {
      if (compare === undefined) continue;
      expect(CATALOGUE.has(compare), `${grammarId} → ${compare}`).toBe(true);
      expect(compare).not.toBe(grammarId);
    }
  });

  it('have unique slug ids', () => {
    const ids = ALL.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('mix plain and polite speech', () => {
    expect(new Set(ALL.map((d) => d.register))).toEqual(new Set(['plain', 'polite']));
  });

  it('have two speakers who both speak, in two to four lines', () => {
    for (const dialogue of ALL) {
      const [a, b] = dialogue.speakers;
      expect(a, dialogue.id).not.toBe(b);
      expect(dialogue.lines.length, dialogue.id).toBeGreaterThanOrEqual(2);
      expect(dialogue.lines.length, dialogue.id).toBeLessThanOrEqual(4);
      expect(new Set(dialogue.lines.map((line) => line.by)), dialogue.id).toEqual(new Set([0, 1]));
    }
  });

  it('carry no hand-written readings: the lines are plain Japanese', () => {
    for (const dialogue of ALL) {
      for (const line of dialogue.lines) {
        expect(line.ja, dialogue.id).toMatch(JA_RUN);
        expect(line.ja, dialogue.id).not.toMatch(/[()（）[\]｜|《》{}]/u);
      }
    }
  });

  it('mark a focus that really occurs in its line, on the blanked line at least', () => {
    for (const dialogue of ALL) {
      for (const [i, line] of dialogue.lines.entries()) {
        if (line.focus === undefined) continue;
        expect(focusRange(line), `${dialogue.id} line ${i}`).toBeDefined();
      }
      const blanked = dialogue.lines[dialogue.blank.line];
      expect(blanked?.focus, dialogue.id).toBeDefined();
    }
  });

  it('give three distractors that differ from the answer and from each other', () => {
    for (const dialogue of ALL) {
      const answer = dialogue.lines[dialogue.blank.line]?.focus;
      const { distractors } = dialogue.blank;
      expect(distractors, dialogue.id).not.toContain(answer);
      expect(new Set(distractors).size, dialogue.id).toBe(3);
      for (const d of distractors) expect(d.trim(), dialogue.id).not.toBe('');
    }
  });

  it('translate every line and explanation into English, French and Spanish', () => {
    const problems = ALL.flatMap((dialogue) => [
      ...dialogue.lines.flatMap((line, i) => textProblems(`${dialogue.id}.lines[${i}]`, line.tr)),
      ...textProblems(`${dialogue.id}.why`, dialogue.blank.why),
    ]);
    expect(problems).toEqual([]);
  });

  it('load on demand, by grammar id', async () => {
    const all = await loadDialogues();
    expect(all.size).toBe(GRAMMAR_DIALOGUES.length);
    expect(all.get('koto-ni-naru')?.compare).toBe('koto-ni-suru');
    expect(await loadDialogues()).toBe(all);
  });
});

describe('dialogue lines', () => {
  const line = { ja: '大阪で働くことになったんです。', focus: 'ことになった' };
  const tr = { en: 'English', fr: 'Français', es: 'Español' };

  it('find the focus, and blank it', () => {
    expect(focusRange(line)).toEqual({ from: 5, to: 11 });
    expect(focusRange({ ja: line.ja, focus: 'ことにした' })).toBeUndefined();
    expect(focusRange({ ja: line.ja })).toBeUndefined();
    expect(blankedText({ ...line, by: 0, tr })).toBe('大阪で働く＿＿＿んです。');
    expect(blankedText({ ja: line.ja, by: 0, tr })).toBe(line.ja);
  });

  it('pick the learner’s language, English and marked for one without texts', () => {
    expect(dialogueText(tr, 'fr-CA')).toEqual({ value: 'Français', english: false });
    expect(dialogueText(tr, 'es')).toEqual({ value: 'Español', english: false });
    expect(dialogueText(tr, 'en-GB')).toEqual({ value: 'English', english: false });
    expect(dialogueText(tr, 'de')).toEqual({ value: 'English', english: true });
  });

  it('speak the lines, the blanked form left out before the answer', () => {
    const dialogue = ALL.find((d) => d.id === 'koto-ni-naru-osaka') as Dialogue;
    expect(spokenLines(dialogue)[1]).toContain('ことになった');
    expect(spokenLines(dialogue, true)[1]).not.toContain('ことになった');
    expect(spokenLines(dialogue, true)[0]).toBe(dialogue.lines[0]?.ja);
  });
});
