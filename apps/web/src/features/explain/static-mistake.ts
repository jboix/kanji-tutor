/**
 * The app's own explanation of a wrong reading, per error type (A13). It shows under every miss,
 * with no AI; the tutor only adds to it when asked.
 */
import type { KanjiWithParts } from '../../domain/services/index.ts';
import type { ErrorType } from '../../domain/types.ts';
import type { Translate } from '../../ui/i18n/types.ts';

export interface MistakeFacts {
  /** The written word with its endings, e.g. 待って. */
  surface: string;
  expected: string;
  errorType?: ErrorType | undefined;
  /** For `wrong-kanji`: the target's kanji and the lookalike read instead, with their parts. */
  confused?: { kanji: KanjiWithParts; lookalike: KanjiWithParts } | undefined;
}

export interface StaticMistake {
  title: string;
  lines: string[];
}

type Writer = (t: Translate, facts: MistakeFacts) => StaticMistake;

const read = ({ surface, expected }: MistakeFacts) => ({ surface, expected });

const longVowel: Writer = (t, facts) => ({
  title: t('explain.longVowelTitle'),
  lines: [t('explain.longVowel1', read(facts)), t('explain.longVowel2')],
});

const sokuon: Writer = (t, facts) => ({
  title: t('explain.sokuonTitle'),
  lines: [t('explain.sokuon1', read(facts)), t('explain.sokuon2')],
});

const rendaku: Writer = (t, facts) => ({
  title: t('explain.rendakuTitle'),
  lines: [t('explain.rendaku1', read(facts)), t('explain.rendaku2')],
});

const kanaVariant: Writer = (t) => ({
  title: t('explain.kanaTitle'),
  lines: [t('explain.kana1')],
});

function meaningOf(t: Translate, kanji: KanjiWithParts): string {
  const meaning = kanji.meanings[0];
  return meaning ? t('explain.quoted', { text: meaning }) : t('explain.somethingElse');
}

/** "They share 寺; 待 has 彳 (going) where 持 has 扌 (hand)." */
function partsLine(
  t: Translate,
  kanji: KanjiWithParts,
  lookalike: KanjiWithParts,
): string | undefined {
  const named = (k: KanjiWithParts, chars: Set<string>) =>
    k.parts
      .filter((p) => !chars.has(p.char))
      .map((p) => (p.meaning ? `${p.char} (${p.meaning})` : p.char))
      .join(' + ');
  const theirs = new Set(lookalike.parts.map((p) => p.char));
  const shared = kanji.parts.filter((p) => theirs.has(p.char)).map((p) => p.char);
  if (shared.length === 0) return undefined;
  const mine = named(kanji, theirs);
  const other = named(lookalike, new Set(kanji.parts.map((p) => p.char)));
  const both = shared.join(` ${t('explain.and')} `);
  return mine && other
    ? t('explain.shareParts', {
        shared: both,
        kanji: kanji.char,
        mine,
        lookalike: lookalike.char,
        other,
      })
    : t('explain.shareOnly', { shared: both });
}

const wrongKanji: Writer = (t, facts) => {
  const { confused } = facts;
  if (!confused) return other(t, facts);
  const { kanji, lookalike } = confused;
  const chars = { kanji: kanji.char, lookalike: lookalike.char };
  const lines = [
    t('explain.wrongKanji1', { ...read(facts), ...chars }),
    t('explain.wrongKanji2', {
      ...chars,
      meaning: meaningOf(t, kanji),
      otherMeaning: meaningOf(t, lookalike),
    }),
  ];
  const parts = partsLine(t, kanji, lookalike);
  return { title: t('explain.wrongKanjiTitle'), lines: parts ? [...lines, parts] : lines };
};

function other(t: Translate, facts: MistakeFacts): StaticMistake {
  return {
    title: t('explain.otherTitle'),
    lines: [t('explain.other1', read(facts)), t('explain.other2')],
  };
}

const WRITERS: Record<ErrorType, Writer> = {
  'long-vowel': longVowel,
  sokuon,
  rendaku,
  'kana-variant': kanaVariant,
  'wrong-kanji': wrongKanji,
  other,
};

/** The static explanation for these facts, in the learner's language. */
export function staticMistake(t: Translate, facts: MistakeFacts): StaticMistake {
  return WRITERS[facts.errorType ?? 'other'](t, facts);
}
