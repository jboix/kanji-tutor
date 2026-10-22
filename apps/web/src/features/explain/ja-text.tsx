import type { ImmersionNote } from '../../ai/types.ts';
import {
  GlossedRun,
  ImmersionSummary,
  type PlacedWord,
  placedWords,
} from '../../ui/immersion-text.tsx';
import { Ja } from '../../ui/ja.tsx';

/** Runs of Japanese script, with the punctuation that belongs to them. */
const JAPANESE =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆〇、。「」『』（）・〜？！]+/gu;
const SINGLE_KANJI = /^\p{Script=Han}$/u;

export interface TextRun {
  text: string;
  ja: boolean;
  start: number;
}

/** Splits model prose that mixes English and Japanese into runs, so Japanese gets Klee One. */
export function splitJapanese(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let at = 0;
  for (const match of text.matchAll(JAPANESE)) {
    if (match.index > at) runs.push({ text: text.slice(at, match.index), ja: false, start: at });
    runs.push({ text: match[0], ja: true, start: match.index });
    at = match.index + match[0].length;
  }
  if (at < text.length) runs.push({ text: text.slice(at), ja: false, start: at });
  return runs;
}

interface JaTextProps {
  text: string;
  emph?: boolean;
  /** In immersion (M2): words above the learner get furigana and a tap-to-gloss. */
  immersion?: ImmersionNote | undefined;
}

/**
 * AI prose with every Japanese run in `<Ja>` (N7). A lone kanji called out in English is
 * emphasised, as in read.html ("You read it as 持"), unless `emph` is off (chip labels).
 */
export function JaText({ text, emph = true, immersion }: JaTextProps) {
  const placed = immersion ? placedWords(immersion, text) : [];
  return splitJapanese(text).map((run) =>
    run.ja ? (
      <Ja key={run.start} variant={emph && SINGLE_KANJI.test(run.text) ? 'emph' : 'inline'}>
        <JaRun run={run} placed={placed} />
      </Ja>
    ) : (
      <span key={run.start}>{run.text}</span>
    ),
  );
}

function JaRun({ run, placed }: { run: TextRun; placed: readonly PlacedWord[] }) {
  if (placed.length === 0) return run.text;
  return <GlossedRun text={run.text} offset={run.start} placed={placed} />;
}

/** The summary in the learner's language under a mixed or Japanese reply (M2). */
export function ImmersionFooter({ immersion }: { immersion?: ImmersionNote | undefined }) {
  return immersion ? <ImmersionSummary view={immersion} /> : null;
}
