import { useCallback, useEffect, useState } from 'react';
import type { Note } from '../../domain/types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { SectionHeader } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import { TutorMark } from '../../ui/tutor-mark.tsx';
import { JaRuns } from './ja-runs.tsx';
import styles from './notes.module.css';
import { keptOn } from './notes-copy.ts';

function useKeptNotes() {
  const { repos } = useServices();
  const [notes, setNotes] = useState<Note[]>();
  const load = useCallback(async () => {
    const all = await repos.notes.all();
    setNotes(all.sort((a, b) => b.createdAt - a.createdAt));
  }, [repos]);
  useEffect(() => {
    void load();
  }, [load]);
  const remove = async (id: string) => {
    await repos.notes.delete(id);
    await load();
  };
  return { notes, remove };
}

function DeleteControl({ title, onDelete }: { title: string; onDelete: () => void }) {
  const [asking, setAsking] = useState(false);
  const t = useT();
  if (!asking) {
    return (
      <button
        type="button"
        className={styles.textButton}
        aria-label={t('notes.deleteNamed', { title })}
        onClick={() => setAsking(true)}
      >
        {t('notes.delete')}
      </button>
    );
  }
  return (
    <span className={styles.ask}>
      <span>{t('notes.deleteAsk')}</span>
      <button type="button" className={styles.textButton} onClick={onDelete}>
        {t('notes.delete')}
      </button>
      <button type="button" className={styles.textButton} onClick={() => setAsking(false)}>
        {t('notes.keep')}
      </button>
    </span>
  );
}

const TUTOR_WROTE = { source: 'ai' } as const;

function NoteRow({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const { t, format } = useI18n();
  return (
    <li className={styles.note}>
      <h3 className={styles.noteTitle}>
        <JaRuns text={note.title} />
      </h3>
      <p className={styles.noteBody}>
        <JaRuns text={note.body} />
      </p>
      {/* "Keep in my notes" sits only under the tutor's answers: every kept note is its text. */}
      <TutorMark of={TUTOR_WROTE} />
      <div className={styles.noteMeta}>
        <span>{keptOn(t, format, note.createdAt)}</span>
        <DeleteControl title={note.title} onDelete={onDelete} />
      </div>
    </li>
  );
}

/** Explanations kept with "Keep in my notes" (A3), newest first. */
export function KeptNotes() {
  const { notes, remove } = useKeptNotes();
  const t = useT();
  if (notes === undefined) return null;
  return (
    <section className={styles.kept} aria-label={t('notes.keptNotes')}>
      <SectionHeader
        title={t('notes.keptNotes')}
        meta={notes.length > 0 ? notes.length : undefined}
      />
      {notes.length === 0 ? (
        <p className={styles.why}>{t('notes.keptEmpty')}</p>
      ) : (
        <ul className={styles.notes}>
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} onDelete={() => void remove(note.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}
