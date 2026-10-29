/** All fr messages, one namespace per file. */
import type { Messages } from '../../types.ts';
import { account } from './account.ts';
import { ai } from './ai.ts';
import { capture } from './capture.ts';
import { common } from './common.ts';
import { compose } from './compose.ts';
import { dialogues } from './dialogues.ts';
import { drills } from './drills.ts';
import { exercises } from './exercises.ts';
import { explain } from './explain.ts';
import { grammar } from './grammar.ts';
import { grammarFamily } from './grammar-family.ts';
import { guides } from './guides.ts';
import { handwrite } from './handwrite.ts';
import { importScreen } from './import-screen.ts';
import { kanji } from './kanji.ts';
import { knownImport } from './known-import.ts';
import { learn } from './learn.ts';
import { learned } from './learned.ts';
import { notes } from './notes.ts';
import { onboarding } from './onboarding.ts';
import { placement } from './placement.ts';
import { plan } from './plan.ts';
import { questions } from './questions.ts';
import { read } from './read.ts';
import { readSession } from './read-session.ts';
import { sessionEnd } from './session-end.ts';
import { settings } from './settings.ts';
import { settingsAi } from './settings-ai.ts';
import { teach } from './teach.ts';
import { today } from './today.ts';
import { tutor } from './tutor.ts';
import { ui } from './ui.ts';
import { units } from './units.ts';
import { voice } from './voice.ts';
import { wild } from './wild.ts';

export const fr = {
  common,
  account,
  ai,
  ui,
  read,
  readSession,
  sessionEnd,
  questions,
  drills,
  dialogues,
  exercises,
  voice,
  wild,
  settings,
  settingsAi,
  explain,
  teach,
  onboarding,
  importScreen,
  knownImport,
  today,
  learn,
  tutor,
  learned,
  capture,
  handwrite,
  grammar,
  grammarFamily,
  guides,
  kanji,
  units,
  placement,
  notes,
  plan,
  compose,
} satisfies Messages;
