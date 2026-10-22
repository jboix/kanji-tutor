import { type ReactNode, useState } from 'react';
import { ActionBar } from './action-bar.tsx';
import { AiBlock } from './ai-block.tsx';
import { AnswerInput } from './answer-input.tsx';
import { BottomSheet, SheetHeading } from './bottom-sheet.tsx';
import { Callout } from './callout.tsx';
import { Chip } from './chip.tsx';
import styles from './dev-gallery.module.css';
import { READ_SENTENCE, VOICE_SENTENCE } from './dev-gallery-data.ts';
import { IconButton } from './icon-button.tsx';
import { CloseIcon, MicIcon, SpeakerIcon } from './icons.tsx';
import { Fix, Ja, StruckAnswer } from './ja.tsx';
import { ListRow } from './list-row.tsx';
import { PillButton, PillLink } from './pill-button.tsx';
import { ProgressRow } from './progress-line.tsx';
import { Reading } from './reading.tsx';
import { RuledSentence } from './ruled-sentence.tsx';
import { SectionHeader, SectionLabel } from './section-label.tsx';
import { SessionProgress } from './session-progress.tsx';
import { TopBar } from './top-bar.tsx';

const noop = () => undefined;

export function Sample({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-label={name}>
      <p className={styles.name}>{name}</p>
      {children}
    </section>
  );
}

export function TodaySample() {
  return (
    <Sample name="today.html · Callout, PillLink arrow, AiBlock sm">
      <div className={styles.hero}>
        <span lang="ja" className={styles.heroWord}>
          今日
        </span>
        <span className={styles.muted}>Sat 17 October</span>
      </div>
      <Callout label="You'll start with">
        <RuledSentence sentence={READ_SENTENCE} size="callout" target={[4, 5]} />
        <PillLink to="#begin" arrow>
          Begin reading
        </PillLink>
      </Callout>
      <AiBlock size="sm" detail={<a href="#notes">Read this week's notes</a>}>
        Most misses this week were long vowels, like <Ja>しょ</Ja> for <Ja>しょう</Ja>. I've mixed
        ten of those into today's session.
      </AiBlock>
      <TodayList />
    </Sample>
  );
}

function TodayList() {
  return (
    <div className={styles.stack}>
      <SectionHeader
        title="This week in class"
        meta={
          <>
            Tobira <Ja>第4課</Ja>
          </>
        }
      />
      <ProgressRow
        label="Words you read in new sentences"
        valueText="19 of 28"
        done={19}
        total={28}
      />
      <ProgressRow label="Grammar you've used yourself" valueText="3 of 6" done={3} total={6} />
      <ListRow to="#compose" detail="Not used yet · corrected in the margin">
        Write one sentence with <b lang="ja">〜わけではない</b>
      </ListRow>
      <ListRow to="#kanji" inline detail="still swapping these · 4 times">
        <Ja variant="emph">待 持</Ja>
      </ListRow>
    </div>
  );
}

export function ReadSample() {
  const [tapped, setTapped] = useState<string>('none');
  const [furigana, setFurigana] = useState(false);
  return (
    <Sample name="read.html · TopBar, SessionProgress, RuledSentence, AiBlock md, ActionBar">
      <div className={styles.flush}>
        <TopBar
          start={
            <IconButton aria-label="End session">
              <CloseIcon />
            </IconButton>
          }
          center={<SessionProgress current={6} total={20} />}
          end={<FuriganaToggle on={furigana} onToggle={() => setFurigana(!furigana)} />}
        />
      </div>
      <div className={styles.small}>
        Tobira <Ja>第4課</Ja> · tap any word to ask about it (last: <Ja>{tapped}</Ja>)
      </div>
      <RuledSentence
        sentence={READ_SENTENCE}
        target={[4, 5]}
        ask={[7, 8]}
        furigana={furigana ? [0, 2, 4, 7, 10, 12] : [4]}
        onTokenTap={(i) => setTapped(READ_SENTENCE.tokens[i]?.surface ?? '')}
      />
      <ReadMistake />
      <div className={styles.flush}>
        <ReadActions />
      </div>
    </Sample>
  );
}

function FuriganaToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <IconButton
      aria-label="Show furigana on known words"
      aria-pressed={on}
      muted
      glyph
      onClick={onToggle}
    >
      ふ
    </IconButton>
  );
}

function ReadMistake() {
  return (
    <>
      <div className={styles.wrote}>
        <span className={styles.muted}>You wrote</span>
        <StruckAnswer>もって</StruckAnswer>
      </div>
      <AiBlock
        chips={
          <>
            <Chip>
              <Ja>待</Ja> and <Ja>持</Ja> side by side
            </Chip>
            <Chip>
              One more with <Ja>待</Ja>
            </Chip>
            <Chip>Break down the sentence</Chip>
          </>
        }
      >
        You read it as <Ja variant="emph">持</Ja>, to hold. Look at the left side:{' '}
        <Ja variant="emph">待</Ja> has <Ja>彳</Ja>, a person walking, while <Ja>持</Ja> has{' '}
        <Ja>扌</Ja>, a hand. Here someone walked to the station and is waiting.
      </AiBlock>
    </>
  );
}

function ReadActions() {
  return (
    <ActionBar>
      <AnswerInput
        variant="ask"
        label="Ask about this sentence"
        placeholder="Ask about this sentence…"
        onSubmit={noop}
        clearOnSubmit
        trailing={
          <IconButton size={36} muted aria-label="Ask by voice">
            <MicIcon />
          </IconButton>
        }
      />
      <PillButton>Next sentence</PillButton>
    </ActionBar>
  );
}

export function VoiceSample() {
  return (
    <Sample name="voice.html · sentence without rules, Fix, chip with icon, IconButton 48">
      <div className={styles.small}>Say the underlined word out loud</div>
      <RuledSentence sentence={VOICE_SENTENCE} ruled={false} target={[5]} />
      <div className={styles.wrote}>
        <span className={styles.muted}>Expected</span>
        <span lang="ja">
          しょ<Fix>う</Fix>かい
        </span>
      </div>
      <AiBlock
        chips={
          <Chip icon={<SpeakerIcon />}>
            Hear <Ja>しょうかい</Ja>
          </Chip>
        }
      >
        Right kanji, short vowel. <Ja>紹</Ja> is <Reading kana="しょう" />, held for two beats.
      </AiBlock>
      <div className={styles.buttons}>
        <IconButton size={48} look="outline" glyph aria-label="Type instead">
          あ
        </IconButton>
        <IconButton size={48} look="outline" aria-label="Hold to speak again">
          <MicIcon />
        </IconButton>
      </div>
    </Sample>
  );
}

export function ExplainSample() {
  const [open, setOpen] = useState(false);
  return (
    <Sample name="explain.html · BottomSheet (open it), SheetHeading, context sentence">
      <PillButton variant="secondary" onClick={() => setOpen(true)}>
        Open the word sheet for <Ja>間に</Ja>
      </PillButton>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        label="間に in this sentence"
        context={<RuledSentence sentence={READ_SENTENCE} size="context" target={[7, 8]} />}
        header={
          <SheetHeading word="間に">
            <Reading kana="あいだに" /> · while, at some point during
          </SheetHeading>
        }
      >
        <ExplainBody />
      </BottomSheet>
    </Sample>
  );
}

function ExplainBody() {
  return (
    <>
      <SectionLabel>How this sentence is built</SectionLabel>
      <AiBlock size="sm">
        With <b lang="ja">間に</b>, the reading happened at some point while you waited. Drop the{' '}
        <Ja>に</Ja> and it means you read the <i>whole</i> time:
        <Ja variant="line">待っている間、本を読んでいた。</Ja>
      </AiBlock>
      <div className={styles.small}>
        Grammar point from Tobira <Ja>第4課</Ja> · readings checked
      </div>
    </>
  );
}
