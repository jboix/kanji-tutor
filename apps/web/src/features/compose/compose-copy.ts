/** Copy for Use it (A6). Plain, never praise. */
import type { AiErrorKind } from '../../ai/index.ts';
import type { ComposeTarget } from '../../domain/services/index.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/** "Use it · grammar 3 of 6". */
export function headerLine(t: Translate, target: ComposeTarget | undefined): string {
  if (!target || target.total === 0) return t('compose.title');
  return t('compose.titleCount', { position: target.position, total: target.total });
}

/** Why there is no correction, and whether to link to Settings. The draft is always kept. */
export function errorCopy(
  t: Translate,
  kind: AiErrorKind | 'save',
): { text: string; settings?: boolean } {
  switch (kind) {
    case 'offline':
      return { text: t('compose.errorOffline') };
    case 'no-key':
      return { text: t('compose.errorNoKey'), settings: true };
    case 'rate-limit':
      return { text: t('compose.errorRateLimit') };
    case 'save':
      return { text: t('compose.errorSave') };
    default:
      return { text: t('compose.errorOther') };
  }
}

/** A run of text in one script: Japanese (Klee One) or not. */
export interface TextRun {
  ja: boolean;
  text: string;
  /** UTF-16 offset of the run in the text. */
  start: number;
}

/** Kana, CJK punctuation, kanji (BMP and the supplementary planes) and full-width forms. */
const JAPANESE: readonly [number, number][] = [
  [0x3000, 0x30ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xff00, 0xffef],
  [0x20000, 0x3ffff],
];

function isJapanese(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return JAPANESE.some(([from, to]) => code >= from && code <= to);
}

/**
 * Splits AI prose into Japanese and other runs, so Japanese is set in Klee One (N7). Spaces
 * and ASCII punctuation between Japanese characters stay with the English run.
 */
export function jaRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let at = 0;
  for (const char of text) {
    const ja = isJapanese(char);
    const last = runs.at(-1);
    if (last && last.ja === ja) last.text += char;
    else runs.push({ ja, text: char, start: at });
    at += char.length;
  }
  return runs;
}
