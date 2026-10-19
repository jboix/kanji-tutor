/** The sections of a unit lesson (S3): 言葉, 文法, 練習, 読み物, まとめ. */
export type LessonSection = 'words' | 'grammar' | 'practice' | 'reading' | 'review';

/** One section's progress: its parts of about five minutes, how many are done, and when. */
export interface SectionProgress {
  parts: number;
  done: number;
  /** When a part was last finished. */
  at?: number;
}
