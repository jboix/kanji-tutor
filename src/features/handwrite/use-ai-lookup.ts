import { useCallback, useEffect, useState } from 'react';
import type { AiClient, AiError, CheckedReading, KanjiCandidates, Result } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import { useServices } from '../../ui/services.tsx';
import type { Stroke } from './recognizer/geometry.ts';
import { strokesToPng } from './stroke-image.ts';

export interface AiCandidate {
  char: string;
  /** Why it fits (describe mode only). */
  reason?: string;
  /** Readings the reason shows that the dictionary could not confirm (A8). */
  unchecked?: CheckedReading[];
}

export type AiLookup =
  | { state: 'idle' }
  | { state: 'asking' }
  | { state: 'done'; candidates: AiCandidate[] }
  | { state: 'failed'; error: AiError };

/** Keeps AI candidates that are kanji in the installed dictionary; the rest are dropped (I5). */
export async function inDictionary(repos: Repos, list: readonly AiCandidate[]) {
  const unique = list.filter((c, i) => list.findIndex((d) => d.char === c.char) === i);
  const found = await repos.dictionary.kanjiMany(unique.map((c) => c.char));
  return unique.filter((_, i) => found[i] !== undefined);
}

/** Runs one AI lookup at a time and verifies its candidates against the dictionary. */
function useLookup<T>(toCandidates: (value: T) => AiCandidate[]) {
  const { repos } = useServices();
  const [lookup, setLookup] = useState<AiLookup>({ state: 'idle' });
  const run = useCallback(
    async (call: () => Promise<Result<T>>) => {
      setLookup({ state: 'asking' });
      const result = await call();
      if (!result.ok) return setLookup({ state: 'failed', error: result.error });
      const candidates = await inDictionary(repos, toCandidates(result.value));
      setLookup({ state: 'done', candidates });
    },
    [repos, toCandidates],
  );
  const reset = useCallback(() => setLookup({ state: 'idle' }), []);
  return { lookup, run, reset };
}

const fromHandwriting = (value: { candidates: string[] }) =>
  value.candidates.map((char) => ({ char }));

const NO_IMAGE: AiError = { kind: 'invalid-response', message: 'the drawing could not be read' };

/** The Gemini fallback for a drawing (I4): the strokes as a PNG to `recognizeHandwriting`. */
export function useAskAi(strokes: readonly Stroke[]) {
  const { lookup, run, reset } = useLookup(fromHandwriting);
  useEffect(() => {
    if (strokes) reset();
  }, [strokes, reset]);
  const ask = useCallback(
    (client: AiClient) => {
      const image = strokesToPng(strokes);
      void run(async () =>
        image ? client.recognizeHandwriting({ image }) : { ok: false, error: NO_IMAGE },
      );
    },
    [run, strokes],
  );
  return { lookup, ask };
}

/** Each candidate with the failed reading claims its reason shows. */
const fromDescription = (value: KanjiCandidates): AiCandidate[] =>
  value.candidates.map((candidate) => ({
    ...candidate,
    unchecked: value.readings.filter(
      (r) => !r.verified && [r.surface, r.reading].some((part) => candidate.reason.includes(part)),
    ),
  }));

/** Describe mode (I5): `describeKanji`, keeping candidates the dictionary knows. */
export function useDescribe() {
  const { lookup, run } = useLookup(fromDescription);
  const describe = useCallback(
    (client: AiClient, description: string) =>
      void run(() => client.describeKanji({ description })),
    [run],
  );
  return { lookup, describe };
}
