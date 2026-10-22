/** What the follow-up chips under an explanation do (A3). */
import type {
  AiClient,
  FollowUpKind,
  FollowUpResult,
  Result,
  SentenceContext,
} from '../../ai/types.ts';
import { itemId } from '../../domain/ids.ts';
import { knownWordSample, saveAiSentences } from '../../domain/services/index.ts';
import type { Note, Sentence, Word } from '../../domain/types.ts';
import type { Services } from '../../ui/services.tsx';

/**
 * What a chip's action needs: storage and language, and the client of the press that asked
 * (A18). Chips that stay on the device (keep, pack examples) have no client.
 */
export interface ChipDeps {
  repos: Services['repos'];
  lang: Services['lang'];
  client?: AiClient | undefined;
}

const NO_PRESS: Result<never> = {
  ok: false,
  error: { kind: 'provider', message: 'no AI press' },
};

/** What a chip acts on: the sentence, the word, and the explanation it sits under. */
export interface ChipContext {
  sentence: SentenceContext;
  sentenceId: string;
  surface: string;
  wordId?: string | undefined;
  /** The explanation text the chip was under. */
  previous: string;
}

export type ChipOutcome =
  | { type: 'followUp'; kind: FollowUpKind; result: FollowUpResult }
  | { type: 'sentences'; added: Sentence[] }
  | { type: 'examples'; sentences: Sentence[] }
  | { type: 'kept' };

/** Pack sentences shown for "One more with 待" before any AI (A15). */
const PACK_EXAMPLES = 3;

/** Sentences asked for with "One more with 待"; the ones that pass the checks are kept. */
const EXAMPLE_COUNT = 3;

function ok<T>(value: T): Result<T> {
  return { ok: true, value, cached: false };
}

async function followUp(
  deps: ChipDeps,
  context: ChipContext,
  kind: Exclude<FollowUpKind, 'keep'>,
): Promise<Result<ChipOutcome>> {
  const { sentence, surface, previous } = context;
  if (!deps.client) return NO_PRESS;
  const result = await deps.client.followUp({ kind, sentence, surface, previous });
  return result.ok ? ok({ type: 'followUp', kind, result: result.value }) : result;
}

function generationTarget(word: Word, surface: string) {
  return {
    surface: word.forms[0] ?? surface,
    reading: word.readings[0] ?? '',
    meaning: word.glosses[0] ?? '',
  };
}

/**
 * "One more with 待" (A15): other sentences with the word from the packs first, with no AI. The
 * tutor writes new ones only after "Write a new one". Without a dictionary word, the tutor's
 * follow-up example.
 */
async function oneMore(deps: ChipDeps, context: ChipContext): Promise<Result<ChipOutcome>> {
  if (!context.wordId) return followUp(deps, context, 'example');
  const found = await deps.repos.sentences.containingWord(context.wordId);
  const others = found.filter(
    (s) => s.id !== context.sentenceId && s.text !== context.sentence.text,
  );
  return ok({ type: 'examples', sentences: others.slice(0, PACK_EXAMPLES) });
}

/** R6: new sentences around the word, kept only when verified and i+1. */
export async function writeNewSentences(
  deps: ChipDeps,
  context: ChipContext,
): Promise<Result<ChipOutcome>> {
  const { repos, client, lang } = deps;
  const word = context.wordId ? await repos.dictionary.word(context.wordId) : undefined;
  if (!word) return followUp(deps, context, 'example');
  if (!client) return NO_PRESS;
  const result = await client.generateSentences({
    targets: [generationTarget(word, context.surface)],
    knownWords: await knownWordSample(repos),
    count: EXAMPLE_COUNT,
  });
  if (!result.ok) return result;
  const save = { repos, tokenize: (text: string) => lang.tokenize(text) };
  const { sentences, readings } = result.value;
  const added = await saveAiSentences(save, sentences, readings, [word.id]);
  return ok({ type: 'sentences', added });
}

/** "Keep in my notes": the explanation, with the sentence and word it was about. */
async function keep(deps: ChipDeps, context: ChipContext): Promise<Result<ChipOutcome>> {
  const note: Note = {
    id: `note:${crypto.randomUUID()}`,
    createdAt: Date.now(),
    title: context.surface,
    body: context.previous,
    sentenceId: context.sentenceId,
  };
  if (context.wordId) note.itemId = itemId('word', context.wordId);
  await deps.repos.notes.put(note);
  return ok({ type: 'kept' });
}

/** Runs the chip's action. */
export function runChip(
  deps: ChipDeps,
  context: ChipContext,
  kind: FollowUpKind,
): Promise<Result<ChipOutcome>> {
  if (kind === 'keep') return keep(deps, context);
  if (kind === 'example') return oneMore(deps, context);
  return followUp(deps, context, kind);
}

/** Keep stays on the device; one more example shows pack sentences first when there is a word. */
export function chipSendsRequest(kind: FollowUpKind, context: ChipContext | undefined): boolean {
  if (kind === 'keep') return false;
  return !(kind === 'example' && context?.wordId);
}
