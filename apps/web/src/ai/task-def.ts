import type { z } from 'zod';
import type { HiddenReading } from './no-spoil.ts';
import type {
  AiContext,
  LearnerProfile,
  Media,
  ModelTier,
  TaskInput,
  TaskName,
  TaskOutput,
  ThinkingLevel,
} from './types.ts';

/** The part of `Lang` the verification pass needs. */
export type Verifier = AiContext['lang'];

/** A versioned prompt (`src/ai/prompts/<task>.ts`). Bump `version` on any wording change. */
export interface Prompt<I> {
  version: number;
  system: string;
  build(input: I, profile: LearnerProfile): string;
}

/**
 * Everything `runTask` needs for one task. `finalize` turns the validated raw response (with
 * `ReadingClaim`s) into the task output (with `CheckedReading`s); its return type is the
 * compile-time check that each schema, once verified, is assignable to `TaskOutput<T>`.
 */
export interface TaskDef<T extends TaskName, S extends z.ZodType> {
  name: T;
  /** `teacher` tasks run on the teacher model with the learner tools (A10, A12). */
  tier: ModelTier;
  /** Defaults to `low` for fast tasks and `medium` for teacher tasks. */
  thinking?: ThinkingLevel;
  prompt: Prompt<TaskInput<T>>;
  schema: S;
  media?: (input: TaskInput<T>) => Media[];
  /**
   * The smallest part of the input that decides the answer, for the cache key (A15). The prompt
   * must use no more of the input than this. The whole input when absent.
   */
  cacheInput?: (input: TaskInput<T>) => unknown;
  /** The reply's prose (not Japanese), for the explanation-language check. */
  prose?: (raw: z.output<S>) => string[];
  /**
   * Teacher explanations that follow the immersion dial (M1, M2): in mixed or Japanese mode the
   * prose is written in Japanese at the learner's level and post-checked against what they know.
   */
  immersive?: boolean;
  /** Targets still to be answered (L3): their readings never become furigana (M2). */
  hidden?: (input: TaskInput<T>) => readonly HiddenReading[];
  finalize: (raw: z.output<S>, input: TaskInput<T>, lang: Verifier) => Promise<TaskOutput<T>>;
}
