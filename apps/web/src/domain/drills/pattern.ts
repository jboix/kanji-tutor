/**
 * Pattern and conjugation drills (S4), typed and checked by the conjugation engine: a cue word
 * transformed with a grammar point (食べる → 食べてもいいですか), or a verb in a form at the
 * learner's level (行く → 行って). Pure.
 */

import { conjugateVerb, formsAt, isVerbClass, type VerbForm } from '../conjugation/forms.ts';
import { applyPattern, type Cue, patternRule } from '../conjugation/patterns.ts';
import { itemId } from '../ids.ts';
import type { LearnerLevel } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { ConjugationDrill, PatternDrill } from './types.ts';

/** A cue word with its dictionary id, when it has one. */
export type CueWord = Cue & { wordId?: string };

export interface PatternInput {
  grammarId: string;
  /** Words to transform, the most wanted first (the lesson's, then those the learner knows). */
  cues: readonly CueWord[];
  seed: string;
  /** Cues already asked with this point: not asked again. */
  exclude?: ReadonlySet<string>;
}

const cueKey = (cue: CueWord) => cue.wordId ?? cue.written;

/** The pattern drill on the first cue the point takes, with another cue as the model line. */
export function patternDrill(input: PatternInput): PatternDrill | undefined {
  const rule = patternRule(input.grammarId);
  if (!rule) return undefined;
  const usable = input.cues.flatMap((cue) => {
    const answer = applyPattern(rule, cue);
    return answer ? [{ cue, answer }] : [];
  });
  const fresh = usable.filter(({ cue }) => !input.exclude?.has(cueKey(cue)));
  const [asked] = fresh;
  if (!asked) return undefined;
  const model = usable.find(({ cue }) => cueKey(cue) !== cueKey(asked.cue));
  const { cue, answer } = asked;
  const drill: PatternDrill = {
    kind: 'pattern',
    grammarId: rule.grammarId,
    itemId: itemId('grammar', rule.grammarId),
    shape: rule.shape,
    cue: {
      written: cue.written,
      reading: cue.reading,
      ...(cue.wordId ? { wordId: cue.wordId } : {}),
    },
    answer: { written: answer.written, reading: answer.reading },
    accepted: answer.accepted,
  };
  if (model) drill.example = { cue: model.cue.written, answer: model.answer.written };
  return drill;
}

export interface ConjugationInput {
  /** Verbs the learner has met, the most wanted first. */
  verbs: readonly (CueWord & { wordId: string })[];
  level: LearnerLevel;
  seed: string;
  /** Verb ids already asked: not asked again. */
  exclude?: ReadonlySet<string>;
}

/** Forms worth a drill: the dictionary form and the bare stem are not. */
const ASKED = (level: LearnerLevel) =>
  formsAt(level).filter((form): form is VerbForm => form !== 'dict' && form !== 'stem');

function formFor(verb: ConjugationInput['verbs'][number], input: ConjugationInput) {
  const cls = verb.cls;
  if (!cls || !isVerbClass(cls)) return undefined;
  const forms = seededOrder(ASKED(input.level), String, `${input.seed}|${verb.wordId}`);
  for (const form of forms) {
    const written = conjugateVerb(verb.written, cls, form);
    const read = conjugateVerb(verb.reading, cls, form);
    const [model, kana] = [written[0], read[0]];
    if (model && kana) return { form, model, kana, accepted: [...new Set([...read, ...written])] };
  }
  return undefined;
}

/** A verb in a form at the learner's level, on the first verb not asked yet. */
export function conjugationDrill(input: ConjugationInput): ConjugationDrill | undefined {
  for (const verb of input.verbs) {
    if (input.exclude?.has(verb.wordId)) continue;
    const found = formFor(verb, input);
    if (!found) continue;
    return {
      kind: 'conjugation',
      wordId: verb.wordId,
      itemId: itemId('word', verb.wordId),
      cue: { written: verb.written, reading: verb.reading },
      form: found.form,
      answer: { written: found.model, reading: found.kana },
      accepted: found.accepted,
    };
  }
  return undefined;
}
