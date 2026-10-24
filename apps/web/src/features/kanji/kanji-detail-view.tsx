import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { type KanjiDetail, readingLabel } from '../../domain/services/index.ts';
import type { Source } from '../../domain/types.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { ExternalLink, ExternalLinks } from '../../ui/external-link.tsx';
import { jishoKanjiUrl, wiktionaryKanjiUrl } from '../../ui/external-links.ts';
import { type I18n, useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { SectionLabel } from '../../ui/section-label.tsx';
import { TutorCard, TutorFloat, useTutor } from '../../ui/tutor.tsx';
import styles from './kanji.module.css';
import { ReadingRows } from './reading-rows.tsx';

function sinceText({ t, format }: I18n, source: Source): string {
  if (source.kind === 'import') {
    return source.lesson
      ? t('kanji.markedKnownLesson', { lesson: source.lesson })
      : t('kanji.markedKnown');
  }
  const since = source.lesson ?? format.date(source.addedAt, { day: 'numeric', month: 'long' });
  return t('kanji.knownSince', { since });
}

function countLine(t: I18n['t'], detail: KanjiDetail): string {
  const { rows, wordCount } = detail;
  if (wordCount === 0) return t('kanji.notInWords');
  const readings = t('kanji.readings', { n: rows.length });
  return t('kanji.countLine', { readings, words: t('kanji.inWords', { n: wordCount }) });
}

function Hero({ detail }: { detail: KanjiDetail }) {
  const i18n = useI18n();
  const { kanji, since } = detail;
  return (
    <header className={styles.hero}>
      <h1 lang="ja" className={styles.heroChar}>
        {kanji.char}
      </h1>
      <div className={styles.heroText}>
        <p className={styles.meanings}>{kanji.meanings.slice(0, 3).join(', ')}</p>
        <p className={styles.meta}>{countLine(i18n.t, detail)}</p>
        {since && <p className={styles.meta}>{sinceText(i18n, since)}</p>}
        <ExternalLinks>
          <ExternalLink site="jisho" href={jishoKanjiUrl(kanji.char)} />
          <ExternalLink site="wiktionary" href={wiktionaryKanjiUrl(kanji.char)} />
        </ExternalLinks>
      </div>
    </header>
  );
}

function Family({ family }: { family: NonNullable<KanjiDetail['family']> }) {
  const { t, rich } = useI18n();
  return (
    <section className={styles.family} aria-label={t('kanji.family')}>
      <SectionLabel>{rich('kanji.familyLabel', { sound: <Ja>{family.sound}</Ja> })}</SectionLabel>
      <div className={styles.members}>
        {family.members.map((m) => (
          <Link key={m.char} to={paths.kanjiDetail(m.char)} className={styles.member}>
            <span lang="ja" className={m.known ? styles.memberChar : styles.memberGuess}>
              {m.char}
            </span>
            <span className={styles.memberLabel}>
              {m.known ? t('kanji.memberKnown') : t('kanji.memberGuess')}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The reading to practise: the often-misread one, else the least known. */
function practiceReading(detail: KanjiDetail): string | undefined {
  const misread = detail.rows.find((row) => row.misread);
  return (misread ?? detail.rows.at(-1))?.reading;
}

function Practice({ detail }: { detail: KanjiDetail }) {
  const { rich } = useI18n();
  const navigate = useNavigate();
  const reading = practiceReading(detail);
  if (!reading) return null;
  const query = new URLSearchParams({ kanji: detail.kanji.char, reading });
  return (
    <ChipRow>
      <Chip onClick={() => void navigate(`${paths.read}?${query.toString()}`)}>
        {rich('kanji.practise', { reading: <Ja>{readingLabel(reading)}</Ja> })}
      </Chip>
    </ChipRow>
  );
}

/** The tutor on the kanji: under the hero, and on its own screen also floating. */
function KanjiTutor({ detail, floating }: { detail: KanjiDetail; floating: boolean }) {
  const t = useT();
  const { kanji, rows } = detail;
  const options = useMemo(() => {
    const words = rows.flatMap((row) => row.examples).slice(0, 4);
    const text = [kanji.char, ...words].join('、');
    return {
      topic: {
        about: kanji.char,
        sentence: { text, translation: kanji.meanings.slice(0, 3).join(', ') },
        surface: kanji.char,
      },
      starters: [
        t('kanji.tutorReadings', { x: kanji.char }),
        t('kanji.tutorRemember', { x: kanji.char }),
      ],
    };
  }, [kanji, rows, t]);
  const tutor = useTutor(options);
  if (!tutor) return null;
  return (
    <>
      <TutorCard tutor={tutor} />
      {floating && <TutorFloat tutor={tutor} />}
      {tutor.sheet}
    </>
  );
}

/**
 * The kanji page (kanji.html, K3): readings and how well each is read, the tutor, family,
 * practice. `floating` (its own screen, not a peek over a session) adds the floating Ask.
 */
export function KanjiDetailView(props: { detail: KanjiDetail; floating?: boolean }) {
  const { detail } = props;
  return (
    <>
      <Hero detail={detail} />
      <KanjiTutor detail={detail} floating={props.floating ?? false} />
      <ReadingRows detail={detail} />
      {detail.family && <Family family={detail.family} />}
      <Practice detail={detail} />
    </>
  );
}
