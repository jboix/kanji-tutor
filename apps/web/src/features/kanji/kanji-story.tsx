/**
 * A kanji's story on its page: its parts as a sum (亻 person + 木 tree = 休), always and offline;
 * then, only when asked, the tutor's story: a way to remember it built from the parts (never told
 * as the kanji's history) and a short story in kanji the learner reads, with furigana where the
 * dictionary confirmed the reading. "Another story" asks again; each take is cached on its own.
 */
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { AiClient, KanjiStory, KanjiStoryInput } from '../../ai/types.ts';
import { type StoryMaterial, storyMaterial } from '../../domain/services/index.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock, AiWriting } from '../../ui/ai-block.tsx';
import { Chip } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import { useAiResult } from '../../ui/use-ai-result.ts';
import styles from './kanji-story.module.css';
import { PartsSum, StoryProblem, StoryText } from './kanji-story-parts.tsx';

function useStoryMaterial(char: string): StoryMaterial | undefined {
  const { repos } = useServices();
  const [material, setMaterial] = useState<StoryMaterial>();
  useEffect(() => {
    let live = true;
    void storyMaterial(repos, char).then((found) => live && setMaterial(found));
    return () => {
      live = false;
    };
  }, [repos, char]);
  return material;
}

function storyInput({ kanji, knownKanji }: StoryMaterial, take: number): KanjiStoryInput {
  return {
    kanji: { char: kanji.char, meanings: kanji.meanings, parts: kanji.parts },
    knownKanji,
    take,
  };
}

function Told(props: { story: KanjiStory; material: StoryMaterial; another: ReactNode }) {
  const t = useT();
  const { story, material, another } = props;
  const [shown, setShown] = useState(false);
  const chips = (
    <>
      <Chip aria-pressed={shown} onClick={() => setShown((on) => !on)}>
        {t('kanji.storyTranslation')}
      </Chip>
      {another}
    </>
  );
  return (
    <AiBlock label={t('kanji.storyLabel')} size="sm" readings={story.readings} chips={chips}>
      <p className={styles.line}>
        <span className={styles.lead}>{t('kanji.storyRemember')}</span>
        <JaRuns text={story.line} />
      </p>
      <StoryText story={story} material={material} shown={shown} />
    </AiBlock>
  );
}

function Another(props: { input: KanjiStoryInput; onAsk: () => void }) {
  const t = useT();
  const { input, onAsk } = props;
  const next = useMemo(() => ({ ...input, take: input.take + 1 }), [input]);
  const peek = useCallback((c: AiClient) => c.peek('kanjiStory', next), [next]);
  return <AiAction label={t('kanji.storyAnother')} run={onAsk} peek={peek} />;
}

function TutorStory(props: { client: AiClient; material: StoryMaterial }) {
  const t = useT();
  const { client, material } = props;
  const [take, setTake] = useState(0);
  const input = useMemo(() => storyInput(material, take), [material, take]);
  const run = useCallback(() => client.kanjiStory(input), [client, input]);
  const state = useAiResult(run);
  if (state.status === 'loading') return <AiWriting>{t('kanji.storyWriting')}</AiWriting>;
  if (state.status === 'error') return <StoryProblem error={state.error} onRetry={state.retry} />;
  const another = <Another input={input} onAsk={() => setTake((n) => n + 1)} />;
  return <Told story={state.value} material={material} another={another} />;
}

/** The parts, and the tutor's story once asked for (see the module comment). */
function Story({ material }: { material: StoryMaterial }) {
  const t = useT();
  const [client, setClient] = useState<AiClient>();
  const first = useMemo(() => storyInput(material, 0), [material]);
  const peek = useCallback((c: AiClient) => c.peek('kanjiStory', first), [first]);
  return (
    <section className={styles.story} aria-label={t('kanji.storySection')}>
      <SectionLabel>{t('kanji.storyParts')}</SectionLabel>
      <PartsSum kanji={material.kanji} />
      {client ? (
        <TutorStory client={client} material={material} />
      ) : (
        <AiAction label={t('kanji.storyAsk')} run={setClient} peek={peek} look="secondary" />
      )}
    </section>
  );
}

/** The story section of a kanji's page; nothing until its parts are read. */
export function KanjiStoryCard({ char }: { char: string }) {
  const material = useStoryMaterial(char);
  return material ? <Story key={char} material={material} /> : null;
}
