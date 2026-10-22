/** Tatoeba per-language exports: `id \t lang \t text` sentences and `jpn_id \t other_id` links. */

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
