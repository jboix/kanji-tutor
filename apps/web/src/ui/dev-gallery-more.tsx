import { ActionBar, ActionFixed, ActionHint, ActionRow } from './action-bar.tsx';
import { AiBlock, AiDivider } from './ai-block.tsx';
import { Chip, ChipRow } from './chip.tsx';
import styles from './dev-gallery.module.css';
import { COMPOSE_SENTENCE } from './dev-gallery-data.ts';
import { Sample } from './dev-gallery-read.tsx';
import { IconButton } from './icon-button.tsx';
import { BackIcon } from './icons.tsx';
import { Ja } from './ja.tsx';
import { KnowledgeDots } from './knowledge-dots.tsx';
import { PillButton } from './pill-button.tsx';
import { Reading } from './reading.tsx';
import { RuledSentence } from './ruled-sentence.tsx';
import { SectionLabel } from './section-label.tsx';
import { TopBar } from './top-bar.tsx';

export function ComposeSample() {
  return (
    <Sample name="compose.html · RuledSentence compose, Insertion, wavy, outline seal">
      <div className={styles.flush}>
        <TopBar
          start={
            <IconButton aria-label="Back">
              <BackIcon />
            </IconButton>
          }
          center="Use it · grammar 3 of 6"
        />
      </div>
      <SectionLabel>Your sentence</SectionLabel>
      <RuledSentence
        sentence={COMPOSE_SENTENCE}
        size="compose"
        insertions={[{ before: 3, text: 'な' }]}
        wavy={[14, 15, 16]}
      />
      <div className={styles.stack16}>
        <AiBlock size="sm" label="Correction">
          <b>
            Needed: <Ja>な</Ja>.
          </b>{' '}
          <Ja>嫌い</Ja> is a na-adjective, so it takes <Ja>な</Ja> before <Ja>わけ</Ja>.
        </AiBlock>
        <AiBlock size="sm" styleNote label="Style note">
          <b>Correct, but casual.</b> After <Ja>ではないが</Ja>, written style flows better with{' '}
          <Ja>好きではない</Ja>.
        </AiBlock>
      </div>
      <div className={styles.flush}>
        <ComposeActions />
      </div>
    </Sample>
  );
}

function ComposeActions() {
  return (
    <ActionBar>
      <ActionRow>
        <PillButton variant="secondary">Rewrite</PillButton>
        <PillButton grow={1.4}>Accept corrections</PillButton>
      </ActionRow>
      <ActionHint>Your corrected sentence joins your review deck</ActionHint>
    </ActionBar>
  );
}

function ReadingRow(props: {
  kana: string;
  words: string;
  level: 0 | 1 | 2 | 3 | 4;
  misread?: boolean;
}) {
  return (
    <div className={styles.readingRow}>
      <div lang="ja" className={styles.readingKana}>
        {props.kana}
      </div>
      <div lang="ja" className={styles.readingWords}>
        {props.words}
      </div>
      <KnowledgeDots level={props.level} misread={props.misread ?? false} />
    </div>
  );
}

export function KanjiSample() {
  return (
    <Sample name="kanji.html · KnowledgeDots (0–4, misread), AiBlock xs, Chip">
      <div className={styles.stack}>
        <SectionLabel>How well you read it</SectionLabel>
        <ReadingRow kana="セイ" words="学生 · 先生 · 生活" level={4} />
        <ReadingRow kana="い・きる" words="生きる" level={3} />
        <ReadingRow kana="ショウ" words="一生" level={1} misread />
        <AiBlock size="xs">
          You already read <Ja>一緒</Ja> as <Reading kana="いっしょ" />. <Ja>一生</Ja> is{' '}
          <Reading kana="いっしょう" verified={false} />: one sound longer.
        </AiBlock>
        <ReadingRow kana="なま" words="生ビール" level={1} />
      </div>
      <ChipRow>
        <Chip>
          Read 5 sentences with <Ja>ショウ</Ja>
        </Chip>
        <Chip>Why so many readings?</Chip>
      </ChipRow>
    </Sample>
  );
}

export function NotesSample() {
  return (
    <Sample name="notes.html · AiDivider (28px seal), pill pair">
      <p className={styles.lead}>
        What still trips you is <a href="#length">length</a>. Seven of nine misses dropped a long
        vowel: <Ja>紹介</Ja> as <Ja>しょかい</Ja>.
      </p>
      <AiDivider />
      <ActionRow>
        <PillButton>Use this plan</PillButton>
        <ActionFixed>
          <PillButton variant="secondary">Change it</PillButton>
        </ActionFixed>
      </ActionRow>
    </Sample>
  );
}
