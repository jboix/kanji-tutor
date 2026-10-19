import type { Token } from '../domain/types.ts';

/** A run of sentence text: either a token (by index) or untokenised text between tokens. */
export type SentencePart =
  | { kind: 'token'; index: number }
  | { kind: 'text'; text: string; start: number };

/** Splits the sentence into token and gap parts in text order, using each token's `start`. */
export function sentenceParts(text: string, tokens: readonly Token[]): SentencePart[] {
  const order = tokens.map((token, index) => ({ token, index }));
  order.sort((a, b) => a.token.start - b.token.start);
  const parts: SentencePart[] = [];
  let cursor = 0;
  for (const { token, index } of order) {
    if (token.start > cursor) {
      parts.push({ kind: 'text', text: text.slice(cursor, token.start), start: cursor });
    }
    parts.push({ kind: 'token', index });
    cursor = Math.max(cursor, token.start + token.surface.length);
  }
  if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor), start: cursor });
  return parts;
}

const CLOSING = /^[、。，．・」』）！？!?,.)\]]/u;

function isClosing(part: SentencePart, tokens: readonly Token[]): boolean {
  const text = part.kind === 'text' ? part.text : (tokens[part.index]?.surface ?? '');
  return CLOSING.test(text);
}

/** Consecutive parts drawn together: a target run shares one underline (or highlight). */
export interface PartGroup {
  target: boolean;
  parts: SentencePart[];
  /** Closing punctuation kept on the same line as the group. */
  trailing: SentencePart[];
}

function isTarget(part: SentencePart, target: readonly number[]): boolean {
  return part.kind === 'token' && target.includes(part.index);
}

function joins(last: PartGroup | undefined, part: SentencePart, target: readonly number[]) {
  return last?.target === true && last.trailing.length === 0 && isTarget(part, target);
}

/**
 * Groups parts so that adjacent target tokens form one run, and closing punctuation (、。) stays
 * on the line of the group before it: tappable tokens are inline-blocks, which would otherwise
 * let a line start with 、.
 */
export function groupParts(
  parts: readonly SentencePart[],
  tokens: readonly Token[],
  target: readonly number[] = [],
): PartGroup[] {
  const groups: PartGroup[] = [];
  for (const part of parts) {
    const last = groups.at(-1);
    if (joins(last, part, target)) last?.parts.push(part);
    else if (last && last.parts.at(-1)?.kind === 'token' && isClosing(part, tokens)) {
      last.trailing.push(part);
    } else groups.push({ target: isTarget(part, target), parts: [part], trailing: [] });
  }
  return groups;
}
