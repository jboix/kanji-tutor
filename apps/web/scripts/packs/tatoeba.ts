/**
 * Tatoeba per-language exports: `id \t lang \t text` sentences and `jpn_id \t other_id` links,
 * plus the owners, members' languages and audio that tell which sentences to prefer.
 */

export interface Pair {
  id: string;
  text: string;
  translation: string;
}

/** Sentence id → text. With `only`, keeps just those ids (the big fra/spa exports). */
export function parseSentences(tsv: string, only?: ReadonlySet<string>): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of tsv.split('\n')) {
    const [id, , text] = line.split('\t');
    if (id && text && (!only || only.has(id))) out.set(id, text.trim());
  }
  return out;
}

/** Japanese id → lowest linked id that `known` has, so the choice is deterministic. */
function lowestLinks(linksTsv: string, accept: (jpnId: string, otherId: string) => boolean) {
  const best = new Map<string, string>();
  for (const line of linksTsv.split('\n')) {
    const [jpnId, rawOther] = line.split('\t');
    const otherId = rawOther?.trim();
    if (!jpnId || !otherId || !accept(jpnId, otherId)) continue;
    const current = best.get(jpnId);
    if (!current || Number(otherId) < Number(current)) best.set(jpnId, otherId);
  }
  return best;
}

/**
 * Japanese sentences with their English translation. When a sentence has several, the one with
 * the lowest Tatoeba id is used, so the choice is deterministic.
 */
export function pairSentences(jpnTsv: string, engTsv: string, linksTsv: string): Pair[] {
  const jpn = parseSentences(jpnTsv);
  const eng = parseSentences(engTsv);
  const best = lowestLinks(linksTsv, (j, e) => jpn.has(j) && eng.has(e));
  return [...best]
    .map(([id, engId]) => ({ id, text: jpn.get(id) ?? '', translation: eng.get(engId) ?? '' }))
    .sort((a, b) => Number(a.id) - Number(b.id));
}

/**
 * Translations into another language for the Japanese sentence ids in `jpnIds`: the lowest-id
 * directly linked sentence, as for English.
 */
export function translationsFor(
  jpnIds: ReadonlySet<string>,
  otherTsv: string,
  linksTsv: string,
): Map<string, string> {
  const wanted = lowestLinks(linksTsv, (j) => jpnIds.has(j));
  const texts = parseSentences(otherTsv, new Set(wanted.values()));
  const out = new Map<string, string>();
  for (const [jpnId, otherId] of wanted) {
    const text = texts.get(otherId);
    if (text) out.set(jpnId, text);
  }
  return out;
}

/** Skill level a Tatoeba member gives for a native language (`user_languages`, 0–5). */
const NATIVE_SKILL = '5';
const NO_VALUE = '\\N';

/** Usernames who rate their Japanese at the native level: `lang \t skill \t username \t …`. */
export function nativeSpeakers(userLanguagesTsv: string): Set<string> {
  const out = new Set<string>();
  for (const line of userLanguagesTsv.split('\n')) {
    const [lang, skill, username] = line.split('\t');
    if (lang === 'jpn' && skill === NATIVE_SKILL && username && username !== NO_VALUE) {
      out.add(username);
    }
  }
  return out;
}

/**
 * Japanese sentence ids that a native speaker owns (`jpn_sentences_detailed`:
 * `id \t lang \t text \t username \t …`) or that have audio (`jpn_sentences_with_audio`:
 * `id \t audio id \t …`). Unowned sentences count as neither.
 */
export function preferredIds(
  detailedTsv: string,
  userLanguagesTsv: string,
  audioTsv: string,
): Set<string> {
  const natives = nativeSpeakers(userLanguagesTsv);
  const out = new Set<string>();
  for (const line of audioTsv.split('\n')) {
    const id = line.split('\t')[0]?.trim();
    if (id) out.add(id);
  }
  for (const line of detailedTsv.split('\n')) {
    const [id, , , username] = line.split('\t');
    if (id && username && natives.has(username)) out.add(id);
  }
  return out;
}
