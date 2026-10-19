import type { Grade } from '../../domain/types.ts';
import { canSpeak, speak } from '../../lang/index.ts';
import { type KanaSegmentKind, kanaDiff } from '../../lang/voice/index.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { SpeakerIcon } from '../../ui/icons.tsx';
import { Fix, StruckAnswer } from '../../ui/ja.tsx';
import styles from './read.module.css';
import { diffParts, SLIP } from './read-copy.ts';

interface Piece {
  key: string;
  kind: KanaSegmentKind;
  text: string;
}

/** Diff segments with one gap per missing kana, keyed by position in the alignment. */
function pieces(expected: string, said: string): Piece[] {
  let at = 0;
  return kanaDiff(expected, said).flatMap(({ kind, text }) => {
    const parts = kind === 'missing' ? [...text] : [text];
    return parts.map((part) => {
      at += part.length;
      return { key: `${kind}${at}`, kind, text: part };
    });
  });
}

/** The spoken kana with a vermilion gap where kana were left out (voice.html しょ＿かい). */
function SaidKana({ expected, said }: { expected: string; said: string }) {
  const t = useT();
  return (
    <p lang="ja" className={styles.said}>
      {pieces(expected, said).map(({ key, kind, text }) => {
        if (kind === 'same') return <span key={key}>{text}</span>;
        if (kind === 'extra') return <StruckAnswer key={key}>{text}</StruckAnswer>;
        return (
          <span key={key} className={styles.gap}>
            <span className="visually-hidden">{t('readSession.missingKana', { kana: text })}</span>
          </span>
        );
      })}
    </p>
  );
}

function ExpectedFix({ grade }: { grade: Grade }) {
  const [before, diff, after] = diffParts(grade.expected, grade.given);
  const slip = SLIP[grade.errorType ?? 'other'];
  const t = useT();
  return (
    <p className={styles.line}>
      <span className={styles.muted}>{t('readSession.expected')}</span>
      <span lang="ja" className={styles.expected}>
        {before}
        <Fix>{diff}</Fix>
        {after}
      </span>
      {slip && <span className={styles.muted}>· {t(slip)}</span>}
    </p>
  );
}

/** "What you said" after a spoken answer that missed (voice.html), and a way to hear it right. */
export function SaidAnswer({ grade }: { grade: Grade }) {
  const near = grade.verdict === 'near-miss';
  const t = useT();
  return (
    <>
      <div className={styles.saidBlock}>
        <p className={styles.caps}>{t('readSession.whatYouSaid')}</p>
        {near ? (
          <SaidKana expected={grade.expected} said={grade.given} />
        ) : (
          <StruckAnswer>{grade.given}</StruckAnswer>
        )}
        {near && <ExpectedFix grade={grade} />}
      </div>
      {canSpeak() && (
        <ChipRow>
          <Chip icon={<SpeakerIcon />} onClick={() => void speak(grade.expected)}>
            {t('readSession.hear')} <span lang="ja">{grade.expected}</span>
          </Chip>
        </ChipRow>
      )}
    </>
  );
}
