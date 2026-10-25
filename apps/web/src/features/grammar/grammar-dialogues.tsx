/**
 * A grammar point's dialogues beside what the intro card and the page already show: one
 * conversation under the introduction, all of them on the page with a link to compare with a
 * point easy to confuse. Static content written for the app: no AI. Nothing shows for a point
 * without dialogues, or while they load.
 */
import { Link } from 'react-router';
import type { Dialogue } from '../../domain/dialogues/index.ts';
import { DialogueLines, PlayDialogue, RegisterLabel } from '../../ui/dialogue.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useDialogues } from '../../ui/use-dialogues.ts';
import styles from './grammar.module.css';
import { entryById } from './grammar-data.ts';

const spoken = (dialogue: Dialogue) => dialogue.lines.map((line) => line.ja);

/** "In a conversation" on the intro card: the point's first dialogue, its lines to tap. */
export function IntroDialogue({ grammarId }: { grammarId: string }) {
  const t = useT();
  const dialogue = useDialogues(grammarId)?.dialogues[0];
  if (!dialogue) return null;
  const label = t('dialogues.introLabel');
  return (
    <section className={styles.section} aria-label={label}>
      <div className={styles.dialogueHead}>
        <SectionLabel>{label}</SectionLabel>
        <PlayDialogue lines={spoken(dialogue)} />
      </div>
      <DialogueLines dialogue={dialogue} />
    </section>
  );
}

/** One dialogue on the page: where and how it is said, Play, and its lines. */
function DialogueCard({ dialogue }: { dialogue: Dialogue }) {
  return (
    <article className={styles.dialogue}>
      <div className={styles.dialogueHead}>
        <RegisterLabel dialogue={dialogue} />
        <PlayDialogue lines={spoken(dialogue)} />
      </div>
      <DialogueLines dialogue={dialogue} />
    </article>
  );
}

/** "Compare with 〜ことにする", when the data names a point easy to confuse with this one. */
function Compare({ id }: { id: string | undefined }) {
  const { rich } = useI18n();
  const other = id ? entryById(id) : undefined;
  if (!other) return null;
  return (
    <Link to={paths.grammar(other.id)} className={styles.link}>
      {rich('dialogues.compare', { pattern: <Ja>{other.pattern}</Ja> })}
    </Link>
  );
}

/** "In conversation" on the grammar page: every dialogue of the point as a card. */
export function PageDialogues({ grammarId }: { grammarId: string }) {
  const t = useT();
  const set = useDialogues(grammarId);
  if (!set || set.dialogues.length === 0) return null;
  const label = t('dialogues.pageLabel');
  return (
    <section className={styles.section} aria-label={label}>
      <SectionLabel as="h2">{label}</SectionLabel>
      {set.dialogues.map((dialogue) => (
        <DialogueCard key={dialogue.id} dialogue={dialogue} />
      ))}
      <Compare id={set.compare} />
    </section>
  );
}
