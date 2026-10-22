import { Ja } from '../../ui/ja.tsx';

/** Runs of Japanese script with the punctuation that belongs to them. */
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〜、。「」]+/gu;

/** English prose with every Japanese run in `<Ja>`, so it is set in Klee One (N7). */
export function JaRuns({ text }: { text: string }) {
  const parts: { text: string; ja: boolean; start: number }[] = [];
  let at = 0;
  for (const match of text.matchAll(JAPANESE)) {
    if (match.index > at) parts.push({ text: text.slice(at, match.index), ja: false, start: at });
    parts.push({ text: match[0], ja: true, start: match.index });
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), ja: false, start: at });
  return parts.map((part) =>
    part.ja ? <Ja key={part.start}>{part.text}</Ja> : <span key={part.start}>{part.text}</span>,
  );
}
