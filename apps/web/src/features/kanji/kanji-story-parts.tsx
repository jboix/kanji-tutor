/** The pieces of a kanji's story: its parts as a sum, the short story, and why it did not come. */
import { Fragment } from 'react';
import { Link } from 'react-router';
import type { AiError, KanjiStory } from '../../ai/types.ts';
import type { KanjiWithParts, StoryMaterial } from '../../domain/services/index.ts';
import { AiBlockStatus } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { hasKanji } from '../../ui/furigana.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { TickIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import { Reading } from '../../ui/reading.tsx';
import { Ruby } from '../../ui/ruby.tsx';
import styles from './kanji-story.module.css';
import { storyPieces } from './story-ruby.ts';

function Tile({ char, meaning, whole }: { char: string; meaning?: string; whole?: boolean }) {
  return (
    <span className={styles.part} data-whole={whole ? '' : undefined}>
      <span lang="ja" className={styles.partChar}>
        {char}
      </span>
      {meaning && <span className={styles.partMeaning}>{meaning}</span>}
    </span>
  );
}

/** "亻 person + 木 tree = 休 rest"; nothing for a kanji that is a single shape. */
export function PartsSum({ kanji }: { kanji: KanjiWithParts }) {
  const t = useT();
  const parts = kanji.parts.filter((part) => part.char !== kanji.char);
  if (parts.length === 0) return <p className={styles.muted}>{t('kanji.storySingle')}</p>;
  return (
    <p className={styles.sum}>
      {parts.map((part, i) => (
        <Fragment key={part.char}>
          {i > 0 && (
            <span className={styles.op} aria-hidden="true">
              +
            </span>
          )}
          <Tile char={part.char} {...(part.meaning ? { meaning: part.meaning } : {})} />
        </Fragment>
      ))}
      <span className={styles.op} aria-hidden="true">
        =
      </span>
      <Tile
        char={kanji.char}
        {...(kanji.meanings[0] ? { meaning: kanji.meanings[0] } : {})}
        whole
      />
    </p>
  );
}

/** Known kanji the story uses, besides the kanji itself. */
function knownIn(text: string, { kanji, knownKanji }: StoryMaterial): number {
  const known = new Set(knownKanji);
  return new Set([...text].filter((c) => c !== kanji.char && hasKanji(c) && known.has(c))).size;
}

function Checked({ story }: { story: KanjiStory }) {
  const t = useT();
  const failed = story.readings.filter((reading) => !reading.verified);
  if (failed.length === 0) {
    return (
      <p className={styles.checked}>
        <TickIcon />
        {t('kanji.storyChecked')}
      </p>
    );
  }
  return (
    <p className={styles.muted}>
      {t('teach.unconfirmed')}{' '}
      {failed.map((reading, i) => (
        <span key={`${reading.surface}:${reading.reading}`}>
          {i > 0 && ' · '}
          <Ja>{reading.surface}</Ja> <Reading kana={reading.reading} verified={false} />
        </span>
      ))}
    </p>
  );
}

/** The story's text, each confirmed word with its furigana. */
function TaleRuby({ story }: { story: KanjiStory }) {
  let at = 0;
  return storyPieces(story.story.text, story.readings).map((piece) => {
    const key = at;
    if (!('base' in piece)) {
      at += piece.text.length;
      return <Fragment key={key}>{piece.text}</Fragment>;
    }
    at += piece.before.length + piece.base.length + piece.after.length;
    return (
      <Fragment key={key}>
        {piece.before}
        <Ruby base={piece.base} reading={piece.reading} />
        {piece.after}
      </Fragment>
    );
  });
}

/** The short story with furigana, its translation when shown, and how its readings were checked. */
export function StoryText(props: { story: KanjiStory; material: StoryMaterial; shown: boolean }) {
  const t = useT();
  const { story, material, shown } = props;
  const n = knownIn(story.story.text, material);
  return (
    <div className={styles.tale}>
      <p className={styles.lead}>{t('kanji.storyWith', { kanji: material.kanji.char, n })}</p>
      <p lang="ja" className={styles.taleText}>
        <TaleRuby story={story} />
      </p>
      {shown && <p className={styles.translation}>{story.story.translation}</p>}
      <Checked story={story} />
    </div>
  );
}

/** Why the tutor wrote no story, in the AI box; the countdown and Retry after a 429 (A14). */
export function StoryProblem({ error, onRetry }: { error: AiError; onRetry: () => void }) {
  const { t, rich } = useI18n();
  const line = () => {
    if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
    if (error.kind === 'no-key') {
      const settings = <Link to={paths.settingsSection('tutor')}>{t('teach.settingsLink')}</Link>;
      return <p className={styles.muted}>{rich('teach.noKey', { settings })}</p>;
    }
    const offline = error.kind === 'offline';
    const text = offline
      ? t('teach.offline')
      : t('teach.failed', { reason: aiErrorText(t, error) });
    return <p className={styles.muted}>{text}</p>;
  };
  return (
    <AiBlockStatus>
      <div role="status">{line()}</div>
    </AiBlockStatus>
  );
}
