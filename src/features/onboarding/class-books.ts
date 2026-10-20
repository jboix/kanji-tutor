/**
 * Your class (K5, D134): a few common textbooks as chips, None, or another course typed in, and
 * the lesson as a number. Saved as the current lesson tag, "Tobira 第4課".
 */
export const BOOKS = [
  { id: 'minna', name: 'Minna no Nihongo' },
  { id: 'genki', name: 'Genki' },
  { id: 'tobira', name: 'Tobira' },
  { id: 'quartet', name: 'Quartet' },
] as const;

export type BookId = 'none' | (typeof BOOKS)[number]['id'] | 'other';

/** Lesson numbers run 1 to 50, as Minna I and II do. */
export const LAST_LESSON = 50;

/** The chip a saved textbook name stands for: one of the books, None, or another course. */
export function bookOf(textbook: string): BookId {
  const name = textbook.trim().toLowerCase();
  if (!name) return 'none';
  const book = BOOKS.find((b) => b.name.toLowerCase() === name || b.id === name);
  return book ? book.id : 'other';
}

/** The textbook name to save: the book's own name, or the typed one for another course. */
export function bookName(book: BookId, typed: string): string {
  if (book === 'none') return '';
  if (book === 'other') return typed.trim();
  return BOOKS.find((b) => b.id === book)?.name ?? '';
}

/** "第12課" → 12; anything else is lesson 1. */
export function lessonNumberOf(lesson: string): number {
  const n = Number.parseInt(lesson.replace(/\D+/g, ''), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, LAST_LESSON) : 1;
}

export const lessonTag = (n: number) => `第${n}課`;
