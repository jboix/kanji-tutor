import { Ja } from './ja.tsx';

const SCRIPT =
  '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー々〆〇、。「」『』（）・〜～？！／';
/** Runs of Japanese script; digits inside a run stay in it (第4課). */
const JAPANESE = new RegExp(`[${SCRIPT}]+(?:[0-9０-９]+[${SCRIPT}]+)*`, 'gu');

/**
 * Text mixing Latin and Japanese, such as a lesson tag ("Tobira 第4課"), with every Japanese run in
 * Klee One and the rest in the interface font (N7).
 */
export function JaRuns({ text }: { text: string }) {
  const parts: { text: string; ja: boolean; at: number }[] = [];
  let at = 0;
  for (const match of text.matchAll(JAPANESE)) {
    if (match.index > at) parts.push({ text: text.slice(at, match.index), ja: false, at });
    parts.push({ text: match[0], ja: true, at: match.index });
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), ja: false, at });
  return parts.map((part) =>
    part.ja ? <Ja key={part.at}>{part.text}</Ja> : <span key={part.at}>{part.text}</span>,
  );
}
