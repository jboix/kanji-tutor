/** English messages: the import page (K6, D14). */
export const importScreen = {
  heading: 'Mark what you already know',
  intro:
    'Words you mark start as read in familiar words, so sessions can pick sentences where only one or two words are new. Words written only in kana, like {example}, are skipped. You can apply a list again at any time: words you know keep their progress and nothing is added twice.',
  import: 'Import',
  finding: 'Finding the words…',
  marking: 'Marking {done} of {total}',
  marked: { one: '{n} word marked as known', other: '{n} words marked as known' },
  added: { one: '{n} word added as new', other: '{n} words added as new' },
  toLesson: 'to {lesson}',
  notFound: { one: '; {n} line not found:', other: '; {n} lines not found:' },
  already: { one: '{n} word was already known.', other: '{n} words were already known.' },
  tracked: {
    one: '{n} word was already tracked and kept as it was.',
    other: '{n} words were already tracked and kept as they were.',
  },
  backToToday: 'Back to Home',
  markMore: 'Mark more',
  failed: 'The import did not finish. Nothing you already had was lost; try again.',
} as const;
