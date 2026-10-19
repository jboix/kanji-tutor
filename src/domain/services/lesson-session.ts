/**
 * One part of a unit lesson's section as a session (S3, `/read?unit=…&section=…&part=…`). 練習
 * is the unit's practice session without its passage, 読み物 the passage and its questions, and
 * 言葉, 文法 and まとめ are built by `unit-lesson.ts` and cut into parts of about five minutes
 * (L6). Building a part opens the unit and keeps the section's part count.
 */
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { LessonSection } from '../types.ts';
import { sectionParts } from './lesson-sections.ts';
import { grammarSection, lessonData, reviewSection, wordsSection } from './unit-lesson.ts';
import { startLessonSection } from './units.ts';

export interface LessonPartInput {
  unit: string;
  section: LessonSection;
  /** 1-based; past the last part, the last. */
  part?: number | undefined;
  now: number;
  listening: boolean;
}

/** The sessions 練習 and 読み物 are, built by the session builder. */
export interface LessonSessions {
  practice: () => Promise<SessionCard[]>;
  reading: () => Promise<SessionCard[]>;
}

async function builtCards(repos: Repos, input: LessonPartInput): Promise<SessionCard[]> {
  const data = await lessonData(repos, input.unit, input);
  if (!data) return [];
  const words = wordsSection(data);
  if (input.section === 'words') return words;
  const grammar = await grammarSection(data);
  return input.section === 'grammar' ? grammar : reviewSection(data, [...words, ...grammar]);
}

async function sectionCards(repos: Repos, input: LessonPartInput, sessions: LessonSessions) {
  if (input.section === 'practice') return [await sessions.practice()];
  if (input.section === 'reading') return [await sessions.reading()];
  return sectionParts(await builtCards(repos, input));
}

/** The cards of one part of a section; empty when the packs lack the unit. */
export async function buildLessonPart(
  repos: Repos,
  input: LessonPartInput,
  sessions: LessonSessions,
): Promise<SessionCard[]> {
  const parts = (await sectionCards(repos, input, sessions)).filter((p) => p.length > 0);
  if (parts.length === 0) return [];
  await startLessonSection(repos, input.unit, input.section, parts.length, input.now);
  const at = Math.min(Math.max(input.part ?? 1, 1), parts.length);
  return parts[at - 1] ?? [];
}
