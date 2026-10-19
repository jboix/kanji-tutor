import { Ja } from '../../ui/ja.tsx';

const JAPANESE =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆〇、。「」『』（）・〜～？！／]+/gu;

/** Prose mixing English and Japanese, with every Japanese run in Klee One (N7). */
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
