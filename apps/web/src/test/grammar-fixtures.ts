/** Sentences and repos for the grammar page tests. */
import { itemId } from '../domain/ids.ts';
import type { Repos } from '../domain/repos.ts';
import type { Sentence, Token } from '../domain/types.ts';
import { createMemoryRepos } from './memory-repos.ts';

type Part = [surface: string, pos: string, base?: string];

function sentence(id: string, parts: readonly Part[], extra: Partial<Sentence>): Sentence {
  let at = 0;
  const tokens: Token[] = parts.map(([surface, pos, base]) => {
    const token = { surface, reading: surface, base: base ?? surface, pos, start: at };
    at += surface.length;
    return token;
  });
  const text = parts.map(([surface]) => surface).join('');
  return { id, text, tokens, source: 'tatoeba', wordIds: [], verified: true, ...extra };
}

/** 写真を撮ってもいいですか。: てもいい at tokens 3–5. */
export const PHOTO = sentence(
  'tatoeba:1',
  [
    ['写真', 'noun'],
    ['を', 'particle'],
    ['撮っ', 'verb', '撮る'],
    ['て', 'particle'],
    ['も', 'particle'],
    ['いい', 'adjective'],
    ['です', 'auxiliary'],
    ['か', 'particle'],
    ['。', 'symbol'],
  ],
  {
    grammarIds: ['te-mo-ii'],
    level: 5,
    translation: 'May I take a photo?',
    translations: { fr: 'Puis-je prendre une photo ?' },
  },
);

/** 座ってもいい。: an N5 sentence with only an English translation. */
export const SIT = sentence(
  'tatoeba:2',
  [
    ['座っ', 'verb', '座る'],
    ['て', 'particle'],
    ['も', 'particle'],
    ['いい', 'adjective'],
    ['。', 'symbol'],
  ],
  { grammarIds: ['te-mo-ii'], level: 5, translation: 'You may sit.' },
);

/** 雨かもしれない。: an N4 sentence, above an N5 learner. */
export const RAIN = sentence(
  'tatoeba:3',
  [
    ['雨', 'noun'],
    ['かも', 'particle'],
    ['しれ', 'verb', 'しれる'],
    ['ない', 'auxiliary'],
    ['。', 'symbol'],
  ],
  { grammarIds: ['kamoshirenai'], level: 4, translation: 'It might rain.' },
);

/** Memory repos with the sentences; `level` tracks te-mo-ii at that knowledge level. */
export async function grammarRepos(options: { level?: 0 | 1 | 2 | 3 | 4; lang?: string } = {}) {
  const repos: Repos = createMemoryRepos();
  await repos.sentences.putMany([PHOTO, SIT, RAIN]);
  if (options.lang) await repos.settings.patch({ uiLanguage: options.lang });
  if (options.level !== undefined) {
    const id = itemId('grammar', 'te-mo-ii');
    const at = Date.parse('2026-10-12T09:00:00Z');
    await repos.items.put({
      id,
      kind: 'grammar',
      ref: 'te-mo-ii',
      level: options.level,
      source: { kind: 'session', week: '2026-W42', addedAt: at },
      updatedAt: at,
    });
    await repos.reviews.add({
      at,
      itemId: id,
      answer: 'てもいい',
      expected: 'てもいい',
      verdict: 'correct',
      durationMs: 1000,
      mode: 'drill',
    });
  }
  return repos;
}
