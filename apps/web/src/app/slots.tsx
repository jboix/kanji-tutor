import { type ComponentType, lazy, Suspense } from 'react';
import { canRecord } from '../lang/voice/index.ts';
import type { PagePeekSlotProps, Slots } from '../ui/slots.tsx';

/**
 * A slot component loaded on first render, so features that fill slots (explain, voice) stay out
 * of the app shell (N4). Renders nothing while it loads.
 */
function lazySlot<P extends object>(load: () => Promise<ComponentType<P>>): ComponentType<P> {
  const Loaded = lazy(async () => ({ default: await load() }));
  return function LazySlot(props: P) {
    return (
      <Suspense fallback={null}>
        <Loaded {...props} />
      </Suspense>
    );
  };
}

const explain = () => import('../features/explain/index.ts');
const teach = () => import('../features/teach/index.ts');

const grammarPeek = lazySlot(
  async () => (await import('../features/grammar/index.ts')).GrammarPeek,
);
const kanjiPeek = lazySlot(
  async () => (await import('../features/kanji/kanji-screen.tsx')).KanjiPeek,
);

const GrammarPeek = grammarPeek;
const KanjiPeek = kanjiPeek;

function PagePeek({ kind, id }: PagePeekSlotProps) {
  return kind === 'grammar' ? <GrammarPeek id={id} /> : <KanjiPeek char={id} />;
}

/** Slots filled by features that render inside other features' screens. */
export const SLOTS: Slots = {
  mistakeExplanation: lazySlot(async () => (await explain()).MistakeExplanation),
  wordSheet: lazySlot(async () => (await explain()).ExplainWordSheet),
  askBox: lazySlot(async () => (await explain()).AskBox),
  tutorSheet: lazySlot(async () => (await explain()).TutorSheet),
  readingHook: lazySlot(async () => (await explain()).ReadingHook),
  newItemIntro: lazySlot(async () => (await teach()).NewItemIntro),
  newWordChip: lazySlot(async () => (await teach()).NewWordChip),
  teachingCard: lazySlot(async () => (await teach()).TeachingCard),
  targetHint: lazySlot(async () => (await teach()).TargetHint),
  sentenceHelp: lazySlot(async () => (await teach()).SentenceHelp),
  sentenceWrapUp: lazySlot(async () => (await teach()).SentenceWrapUp),
  pagePeek: PagePeek,
  lessonIntro: lazySlot(async () => (await import('../features/units/index.ts')).LessonIntro),
  pointPractice: lazySlot(
    async () => (await import('../features/read/point-practice.tsx')).PointPractice,
  ),
  grammarIntro: lazySlot(async () => (await import('../features/grammar/index.ts')).GrammarIntro),
  aiSetup: lazySlot(async () => (await import('../features/settings/ai-setup.tsx')).AiSetup),
  kanjiDraw: lazySlot(
    async () => (await import('../features/handwrite/kanji-answer.tsx')).KanjiAnswer,
  ),
  // Same detection as voiceSlots(): no recorder, no voice entry point.
  ...(canRecord()
    ? {
        voiceAnswer: lazySlot(async () => (await import('../features/voice/index.ts')).VoiceAnswer),
      }
    : {}),
};
