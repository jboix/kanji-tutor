/** Scanned lessons in a backup file, with page photos as data URLs; and older files' captures. */
import { z } from 'zod';

const itemKind = z.enum(['word', 'kanji', 'kanjiReading', 'grammar']);
const itemIdSchema = z.templateLiteral([itemKind, ':', z.string()]);
const photo = z.string().startsWith('data:');

const reading = z.object({ surface: z.string(), reading: z.string(), verified: z.boolean() });

const page = z.object({
  photo: photo.exactOptional(),
  kind: z.enum(['kanji-list', 'word-list', 'grammar', 'reading', 'handout', 'mixed']),
  lines: z.array(z.object({ text: z.string(), verified: z.boolean(), sentenceId: z.string() })),
  read: z.literal(true).exactOptional(),
});

const item = z.object({
  kind: z.enum(['kanji', 'word', 'grammar']),
  text: z.string(),
  ref: z.string().exactOptional(),
  page: z.number(),
  from: z.enum(['tutor', 'text']),
  meaning: z.string().exactOptional(),
  reading: reading.exactOptional(),
});

const question = z.object({
  id: z.string(),
  page: z.number(),
  number: z.string().exactOptional(),
  type: z.enum(['choose-form', 'particle', 'reading', 'write-kanji', 'reorder', 'free']),
  instruction: z.string().exactOptional(),
  stem: z.string(),
  target: z.string().exactOptional(),
  choices: z.array(z.string()),
  answer: z.string(),
  answerVerified: z.boolean(),
  explanation: z.string(),
  readings: z.array(reading),
  practises: z.array(z.string()),
});

/** A scanned lesson as a backup holds it. */
export const scanSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  title: z.string(),
  suggestedTitle: z.string(),
  week: z.string(),
  lesson: z.string().exactOptional(),
  pages: z.array(page),
  items: z.array(item),
  questions: z.array(question),
  practised: z.record(z.string(), z.number()),
  addedItemIds: z.array(itemIdSchema).exactOptional(),
  unmatched: z.literal(true).exactOptional(),
  matchVersion: z.number().exactOptional(),
});

/** A capture from a backup made before scanned lessons; imported as a scanned lesson. */
export const legacyCaptureSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  photo: photo.exactOptional(),
  lines: z.array(z.string()),
  lesson: z.string().exactOptional(),
  week: z.string(),
  addedItemIds: z.array(itemIdSchema),
  sentenceIds: z.array(z.string()),
});
