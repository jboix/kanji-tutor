import { describe, expect, it } from 'vitest';
import { fixturePack } from '../../test/fixture-pack.ts';
import { W } from '../../test/reading-fixtures.ts';
import { classOf } from '../conjugation/forms.ts';
import type { Sentence, Word } from '../types.ts';
import { buildDrill, listeningDrill, piecesOf } from './build.ts';
import { expectedOf, formMatches, gradeExercise } from './exercise-grade.ts';
import { meaningDrill, wordKind } from './meaning.ts';
import { BLANK_PARTICLES, particleDrill } from './particle.ts';
import { type CueWord, conjugationDrill, patternDrill } from './pattern.ts';

const passage = (unit: string) =>
  fixturePack().sentences.filter((s) => s.id.startsWith(`unit:${unit}:`));
const line = (unit: string, i: number): Sentence => {
  const found = passage(unit)[i];
  if (!found) throw new Error(`no line ${i}`);
  return found;
};

const noun = (word: Word, extra: Partial<Word> = {}): Word => ({ ...word, ...extra });
const NOUNS = [
  noun(W.eki),
  noun(W.hon),
  noun(W.gakusei),
  noun(W.sensei, { glosses: ['teacher'] }),
  noun(W.tomodachi, { glosses: ['friend'] }),
];
const VERBS = [W.matsu, W.motsu, noun(W.yomu, { glosses: ['to read'] })];

const cue = (written: string, reading: string, wordId?: string): CueWord => ({
  written,
  reading,
  cls: classOf(written, undefined, reading),
  ...(wordId ? { wordId } : {}),
});

describe('meaningDrill', () => {
  it('offers the word’s meaning among three others of the same kind', () => {
    const drill = meaningDrill({ word: W.eki, others: [...NOUNS, ...VERBS], seed: 'a' });
    expect(drill?.options).toHaveLength(4);
    expect(drill?.options[drill.answer]?.wordId).toBe(W.eki.id);
    const others = drill?.options.filter((o) => o.wordId !== W.eki.id) ?? [];
    expect(others.every((o) => NOUNS.some((n) => n.id === o.wordId))).toBe(true);
    expect(drill?.word).toEqual({ written: '駅', reading: 'えき' });
    expect(drill?.itemId).toBe(`word:${W.eki.id}`);
  });

  it('never offers a meaning the word shares', () => {
    const twin = { ...W.hon, id: 'twin', glosses: ['Station'] };
    const drill = meaningDrill({ word: W.eki, others: [twin, ...NOUNS], seed: 'b' });
    expect(drill?.options.map((o) => o.wordId)).not.toContain('twin');
  });

  it('is stable for a seed and needs three other meanings', () => {
    const input = { word: W.eki, others: NOUNS, seed: 'c' };
    expect(meaningDrill(input)).toEqual(meaningDrill(input));
    expect(meaningDrill({ ...input, others: NOUNS.slice(0, 2) })).toBeUndefined();
  });

  it('tells verbs from other words', () => {
    expect(wordKind(W.matsu)).toBe('verb');
    expect(wordKind(W.eki)).toBe('other');
    expect(wordKind({ pos: ['adj-i'] })).toBe('adjective');
  });
});

describe('particleDrill', () => {
  it('blanks a lone particle of an N5 line, with three particles that cannot also fit', () => {
    const drill = particleDrill({ sentences: [line('i-am-a-student', 6)], level: 5, seed: 'a' });
    expect(drill).toBeDefined();
    if (!drill) return;
    expect(drill.choices).toHaveLength(4);
    expect(drill.choices).toContain(drill.answer);
    expect(new Set(drill.choices).size).toBe(4);
    expect(drill.choices.every((c) => BLANK_PARTICLES.includes(c))).toBe(true);
    expect(drill.sentence.text.slice(drill.at, drill.at + drill.answer.length)).toBe(drill.answer);
    expect(drill.itemId).toMatch(/^grammar:particle-/u);
    if (drill.answer === 'は') expect(drill.choices).not.toContain('が');
  });

  it('keeps は and が apart', () => {
    const drill = particleDrill({ sentences: [line('i-am-a-student', 0)], level: 5, seed: 'x' });
    expect(drill?.answer).toBe('は');
    expect(drill?.choices).not.toContain('が');
    expect(drill?.choices).not.toContain('も');
  });

  it('does not blank a particle of a compound (では)', () => {
    const sentence = line('i-am-a-student', 5);
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const drill = particleDrill({ sentences: [sentence], level: 5, seed });
      expect(drill?.tokenIndex).toBe(2);
    }
  });

  it('gives nothing for a sentence without a particle to blank', () => {
    expect(particleDrill({ sentences: [line('i-am-a-student', 1)], level: 5, seed: 'a' })).toBe(
      undefined,
    );
  });
});

describe('patternDrill', () => {
  const cues = [
    cue('食べる', 'たべる', 'taberu'),
    cue('行く', 'いく', 'iku'),
    cue('学生', 'がくせい'),
  ];

  it('transforms the first cue the point takes, with another as the model line', () => {
    const drill = patternDrill({ grammarId: 'te-mo-ii', cues, seed: 'a' });
    expect(drill?.cue.written).toBe('食べる');
    expect(drill?.answer).toEqual({ written: '食べてもいいですか', reading: 'たべてもいいですか' });
    expect(drill?.example).toEqual({ cue: '行く', answer: '行ってもいいですか' });
    expect(drill?.shape).toBe('〜てもいいですか');
    expect(drill?.itemId).toBe('grammar:te-mo-ii');
  });

  it('takes nouns for noun patterns', () => {
    const drill = patternDrill({ grammarId: 'ja-nai', cues, seed: 'a' });
    expect(drill?.cue.written).toBe('学生');
    expect(drill?.accepted).toContain('がくせいではありません');
    expect(drill?.example).toBeUndefined();
  });

  it('skips cues already asked, and points without a rule', () => {
    const drill = patternDrill({
      grammarId: 'te-mo-ii',
      cues,
      seed: 'a',
      exclude: new Set(['taberu']),
    });
    expect(drill?.cue.written).toBe('行く');
    expect(drill?.answer.written).toBe('行ってもいいですか');
    expect(patternDrill({ grammarId: 'kara-made', cues, seed: 'a' })).toBeUndefined();
  });
});

describe('conjugationDrill', () => {
  const verbs = [
    { ...cue('行く', 'いく'), wordId: 'iku' },
    { ...cue('食べる', 'たべる'), wordId: 'taberu' },
  ];

  it('asks only N5 forms of an N5 learner', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const drill = conjugationDrill({ verbs, level: 5, seed: String(i) });
      if (drill) seen.add(drill.form);
    }
    for (const form of ['potential', 'passive', 'causative', 'volitional', 'ba', 'imperative']) {
      expect(seen.has(form), form).toBe(false);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('builds the answer from the engine, with 行って for 行く', () => {
    for (let i = 0; i < 40; i++) {
      const drill = conjugationDrill({ verbs, level: 4, seed: String(i) });
      if (drill?.form !== 'te') continue;
      expect(drill.answer).toEqual({ written: '行って', reading: 'いって' });
      return;
    }
    throw new Error('no て form in 40 seeds');
  });

  it('skips verbs already asked and words that are not verbs', () => {
    const drill = conjugationDrill({ verbs, level: 5, seed: 'a', exclude: new Set(['iku']) });
    expect(drill?.wordId).toBe('taberu');
    const nounCue = [{ written: '学生', reading: 'がくせい', wordId: 'g' }];
    expect(conjugationDrill({ verbs: nounCue, level: 5, seed: 'a' })).toBeUndefined();
  });
});

describe('buildDrill', () => {
  it('cuts a line into pieces and shows them out of order', () => {
    const sentence = line('i-am-a-student', 6);
    expect(piecesOf(sentence)).toEqual(['リンさんは', '会社の', '人です']);
    const drill = buildDrill({ sentence, seed: 'a' });
    expect(drill?.pieces).toEqual(['リンさんは', '会社の', '人です']);
    expect(drill?.shuffled).toHaveLength(3);
    expect(drill?.shuffled).not.toEqual([0, 1, 2]);
    expect([...(drill?.shuffled ?? [])].sort()).toEqual([0, 1, 2]);
  });

  it('needs three pieces and a translation', () => {
    expect(buildDrill({ sentence: line('i-am-a-student', 0), seed: 'a' })).toBeUndefined();
    const bare = { ...line('i-am-a-student', 6) };
    delete bare.translation;
    expect(buildDrill({ sentence: bare, seed: 'a' })).toBeUndefined();
  });
});

describe('listeningDrill', () => {
  it('offers the line’s meaning among three other lines’', () => {
    const lines = passage('i-am-a-student');
    const sentence = line('i-am-a-student', 4);
    const drill = listeningDrill({ sentence, others: lines, seed: 'a' });
    expect(drill?.options).toHaveLength(4);
    expect(drill?.options[drill.answer]?.translation).toBe('Lin is Chinese.');
    expect(new Set(drill?.options.map((o) => o.translation)).size).toBe(4);
  });

  it('needs three other meanings', () => {
    const sentence = line('i-am-a-student', 4);
    expect(listeningDrill({ sentence, others: [sentence], seed: 'a' })).toBeUndefined();
  });
});

describe('gradeExercise', () => {
  const pattern = patternDrill({ grammarId: 'te-mo-ii', cues: [cue('行く', 'いく')], seed: 'a' });

  it('checks a typed form in kana, romaji or as written', () => {
    if (!pattern) throw new Error('no drill');
    expect(gradeExercise(pattern, 'いってもいいですか').verdict).toBe('correct');
    expect(gradeExercise(pattern, 'ittemoiidesuka').verdict).toBe('correct');
    expect(gradeExercise(pattern, '行ってもいいですか。').verdict).toBe('correct');
    expect(gradeExercise(pattern, 'いきてもいいですか').verdict).toBe('wrong');
    expect(gradeExercise(pattern, 'いてもいいですか')).toMatchObject({
      verdict: 'wrong',
      expected: '行ってもいいですか',
    });
    expect(formMatches(pattern.accepted, '')).toBe(false);
  });

  it('grades choices by index and building by the text', () => {
    const meaning = meaningDrill({ word: W.eki, others: NOUNS, seed: 'a' });
    if (!meaning) throw new Error('no drill');
    expect(gradeExercise(meaning, String(meaning.answer))).toMatchObject({
      verdict: 'correct',
      expected: 'station',
      given: 'station',
    });
    expect(gradeExercise(meaning, String((meaning.answer + 1) % 4)).verdict).toBe('wrong');
    const build = buildDrill({ sentence: line('i-am-a-student', 6), seed: 'a' });
    if (!build) throw new Error('no drill');
    expect(gradeExercise(build, 'リンさんは会社の人です').verdict).toBe('correct');
    expect(gradeExercise(build, '会社のリンさんは人です').verdict).toBe('wrong');
    expect(expectedOf(build)).toBe('リンさんは会社の人です');
  });

  it('grades a particle and a skip', () => {
    const drill = particleDrill({ sentences: [line('i-am-a-student', 0)], level: 5, seed: 'x' });
    if (!drill) throw new Error('no drill');
    expect(gradeExercise(drill, 'は').verdict).toBe('correct');
    expect(gradeExercise(drill, 'を').verdict).toBe('wrong');
    expect(gradeExercise(drill, '', true)).toEqual({
      verdict: 'wrong',
      expected: 'は',
      given: '',
      skipped: true,
    });
  });
});

describe('meaningDrill reversed', () => {
  it('shows the meaning and offers four different words', () => {
    const drill = meaningDrill({ word: W.eki, others: NOUNS, seed: 'r', reverse: true });
    expect(drill?.reverse).toBe(true);
    expect(new Set(drill?.options.map((o) => o.written)).size).toBe(4);
    if (!drill) return;
    expect(gradeExercise(drill, String(drill.answer))).toMatchObject({
      verdict: 'correct',
      expected: '駅',
    });
  });
});

describe('shortGlosses', () => {
  it('keeps the first two senses, without their notes', async () => {
    const { shortGlosses } = await import('./meaning.ts');
    expect(shortGlosses(['student (esp. a university student)'])).toEqual(['student']);
    expect(shortGlosses(['teacher; instructor; master; sensei', 'doctor'])).toEqual([
      'teacher',
      'instructor',
    ]);
    expect(shortGlosses(['x'.repeat(60)])[0]).toHaveLength(40);
  });
});
