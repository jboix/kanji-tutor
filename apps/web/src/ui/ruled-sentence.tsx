import type { ReactNode } from 'react';
import type { Token } from '../domain/types.ts';
import { cx } from './cx.ts';
import { splitFurigana } from './furigana.ts';
import { Insertion, Ruby } from './ruby.tsx';
import styles from './ruled-sentence.module.css';
import { groupParts, type PartGroup, type SentencePart, sentenceParts } from './sentence-parts.ts';
import { type SentenceOrigin, TutorMark } from './tutor-mark.tsx';

export type SentenceSize = 'read' | 'compose' | 'callout' | 'context';

export type TargetResult = 'correct' | 'missed' | 'shown';

export interface RuledSentenceProps {
  /**
   * A `Sentence` or anything with its text and tokens. A sentence the tutor wrote or read from
   * a photo shows "Written by the tutor" under it, in every exercise and list (A18).
   */
  sentence: { text: string; tokens: readonly Token[] } & SentenceOrigin;
  /** read 28px/2.1 (default) · compose 23px/2.3 · callout 22px/1.7 · context: above a sheet. */
  size?: SentenceSize;
  /** Ruled lines behind the text; on by default for read and compose. */
  ruled?: boolean;
  /** Token indices underlined as the target (2px accent), or highlighted in `context`. */
  target?: readonly number[];
  /**
   * The target once answered (U2): green when read right, crimson for a miss, ink when
   * shown after "I don't know". It stays inline on the baseline: colour and underline only.
   */
  result?: TargetResult | undefined;
  /** Token indices worth asking about: dotted underline. */
  ask?: readonly number[];
  /** Token indices that show furigana. The feature decides (known words hide it). */
  furigana?: readonly number[];
  /** Token indices with a correction: wavy vermilion underline. */
  wavy?: readonly number[];
  /** Inserted corrections: a caret and the missing text, before the given token. */
  insertions?: readonly { before: number; text: string }[];
  /** Called with the token index when a tappable token is tapped (or activated by keyboard). */
  onTokenTap?: (index: number) => void;
  /** Which tokens are tappable when `onTokenTap` is set; default: all but symbols. */
  tappable?: (token: Token, index: number) => boolean;
  /** Inside other Japanese text (a question stem, an option): a span in the parent's type. */
  inline?: boolean;
}

const notSymbol = (token: Token) => token.pos !== 'symbol';

/** A tokenised Japanese sentence on ruled lines (read.html, compose.html). */
export function RuledSentence(props: RuledSentenceProps) {
  const { sentence, size = 'read', ruled = size === 'read' || size === 'compose' } = props;
  const parts = sentenceParts(sentence.text, sentence.tokens);
  const groups = groupParts(parts, sentence.tokens, props.target);
  const body = groups.map((group) => (
    <GroupView key={partKey(group.parts[0])} group={group} props={props} />
  ));
  if (props.inline) {
    return (
      <span lang="ja" className={styles.inline}>
        {body}
      </span>
    );
  }
  const classes = cx(styles.sentence, size !== 'read' && styles[size], ruled && styles.ruled);
  return (
    <>
      <p lang="ja" className={classes}>
        {body}
      </p>
      <TutorMark of={sentence} />
    </>
  );
}

function Parts({ parts, props }: { parts: SentencePart[]; props: RuledSentenceProps }) {
  return parts.map((part) => <PartView key={partKey(part)} part={part} props={props} />);
}

function GroupView({ group, props }: { group: PartGroup; props: RuledSentenceProps }) {
  const body = group.target ? (
    <span
      className={cx(styles.target, props.result && styles[props.result])}
      data-target={props.result ?? ''}
    >
      <Parts parts={group.parts} props={props} />
    </span>
  ) : (
    <Parts parts={group.parts} props={props} />
  );
  if (group.trailing.length === 0) return body;
  return (
    <span className={styles.keep}>
      {body}
      <Parts parts={group.trailing} props={props} />
    </span>
  );
}

function partKey(part: SentencePart | undefined): string {
  if (!part) return '';
  return part.kind === 'text' ? `g${part.start}` : `t${part.index}`;
}

function PartView({ part, props }: { part: SentencePart | undefined; props: RuledSentenceProps }) {
  if (!part) return null;
  if (part.kind === 'text') return part.text;
  return <TokenPart index={part.index} {...props} />;
}

function has(list: readonly number[] | undefined, index: number): boolean {
  return list?.includes(index) ?? false;
}

function isTappable(props: RuledSentenceProps, token: Token, index: number): boolean {
  return props.onTokenTap !== undefined && (props.tappable ?? notSymbol)(token, index);
}

function tokenClass(props: RuledSentenceProps, index: number): string {
  return cx(has(props.ask, index) && styles.ask, has(props.wavy, index) && styles.wavy);
}

function TokenPart({ index, ...props }: RuledSentenceProps & { index: number }) {
  const token = props.sentence.tokens[index];
  if (!token) return null;
  const insertion = props.insertions?.find((ins) => ins.before === index);
  const tappable = isTappable(props, token, index);
  const className = tokenClass(props, index);
  const content = has(props.furigana, index) ? <Furigana token={token} /> : token.surface;
  return (
    <>
      {insertion && <Insertion text={insertion.text} />}
      {tappable ? (
        <TapToken className={className} onTap={() => props.onTokenTap?.(index)}>
          {content}
        </TapToken>
      ) : (
        <span className={className || undefined}>{content}</span>
      )}
    </>
  );
}

/** A word to tap. Its name is what it shows, furigana included (WCAG 2.5.3). */
function TapToken(props: { className: string; onTap: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cx(styles.tap, props.className)}
      data-word=""
      onClick={props.onTap}
    >
      {props.children}
    </button>
  );
}

function Furigana({ token }: { token: Token }) {
  const parts = splitFurigana(token.surface, token.reading);
  if (!parts) return token.surface;
  return (
    <>
      {parts.before}
      <Ruby base={parts.base} reading={parts.reading} />
      {parts.after}
    </>
  );
}
