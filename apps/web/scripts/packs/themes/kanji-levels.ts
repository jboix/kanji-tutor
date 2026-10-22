/**
 * Kanji levels of the units (T8): no unit writes a kanji above its level, in its title, words,
 * passage or questions, and the N5 path opens with units whose kanji are all among the first 80
 * N5 kanji. Anything else is written in kana, as graded readers do.
 */
import type { Unit } from '../../../src/domain/themes/types.ts';
import type { Kanji } from '../../../src/domain/types.ts';
import type { Violation } from './rules.ts';
import { unitTexts } from './vocabulary.ts';

/**
 * The 80 most frequent of the classic N5 kanji (KANJIDIC2's pre-2010 level 4, 103 kanji), by
 * newspaper rank. 私 is not among them, so the first units write わたし.
 */
export const FIRST_N5_KANJI = new Set(
  '日一国会人年大十二本中長出三時行社見月分後前生五間上東四今新金九入立手学高円子目外言八六下来気小七山話多安女北午百書先名川千道水半男西電口少校語空土木聞食車何南',
);

/** How many N5 units at the start of the path keep to `FIRST_N5_KANJI`. */
export const OPENING_UNITS = 2;

const KANJI = /\p{Script=Han}/gu;
/** 々 repeats the kanji before it, which is checked already. */
const REPEAT = '々';

function texts(unit: Unit): { where: string; text: string }[] {
  return [
    { where: 'titleJa', text: unit.titleJa },
    ...unit.words.map((w, i) => ({ where: `words[${i}]`, text: w.written })),
    ...unitTexts(unit),
  ];
}

function kanjiOf(text: string): string[] {
  return [...new Set(text.match(KANJI) ?? [])].filter((char) => char !== REPEAT);
}

function problem(
  char: string,
  unit: Unit,
  opening: boolean,
  kanji: ReadonlyMap<string, Pick<Kanji, 'jlpt'>>,
) {
  const level = kanji.get(char)?.jlpt;
  if (level === undefined || level < unit.level) {
    return `${char} is ${level ? `N${level}` : 'not levelled'}, above N${unit.level}`;
  }
  if (opening && !FIRST_N5_KANJI.has(char)) return `${char} is not one of the first 80 N5 kanji`;
  return undefined;
}

/** Every kanji above its unit's level, and every opening-unit kanji outside the first 80. */
export function checkKanjiLevels(
  units: readonly Unit[],
  kanji: ReadonlyMap<string, Pick<Kanji, 'jlpt'>>,
): Violation[] {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const opening = new Set(sorted.filter((u) => u.level === 5).slice(0, OPENING_UNITS));
  return sorted.flatMap((unit) =>
    texts(unit).flatMap(({ where, text }) =>
      kanjiOf(text).flatMap((char) => {
        const message = problem(char, unit, opening.has(unit), kanji);
        return message ? [{ unit: unit.id, where, message }] : [];
      }),
    ),
  );
}
