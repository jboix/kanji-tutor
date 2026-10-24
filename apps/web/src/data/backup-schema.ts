import { z } from 'zod';

const level = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const itemKind = z.enum(['word', 'kanji', 'kanjiReading', 'grammar']);
const itemIdSchema = z.templateLiteral([itemKind, ':', z.string()]);
const errorType = z.enum([
  'wrong-kanji',
  'long-vowel',
  'sokuon',
  'rendaku',
  'kana-variant',
  'other',
]);
const verdict = z.enum(['correct', 'near-miss', 'wrong']);

const source = z.object({
  kind: z.enum(['textbook', 'capture', 'manual', 'import', 'compose', 'session']),
  lesson: z.string().exactOptional(),
  captureId: z.string().exactOptional(),
  week: z.string(),
  addedAt: z.number(),
});

const card = z.object({
  due: z.number(),
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number(),
  scheduledDays: z.number(),
  learningSteps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  lastReview: z.number().exactOptional(),
});

const item = z.object({
  id: itemIdSchema,
  kind: itemKind,
  ref: z.string(),
  level,
  card: card.exactOptional(),
  source,
  updatedAt: z.number(),
});

const kanjiReading = z.object({
  id: z.string(),
  kanji: z.string(),
  reading: z.string(),
  level,
  wordIds: z.array(z.string()),
});

const review = z.object({
  id: z.number().exactOptional(),
  at: z.number(),
  itemId: itemIdSchema,
  sentenceId: z.string().exactOptional(),
  answer: z.string(),
  expected: z.string(),
  verdict,
  errorType: errorType.exactOptional(),
  durationMs: z.number(),
  mode: z.enum(['typed', 'voice', 'drill']),
  skipped: z.literal(true).exactOptional(),
  variantOf: z.string().exactOptional(),
  questionKind: z
    .enum([
      'kanji-reading',
      'orthography',
      'context-word',
      'grammar-form',
      'sentence-order',
      'comprehension',
    ])
    .exactOptional(),
});

const token = z.object({
  surface: z.string(),
  reading: z.string(),
  base: z.string(),
  pos: z.string(),
  wordId: z.string().exactOptional(),
  start: z.number(),
});

const jlptLevel = z.union([z.literal(5), z.literal(4), z.literal(3), z.literal(2), z.literal(1)]);

const sentence = z.object({
  id: z.string(),
  text: z.string(),
  translation: z.string().exactOptional(),
  source: z.enum(['tatoeba', 'unit', 'capture', 'ai', 'compose']),
  sourceRef: z.string().exactOptional(),
  tokens: z.array(token),
  wordIds: z.array(z.string()),
  grammarIds: z.array(z.string()).exactOptional(),
  level: jlptLevel.exactOptional(),
  translations: z.record(z.string(), z.string()).exactOptional(),
  verified: z.boolean(),
  aiRead: z.literal(true).exactOptional(),
});

const grammar = z.object({
  id: z.string(),
  pattern: z.string(),
  meaning: z.string(),
  lesson: z.string().exactOptional(),
  level: z.union([z.literal(5), z.literal(4), z.literal(3)]).exactOptional(),
  exampleSentenceIds: z.array(z.string()),
  catalogue: z.literal(true).exactOptional(),
});

/** Captures carry their photo as a data URL inside the backup file. */
const capture = z.object({
  id: z.string(),
  createdAt: z.number(),
  photo: z.string().startsWith('data:').exactOptional(),
  lines: z.array(z.string()),
  lesson: z.string().exactOptional(),
  week: z.string(),
  addedItemIds: z.array(itemIdSchema),
  sentenceIds: z.array(z.string()),
});

const note = z.object({
  id: z.string(),
  createdAt: z.number(),
  title: z.string(),
  body: z.string(),
  sentenceId: z.string().exactOptional(),
  itemId: itemIdSchema.exactOptional(),
});

const plan = z.object({
  id: z.string(),
  createdAt: z.number(),
  letter: z.array(z.string()),
  lines: z.array(z.object({ when: z.string(), what: z.string() })),
  mix: z.object({
    dailyMinutes: z.number(),
    focusErrorTypes: z.partialRecord(errorType, z.number()),
    grammarIds: z.array(z.string()),
    drillShare: z.number(),
  }),
  status: z.enum(['proposed', 'accepted']),
});

const aiLog = z.object({
  id: z.number().exactOptional(),
  at: z.number(),
  task: z.string(),
  model: z.string(),
  cached: z.boolean(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedTokens: z.number().exactOptional(),
  ok: z.boolean(),
});

/** One section of a unit lesson (S3): its parts and how many are done. */
const sectionProgress = z.object({
  parts: z.number(),
  done: z.number(),
  at: z.number().exactOptional(),
});

/** Progress of one thematic unit (T3), with its lesson sections (S3). */
const unitProgress = z.object({
  introducedAt: z.number().exactOptional(),
  readAt: z.number().exactOptional(),
  doneAt: z.number().exactOptional(),
  skippedAt: z.number().exactOptional(),
  sections: z
    .partialRecord(z.enum(['words', 'grammar', 'practice', 'reading', 'review']), sectionProgress)
    .exactOptional(),
});

/** Settings in a backup never include the API key (N3). */
const settings = z.object({
  modelId: z.string(),
  teacherModelId: z.string().exactOptional(),
  uiLanguage: z.string().exactOptional(),
  furigana: z.enum(['new', 'all']),
  theme: z.enum(['system', 'light', 'dark']),
  currentLesson: z.string().exactOptional(),
  lastBackupAt: z.number().exactOptional(),
  backupReminderSnoozedUntil: z.number().exactOptional(),
  packVersion: z.string().exactOptional(),
  packLanguages: z.array(z.string()).exactOptional(),
  learnerLevel: z.union([z.literal(5), z.literal(4), z.literal(3)]).exactOptional(),
  unitStatus: z.record(z.string(), unitProgress).exactOptional(),
  activeUnit: z.string().exactOptional(),
  levelUpSnoozedUntil: z.number().exactOptional(),
  installBannerClosed: z.boolean().exactOptional(),
  onboarded: z.boolean(),
  onboardingStep: z.string().exactOptional(),
  onboardingKnown: z
    .object({
      marked: z
        .object({ words: z.number(), already: z.number(), missing: z.number() })
        .exactOptional(),
      pending: z.array(z.enum(['n5', 'n4'])),
    })
    .exactOptional(),
  sound: z.boolean().exactOptional(),
  soundVolume: z.number().min(0).max(1).exactOptional(),
  listening: z.boolean().exactOptional(),
  sessionMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).exactOptional(),
  explainFirst: z.boolean().exactOptional(),
  tutor: z.enum(['on-ask', 'auto-mistakes']).exactOptional(),
  immersion: z.enum(['auto', 'native', 'mixed', 'japanese']).exactOptional(),
  practice: z.enum(['mix', 'lesson', 'reading', 'grammar', 'kanji']).exactOptional(),
});

/**
 * The app id written into backups. Files from before the rename (B1) say `kanji-reader`
 * and still import.
 */
export const BACKUP_APP = 'kanji-tutor';

/** One-file backup of all user data (K7). Dictionary packs and the AI cache are not included. */
export const backupSchema = z.object({
  app: z.enum([BACKUP_APP, 'kanji-reader']),
  version: z.literal(1),
  exportedAt: z.number(),
  data: z.object({
    items: z.array(item),
    kanjiReadings: z.array(kanjiReading),
    reviews: z.array(review),
    sentences: z.array(sentence),
    grammar: z.array(grammar),
    captures: z.array(capture),
    notes: z.array(note),
    plans: z.array(plan),
    aiLog: z.array(aiLog),
    settings,
  }),
});

export type BackupFile = z.infer<typeof backupSchema>;
