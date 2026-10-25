/** Where Start's round plays (IA3): the session's link for a plan from `startPlan`. */
import type { StartPlan } from '../domain/services/start-plan.ts';
import { paths } from './paths.ts';

const query = (params: Record<string, string>) =>
  `${paths.read}?${new URLSearchParams(params).toString()}`;

/** The session link for a plan: the plain session, a lesson part, reading, grammar or kanji. */
export function startPath(plan: StartPlan): string {
  switch (plan.kind) {
    case 'lesson':
      return paths.lessonPart(plan.unit, plan.section, plan.part);
    case 'reading':
      return query({ only: 'reading' });
    case 'grammar':
      return plan.grammar ? query({ grammar: plan.grammar }) : query({ drills: '1' });
    case 'kanji':
      return query({ cards: 'kanji' });
    default:
      return paths.read;
  }
}
