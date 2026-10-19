/**
 * A tiny dictionary and hand-tokenized sentences for reading-loop tests (sessions, answers,
 * kanji pages, import). Readings follow JMdict and KANJIDIC2; ids are illustrative.
 */
import type { Repos } from '../domain/repos.ts';
import type {
  Item,
  Kanji,
  KnowledgeLevel,
  Sentence,
  Settings,
  Token,
  Word,
} from '../domain/types.ts';
import { createFakeDictionary } from '../lang/testing/fake-dictionary.ts';
import { createMemoryRepos } from './memory-repos.ts';

function word(id: string, forms: string[], readings: string[], extra: Partial<Word> = {}): Word {
  return {
    id,
    forms,
    readings,
    glosses: [`gloss of ${forms[0] ?? readings[0]}`],
    common: true,
    ...extra,
  };
}

export const W = {
  eki: word('1', ['駅'], ['えき'], { jlpt: 5, pos: ['n'], glosses: ['station'] }),
  tomodachi: word('2', ['友達'], ['ともだち'], { jlpt: 5, pos: ['n'] }),
  matsu: word('3', ['待つ'], ['まつ'], { jlpt: 5, pos: ['v5t'], glosses: ['to wait'] }),
  motsu: word('4', ['持つ'], ['もつ'], { jlpt: 5, pos: ['v5t'], glosses: ['to hold'] }),
  aida: word('5', ['間'], ['あいだ'], { jlpt: 4, pos: ['n'], glosses: ['space; interval'] }),
  ma: word('6', ['間'], ['ま'], { jlpt: 3, pos: ['n'] }),
  hon: word('7', ['本'], ['ほん'], { jlpt: 5, pos: ['n'], glosses: ['book'] }),
  yomu: word('8', ['読む'], ['よむ'], { jlpt: 5, pos: ['v5m'] }),
  gakusei: word('9', ['学生'], ['がくせい'], { jlpt: 5, pos: ['n'], glosses: ['student'] }),
  ikiru: word('10', ['生きる'], ['いきる'], { jlpt: 4, pos: ['v1'] }),
  issho: word('11', ['一生'], ['いっしょう'], { jlpt: 3, pos: ['n'] }),
  shoukai: word('12', ['紹介'], ['しょうかい'], { jlpt: 4, pos: ['n', 'vs'] }),
  kuru: word('13', ['来る'], ['くる'], { jlpt: 5, pos: ['vk'] }),
  kore: word('14', [], ['これ'], { jlpt: 5, pos: ['pn'] }),
  kane: word('15', ['金'], ['かね'], { jlpt: 5, pos: ['n'] }),
  ji: word('16', ['時'], ['とき'], { jlpt: 5, pos: ['n'] }),
  sensei: word('17', ['先生'], ['せんせい'], { jlpt: 5, pos: ['n'] }),
  koohii: word('18', [], ['コーヒー'], { jlpt: 5, pos: ['n'] }),
} as const satisfies Record<string, Word>;

function kanji(char: string, on: string[], kun: string[], extra: Partial<Kanji> = {}): Kanji {
  return { char, meanings: [`meaning of ${char}`], on, kun, components: [], ...extra };
}

export const K: readonly Kanji[] = [
  kanji('駅', ['エキ'], []),
  kanji('友', ['ユウ'], ['とも']),
  kanji('達', ['タツ', 'ダチ'], []),
  kanji('待', ['タイ'], ['ま.つ'], { components: ['彳', '寺'], phonetic: '寺' }),
  kanji('持', ['ジ'], ['も.つ'], { components: ['扌', '寺'], phonetic: '寺' }),
  kanji('時', ['ジ'], ['とき'], { components: ['日', '寺'], phonetic: '寺' }),
  kanji('寺', ['ジ'], ['てら'], { components: ['土', '寸'] }),
  kanji('間', ['カン', 'ケン'], ['あいだ', 'ま']),
  kanji('本', ['ホン'], ['もと'], { components: ['木'] }),
  kanji('読', ['ドク'], ['よ.む']),
  kanji('学', ['ガク'], ['まな.ぶ']),
  kanji('生', ['セイ', 'ショウ'], ['い.きる', 'う.まれる', 'なま'], {
    meanings: ['life', 'birth'],
  }),
  kanji('一', ['イチ', 'イツ'], ['ひと']),
  kanji('紹', ['ショウ'], []),
  kanji('介', ['カイ'], []),
  kanji('来', ['ライ'], ['く.る']),
  kanji('先', ['セン'], ['さき']),
  kanji('星', ['セイ', 'ショウ'], ['ほし'], { components: ['日', '生'], phonetic: '生' }),
  kanji('性', ['セイ', 'ショウ'], [], { components: ['忄', '生'], phonetic: '生' }),
];

/** Shorthand token: [surface, reading, pos, wordId?, base?]. */
type T = [string, string, string, Word?, string?];

/** A sentence's JLPT level as the packs count it (G2): its hardest kanji word. */
function levelOf(parts: readonly T[]): NonNullable<Sentence['level']> {
  const levels = parts.flatMap(([surface, , , entry]) =>
    entry && /\p{Script=Han}/u.test(surface) ? [entry.jlpt ?? 1] : [],
  );
  return Math.min(5, ...levels) as NonNullable<Sentence['level']>;
}

function sentence(id: string, parts: readonly T[]): Sentence {
  let start = 0;
  const tokens = parts.map(([surface, reading, pos, entry, base]): Token => {
    const token: Token = { surface, reading, base: base ?? surface, pos, start };
    if (entry) token.wordId = entry.id;
    start += surface.length;
    return token;
  });
  const text = tokens.map((t) => t.surface).join('');
  const wordIds = [...new Set(tokens.flatMap((t) => t.wordId ?? []))];
  return {
    id,
    level: levelOf(parts),
    text,
    source: 'tatoeba',
    tokens,
    wordIds,
    verified: true,
    translation: `${id} in English`,
  };
}

const P = (s: string): T => [s, s, 'particle'];
const A = (s: string): T => [s, s, 'auxiliary'];
const DOT: T = ['。', '。', 'symbol'];

export const S = {
  /** 駅で友達を待っている間に、本を読みました。 */
  waiting: sentence('s-wait', [
    ['駅', 'えき', 'noun', W.eki],
    P('で'),
    ['友達', 'ともだち', 'noun', W.tomodachi],
    P('を'),
    ['待っ', 'まっ', 'verb', W.matsu, '待つ'],
    P('て'),
    ['いる', 'いる', 'verb'],
    ['間', 'あいだ', 'noun', W.aida],
    P('に'),
    ['、', '、', 'symbol'],
    ['本', 'ほん', 'noun', W.hon],
    P('を'),
    ['読み', 'よみ', 'verb', W.yomu, '読む'],
    A('まし'),
    A('た'),
    DOT,
  ]),
  /** 友達の間に本。 with 間 read ま by the tokenizer: a wrong lone-kanji reading (D13). */
  ma: sentence('s-ma', [
    ['友達', 'ともだち', 'noun', W.tomodachi],
    P('の'),
    ['間', 'ま', 'noun', W.ma],
    P('に'),
    ['本', 'ほん', 'noun', W.hon],
    DOT,
  ]),
  /** 学生が本を読む。 */
  student: sentence('s-student', [
    ['学生', 'がくせい', 'noun', W.gakusei],
    P('が'),
    ['本', 'ほん', 'noun', W.hon],
    P('を'),
    ['読む', 'よむ', 'verb', W.yomu],
    DOT,
  ]),
  /** 駅で友達を待つ。 */
  waitPlain: sentence('s-wait-plain', [
    ['駅', 'えき', 'noun', W.eki],
    P('で'),
    ['友達', 'ともだち', 'noun', W.tomodachi],
    P('を'),
    ['待つ', 'まつ', 'verb', W.matsu],
    DOT,
  ]),
  /** 友達が来ました。 (来 read き: a 来る stem) */
  came: sentence('s-came', [
    ['友達', 'ともだち', 'noun', W.tomodachi],
    P('が'),
    ['来', 'き', 'verb', W.kuru, '来る'],
    A('まし'),
    A('た'),
    DOT,
  ]),
  /** 金を本に。 with 金 read きむ: a reading JMdict does not know. */
  misfit: sentence('s-misfit', [
    ['金', 'きむ', 'noun', W.kane],
    P('を'),
    ['本', 'ほん', 'noun', W.hon],
    P('に'),
    DOT,
  ]),
} as const;

export const NOW = Date.parse('2026-10-17T09:00:00Z');
export const ALL_WORDS: readonly Word[] = Object.values(W);

/** Memory repos over the fixture dictionary and sentences. */
export async function readingRepos(settings: Partial<Settings> = {}): Promise<Repos> {
  const repos = createMemoryRepos({ dictionary: createFakeDictionary(ALL_WORDS, K), settings });
  await repos.sentences.putMany(Object.values(S));
  return repos;
}

/** Stores word items at the given levels; due now unless `dueIn` (ms) says otherwise. */
export async function track(
  repos: Repos,
  levels: readonly [Word, KnowledgeLevel][],
  options: { dueIn?: number; lesson?: string; kind?: Item['source']['kind'] } = {},
): Promise<void> {
  const items = levels.map(
    ([entry, level]): Item => ({
      id: `word:${entry.id}`,
      kind: 'word',
      ref: entry.id,
      level,
      card: {
        due: NOW + (options.dueIn ?? 0),
        stability: 1,
        difficulty: 5,
        elapsedDays: 0,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 0,
        lapses: 0,
        state: 0,
      },
      source: {
        kind: options.kind ?? 'textbook',
        week: '2026-W42',
        addedAt: NOW - 86_400_000,
        ...(options.lesson ? { lesson: options.lesson } : {}),
      },
      updatedAt: NOW,
    }),
  );
  await repos.items.putMany(items);
}

/** Known (level 3, not due) background words for the fixture sentences. */
export async function knowBasics(repos: Repos): Promise<void> {
  await track(
    repos,
    [
      [W.eki, 3],
      [W.tomodachi, 3],
      [W.hon, 3],
      [W.yomu, 3],
    ],
    { dueIn: 30 * 86_400_000 },
  );
}
