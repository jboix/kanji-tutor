import { describe, expect, it } from 'vitest';
import { functionWordProblems, grammarProblems, unitTextProblems } from '../test/content-check.ts';
import {
  CONTENT_LANGUAGES,
  contentLookup,
  ENGLISH_CONTENT,
  loadContentLanguage,
  localFunctionWord,
  localGrammar,
  localPoint,
  localUnit,
} from './content-language.ts';
import { ES_GRAMMAR, ES_PARTICLES } from './grammar/es/index.ts';
import { FR_GRAMMAR, FR_PARTICLES } from './grammar/fr/index.ts';
import { FUNCTION_WORDS, GRAMMAR_CATALOGUE } from './grammar/index.ts';
import { ES_UNITS } from './themes/es/index.ts';
import { FR_UNITS } from './themes/fr/index.ts';
import { UNITS } from './themes/index.ts';

const TEXTS = {
  fr: { grammar: FR_GRAMMAR, functionWords: FR_PARTICLES, units: FR_UNITS },
  es: { grammar: ES_GRAMMAR, functionWords: ES_PARTICLES, units: ES_UNITS },
};

const byId = <T extends { id: string }>(list: readonly T[], id: string): T => {
  const found = list.find((e) => e.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

describe.each(CONTENT_LANGUAGES)('%s content translations (N9)', (language) => {
  const texts = TEXTS[language];

  it('translate every grammar point, with no extra id', () => {
    expect(grammarProblems(GRAMMAR_CATALOGUE, texts.grammar)).toEqual([]);
    expect(Object.keys(texts.grammar)).toHaveLength(GRAMMAR_CATALOGUE.length);
  });

  it('translate every particle and each of its uses', () => {
    expect(functionWordProblems(FUNCTION_WORDS, texts.functionWords)).toEqual([]);
    expect(Object.keys(texts.functionWords)).toHaveLength(FUNCTION_WORDS.length);
  });

  it('translate every unit: theme, summary, each line and each question explanation', () => {
    expect(unitTextProblems(UNITS, texts.units)).toEqual([]);
    expect(Object.keys(texts.units)).toHaveLength(UNITS.length);
  });

  it('load lazily into lookup maps holding the same texts', async () => {
    const lookup = await loadContentLanguage(`${language}-XX`);
    expect(lookup.language).toBe(language);
    expect(lookup.grammar.size).toBe(GRAMMAR_CATALOGUE.length);
    expect(lookup.functionWords.size).toBe(FUNCTION_WORDS.length);
    expect(lookup.units.get('self-introduction')).toBe(texts.units['self-introduction']);
    expect(await loadContentLanguage(language)).toBe(lookup);
  });
});

describe('the checker', () => {
  const desu = byId(GRAMMAR_CATALOGUE, 'desu');
  const masu = byId(GRAMMAR_CATALOGUE, 'masu');

  it('reports a missing, an empty, an untranslated and an extra entry', () => {
    const problems = grammarProblems([desu, masu], {
      desu: { meaning: '', explanation: desu.explanation },
      ghost: { meaning: 'x', explanation: 'y' },
    });
    expect(problems).toEqual([
      'grammar desu.meaning: empty',
      'grammar desu.explanation: same as English',
      'grammar masu: missing',
      'grammar ghost: not an English id',
    ]);
  });

  it('wants a formation only when the English has English words, keeping the Japanese', () => {
    expect(
      grammarProblems([masu], {
        masu: { meaning: 'poli', explanation: 'ます rend poli.', formation: 'V-radical + まし' },
      }),
    ).toEqual(['grammar masu.formation: Japanese differs (ます → まし)']);
    expect(
      grammarProblems([desu], {
        desu: { meaning: 'être', explanation: 'です relie.', formation: 'N + です' },
      }),
    ).toEqual(['grammar desu.formation: not needed, the English has no English words']);
  });

  it('counts uses, lines and questions', () => {
    const ga = byId(FUNCTION_WORDS, 'particle-ga');
    const unit = byId(UNITS, 'self-introduction');
    const word = functionWordProblems([ga], {
      'particle-ga': { meaning: 'sujet', explanation: 'が marque le sujet.', uses: [] },
    });
    expect(word[0]).toBe('particle particle-ga.uses: count differs');
    const lines = unitTextProblems([unit], {
      'self-introduction': {
        theme: 'Se présenter',
        summary: 'Court.',
        sentences: [],
        questions: [],
      },
    });
    expect(lines).toContain('unit self-introduction.sentences: count differs');
    expect(lines).toContain('unit self-introduction.questions: count differs');
  });
});

describe('loadContentLanguage', () => {
  it('gives empty maps for English and for a language with no content', async () => {
    expect(await loadContentLanguage('en')).toMatchObject({ language: 'en' });
    const german = await loadContentLanguage('de');
    expect(german.language).toBe('de');
    expect(german.grammar.size).toBe(0);
  });
});

describe('localizing', () => {
  const fr = contentLookup('fr', TEXTS.fr);
  const partial = contentLookup('fr', { grammar: {}, functionWords: {}, units: {} });
  const teMoIi = byId(GRAMMAR_CATALOGUE, 'te-mo-ii');
  const masu = byId(GRAMMAR_CATALOGUE, 'masu');

  it('swaps the meaning, explanation and formation of a point', () => {
    const { value, english } = localGrammar(fr, masu);
    expect(english).toBe(false);
    expect(value.meaning).toBe(FR_GRAMMAR.masu?.meaning);
    expect(value.formation).toBe(FR_GRAMMAR.masu?.formation);
    expect(value.cloze).toBe(masu.cloze);
    expect(localGrammar(fr, teMoIi).value.formation).toBe(teMoIi.formation);
  });

  it('falls back to English, marked, when the language lacks the id', () => {
    expect(localGrammar(partial, masu)).toEqual({ value: masu, english: true });
    expect(localGrammar(ENGLISH_CONTENT, masu)).toEqual({ value: masu, english: false });
  });

  it('keeps the Japanese examples of a particle and translates its uses', () => {
    const ga = byId(FUNCTION_WORDS, 'particle-ga');
    const { value } = localFunctionWord(fr, ga);
    expect(value.uses.map((u) => u.example)).toEqual(ga.uses.map((u) => u.example));
    expect(value.uses[0]?.translation).toBe(FR_PARTICLES['particle-ga']?.uses[0]?.translation);
    expect(localPoint(fr, ga).value.meaning).toBe(value.meaning);
  });

  it('translates a unit’s lines and explanations, keeping prompts and options', () => {
    const unit = byId(UNITS, 'self-introduction');
    const { value } = localUnit(fr, unit);
    expect(value.theme).toBe(FR_UNITS['self-introduction']?.theme);
    expect(value.passage.sentences.map((s) => s.ja)).toEqual(
      unit.passage.sentences.map((s) => s.ja),
    );
    expect(value.passage.sentences[1]?.en).toBe(FR_UNITS['self-introduction']?.sentences[1]);
    expect(value.questions[0]?.options).toBe(unit.questions[0]?.options);
    expect(value.questions[0]?.explanation).toBe(FR_UNITS['self-introduction']?.questions[0]);
    expect(localUnit(partial, unit)).toEqual({ value: unit, english: true });
  });
});
