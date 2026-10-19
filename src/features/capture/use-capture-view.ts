/** A saved capture with its analysis, loaded from storage only, so it opens offline (C5). */
import { useCallback, useEffect, useState } from 'react';
import type { Repos } from '../../domain/repos.ts';
import {
  analyseCapture,
  type CaptureAnalysis,
  type CaptureDraft,
} from '../../domain/services/index.ts';
import type { Capture } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

export interface CaptureData {
  capture: Capture;
  /** The capture as `addCaptureItems` takes it, with the tokens of its saved sentences. */
  draft: CaptureDraft;
  analysis: CaptureAnalysis;
  /** Grammar point ids the learner already tracks. */
  trackedGrammar: ReadonlySet<string>;
  /** Lesson to tag new items with: the capture's, else the current lesson. */
  lesson: string;
}

export type ViewState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; data: CaptureData };

async function loadCapture(repos: Repos, id: string): Promise<CaptureData | undefined> {
  const capture = await repos.captures.get(id);
  if (!capture) return undefined;
  const sentences = await repos.sentences.getMany(capture.sentenceIds);
  const lines = capture.lines.map((text, i) => ({ text, tokens: sentences[i]?.tokens ?? [] }));
  const analysis = await analyseCapture(repos, lines);
  const grammar = await repos.items.byKind('grammar');
  const { currentLesson } = await repos.settings.get();
  return {
    capture,
    draft: { id: capture.id, createdAt: capture.createdAt, lines },
    analysis,
    trackedGrammar: new Set(grammar.map((item) => item.ref)),
    lesson: capture.lesson ?? currentLesson ?? '',
  };
}

/** Loads the capture `id`; `reload` re-reads it after items were added. */
export function useCaptureView(id: string) {
  const { repos } = useServices();
  const [state, setState] = useState<ViewState>({ status: 'loading' });
  const reload = useCallback(async () => {
    const data = await loadCapture(repos, id);
    setState(data ? { status: 'ready', data } : { status: 'missing' });
  }, [repos, id]);
  useEffect(() => {
    let live = true;
    void loadCapture(repos, id).then((data) => {
      if (live) setState(data ? { status: 'ready', data } : { status: 'missing' });
    });
    return () => {
      live = false;
    };
  }, [repos, id]);
  return { state, reload };
}
