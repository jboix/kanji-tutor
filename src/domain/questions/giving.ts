/**
 * Giving and receiving (あげる, くれる, もらう and their て forms) in 文法形式の判断 (J4). Which of
 * them fits is told by the particles around the verb, not by meaning, so a distractor is offered
 * only when the sentence's frame rules it out: Xから leaves only もらう, 私に rules out giving
 * away, 私は/私が rules out くれる. Forms of the same direction (くれる, くださる) are never set
 * against each other.
 */
import type { GrammarEntry } from '../grammar/types.ts';
import type { Token } from '../types.ts';

/** Who gives to whom: away from the speaker, to the speaker's side, or received by the subject. */
type Direction = 'out' | 'in' | 'receive';

const DIRECTION: Readonly<Record<string, Direction>> = {
  ageru: 'out',
  yaru: 'out',
  sashiageru: 'out',
  kureru: 'in',
  kudasaru: 'in',
  morau: 'receive',
  itadaku: 'receive',
  'te-ageru': 'out',
  'te-yaru': 'out',
  'te-sashiageru': 'out',
  'te-kureru': 'in',
  'te-kudasaru': 'in',
  'te-morau': 'receive',
  'te-itadaku': 'receive',
  'sasete-itadaku': 'receive',
};

function variant(id: string, pattern: string, meaning: string, formation: string): GrammarEntry {
  return {
    id,
    pattern,
    level: 4,
    family: 'giving-receiving',
    meaning,
    formation,
    explanation: meaning,
    cloze: [],
    rule: () => [],
  };
}

/**
 * Giving verbs the catalogue teaches as vocabulary rather than as points, offered only as
 * distractors (never blanked, never reviewed): without them a から sentence has two wrong forms.
 */
export const GIVING_VARIANTS: readonly GrammarEntry[] = [
  variant('yaru', '〜をやる', 'give (to someone below you, an animal or a plant)', 'N + をやる'),
  variant('sashiageru', '〜をさしあげる', 'humbly give (to someone above you)', 'N + をさしあげる'),
  variant('kudasaru', '〜をくださる', 'give me (said of someone you respect)', 'N + をくださる'),
  variant('itadaku', '〜をいただく', 'humbly receive', 'N + をいただく'),
  variant('te-yaru', '〜てやる', 'do (something) for someone below you', 'V-て + やる'),
  variant(
    'te-sashiageru',
    '〜てさしあげる',
    'humbly do (something) for someone',
    'V-て + さしあげる',
  ),
];

export const isGiving = (id: string) => DIRECTION[id] !== undefined;

const ME = new Set(['私', 'わたし', 'わたくし', '僕', 'ぼく', '俺', 'おれ', 'あたし', '私たち']);
const CLAUSE_END = new Set(['。', '！', '？', '「', '」']);
const NOUNISH = new Set(['noun', 'pronoun', 'suffix']);

interface Frame {
  /** Xから: something comes from someone. */
  from: boolean;
  /** 私に: the speaker receives. */
  toMe: boolean;
  /** 私は / 私が: the speaker is the subject. */
  meSubject: boolean;
}

/** What one particle tells about the frame, given the word before it. */
function mark(frame: Frame, particle: Token, prev: Token): void {
  const me = ME.has(prev.surface);
  if (particle.surface === 'から' && NOUNISH.has(prev.pos)) frame.from = true;
  if (particle.surface === 'に' && me) frame.toMe = true;
  if ((particle.surface === 'は' || particle.surface === 'が') && me) frame.meSubject = true;
}

/** The particles before index `k` in its sentence. */
export function frameBefore(tokens: readonly Token[], k: number): Frame {
  const frame: Frame = { from: false, toMe: false, meSubject: false };
  for (let i = k - 1; i > 0 && !CLAUSE_END.has(tokens[i]?.surface ?? ''); i--) {
    const t = tokens[i];
    const prev = tokens[i - 1];
    if (t?.pos === 'particle' && prev) mark(frame, t, prev);
  }
  return frame;
}

function ruledOut(direction: Direction, frame: Frame): boolean {
  if (direction === 'out') return frame.from || frame.toMe;
  if (direction === 'in') return frame.from || frame.meSubject;
  return false;
}

/**
 * Whether a giving or receiving form may be a distractor for `answerId`: never one of the same
 * direction, and another only when the frame rules it out. Forms of other families pass.
 */
export function givingAllowed(answerId: string, candidateId: string, frame: Frame): boolean {
  const theirs = DIRECTION[candidateId];
  if (theirs === undefined) return true;
  const ours = DIRECTION[answerId];
  if (ours === undefined) return true;
  return theirs !== ours && ruledOut(theirs, frame);
}
