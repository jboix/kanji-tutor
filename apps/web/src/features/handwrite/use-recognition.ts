import { useEffect, useMemo, useState } from 'react';
import { useServices } from '../../ui/services.tsx';
import type { Recognizer, Stroke } from './recognizer/index.ts';

export type RecognizerStatus = 'loading' | 'ready' | 'failed';

/** Shown candidates (handwrite.html shows five). */
export const SHOWN = 5;
/** Ranked from the recognizer before dropping kanji the installed pack lacks. */
const RANKED = 12;
/**
 * A best score above this means the drawing matched nothing well. Clean drawings score about
 * 5–45 and random scribbles 60–150 (mean distance per stroke in a 256-unit box).
 */
export const UNSURE_SCORE = 55;

let loading: Promise<Recognizer> | undefined;

/** The recognizer and its 345 KB of patterns load on first use, never in the app shell (N4). */
function loadOnce(): Promise<Recognizer> {
  loading ??= import('./recognizer/index.ts').then((module) => module.loadRecognizer());
  loading.catch(() => {
    loading = undefined;
  });
  return loading;
}

function useRecognizer() {
  const [state, setState] = useState<{ status: RecognizerStatus; recognizer?: Recognizer }>({
    status: 'loading',
  });
  useEffect(() => {
    let live = true;
    loadOnce().then(
      (recognizer) => live && setState({ status: 'ready', recognizer }),
      () => live && setState({ status: 'failed' }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

export interface Recognition {
  status: RecognizerStatus;
  /** Kanji in the installed dictionary, best first. */
  candidates: string[];
  /** The drawing matched nothing well, so asking AI is offered. */
  unsure: boolean;
}

/** Offline candidates for the finished strokes, re-ranked after every stroke (I4). */
export function useRecognition(strokes: readonly Stroke[]): Recognition {
  const { repos } = useServices();
  const { status, recognizer } = useRecognizer();
  const ranked = useMemo(() => recognizer?.recognize(strokes, RANKED) ?? [], [recognizer, strokes]);
  const [known, setKnown] = useState<{ for: typeof ranked; chars: string[] }>();
  useEffect(() => {
    let live = true;
    void repos.dictionary.kanjiMany(ranked.map((c) => c.char)).then((found) => {
      const chars = found.flatMap((k) => (k ? [k.char] : [])).slice(0, SHOWN);
      if (live) setKnown({ for: ranked, chars });
    });
    return () => {
      live = false;
    };
  }, [repos, ranked]);
  // Keeps the previous row while the dictionary answers, so it does not flicker per stroke.
  const candidates = strokes.length === 0 ? [] : (known?.chars ?? []);
  const best = ranked[0]?.score ?? Number.POSITIVE_INFINITY;
  const settled = known?.for === ranked;
  const unsure = strokes.length > 0 && settled && (candidates.length === 0 || best > UNSURE_SCORE);
  return { status, candidates, unsure: unsure || (status === 'failed' && strokes.length > 0) };
}
