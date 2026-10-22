import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { isoWeek } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { KnowledgeLevel, Sentence, Token, Word } from '../types.ts';
import { addCaptureItems, captureSentenceId, exerciseFromLine, grammarIdOf } from './capture.ts';
import { analyseCapture, citedPhrases, readiness, unknownIndices } from './capture-analysis.ts';
import {
  CAPTURE_LINES,
  captureDictionary,
  fixtureTokenize,
  CAPTURE_WORDS as W,
} from './capture-fixtures.ts';
import { newWordItem } from './items.ts';
import { buildSession } from './session.ts';

const NOW = Date.parse('2026-10-15T10:00:00Z'); // a Thursday
const LATER = Date.parse('2026-10-20T10:00:00Z'); // the next week

function repos(): Repos {
  return createMemoryRepos({ dictionary: captureDictionary(), settings: { learnerLevel: 3 } });
}

async function know(r: Repos, ids: string[], level: KnowledgeLevel = 3) {
  await r.items.putMany(
    ids.map((wordId) => newWordItem({ wordId, kind: 'import', now: 0, level })),
  );
}

const BASICS = [W.nihon.id, W.wakai.id, W.hito.id, W.hanasu.id, W.ooi.id];
const draft = { id: 'cap1', createdAt: NOW, lines: CAPTURE_LINES };

/** A stored sentence "<form>だ。" whose only content word is the given one. */
function tatoeba(id: string, entry: Word): Sentence {
  const form = entry.forms[0] ?? '';
  const reading = entry.readings[0] ?? '';
  const tokens: Token[] = [
    { surface: form, reading, base: form, pos: 'noun', start: 0, wordId: entry.id },
    { surface: 'だ', reading: 'だ', base: 'だ', pos: 'auxiliary', start: form.length },
    { surface: '。', reading: '。', base: '。', pos: 'symbol', start: form.length + 1 },
  ];
  const text = `${form}だ。`;
  return { id, text, source: 'tatoeba', tokens, wordIds: [entry.id], level: 3, verified: true };
}

describe('readiness', () => {
  it('counts kanji content tokens only, known from level 3', () => {
    const levels = new Map<string, KnowledgeLevel>([
      [W.hougen.id, 3],
      [W.hanasu.id, 4],
      [W.hito.id, 2],
    ]);
    const line3 = CAPTURE_LINES[2]?.tokens ?? [];
    // 方言 話す 人 減っ count; しかし, いる, わけ (kana) and particles do not.
    expect(readiness(line3, levels)).toEqual({ known: 2, total: 4, ratio: 0.5 });
    expect(unknownIndices(line3, levels).map((i) => line3[i]?.surface)).toEqual(['人', '減っ']);
  });

  it('treats a text without kanji words as fully readable', () => {
    expect(readiness([], new Map())).toEqual({ known: 0, total: 0, ratio: 1 });
  });

  it('counts unresolved kanji tokens as unknown', () => {
    const tokens = [{ surface: '謎', reading: 'なぞ', base: '謎', pos: 'noun', start: 0 }];
    expect(readiness(tokens, new Map()).ratio).toBe(0);
  });
});

describe('analyseCapture', () => {
  it('proposes untracked unknown words with dictionary readings, in text order', async () => {
    const r = repos();
    await know(r, BASICS);
    await know(r, [W.eikyou.id], 1);
    const analysis = await analyseCapture(r, CAPTURE_LINES);
    expect(analysis.readiness).toEqual({ known: 7, total: 14, ratio: 0.5 });
    expect(analysis.words.map((w) => w.text)).toEqual(['地域', '様々', '方言', '標準語', '減る']);
    expect(analysis.words.find((w) => w.text === '減る')).toEqual({
      wordId: W.heru.id,
      text: '減る',
      reading: 'へる',
      gloss: 'to decrease',
    });
    expect(analysis.lines[1]?.unknown).toEqual([2, 8]);
  });

  it('carries the first gloss of each installed language (N9)', async () => {
    const heru = { ...W.heru, glossesByLang: { fr: ['diminuer'], es: [] } };
    const r = createMemoryRepos({ dictionary: captureDictionary([W.nihon, heru]) });
    const analysis = await analyseCapture(r, CAPTURE_LINES);
    expect(analysis.words.find((w) => w.text === '減る')?.glossByLang).toEqual({ fr: 'diminuer' });
  });

  it('skips words missing from the dictionary', async () => {
    const r = createMemoryRepos({ dictionary: captureDictionary([W.nihon]) });
    const analysis = await analyseCapture(r, CAPTURE_LINES.slice(0, 1));
    expect(analysis.words.map((w) => w.text)).toEqual(['日本']);
  });
});

describe('citedPhrases', () => {
  it('finds kana phrases an explanation quotes from the line', () => {
    const line = CAPTURE_LINES[2]?.text ?? '';
    const answer = "That's the job わけではない does; 方言 means dialect, and 〜ている is ongoing.";
    expect(citedPhrases(answer, line)).toEqual(['わけではない', 'ている']);
    expect(citedPhrases('間に marks a point in time.', line)).toEqual([]);
  });
});

describe('addCaptureItems', () => {
  it('adds ticked words and grammar with the capture source, lesson and week', async () => {
    const r = repos();
    const { capture, created } = await addCaptureItems(r, {
      capture: { ...draft, photo: new Blob(['jpeg'], { type: 'image/jpeg' }) },
      words: [W.hougen.id, W.heru.id, W.hougen.id],
      grammar: [{ pattern: '〜わけではない', meaning: "it isn't that" }],
      lesson: ' Tobira 第4課 ',
      now: LATER,
    });
    expect(created).toEqual([`word:${W.hougen.id}`, `word:${W.heru.id}`, 'grammar:わけではない']);
    const item = await r.items.get(`word:${W.hougen.id}`);
    expect(item?.source).toEqual({
      kind: 'capture',
      captureId: 'cap1',
      lesson: 'Tobira 第4課',
      week: isoWeek(new Date(NOW)),
      addedAt: LATER,
    });
    expect(item?.level).toBe(0);
    expect(item?.card?.due).toBe(LATER);
    const grammarItem = await r.items.get('grammar:わけではない');
    expect(grammarItem?.source.captureId).toBe('cap1');
    expect(await r.grammar.get('わけではない')).toEqual({
      id: 'わけではない',
      pattern: '〜わけではない',
      meaning: "it isn't that",
      lesson: 'Tobira 第4課',
      exampleSentenceIds: [captureSentenceId('cap1', 2)],
    });
    expect(capture.lesson).toBe('Tobira 第4課');
    expect(capture.week).toBe('2026-W42');
    expect(capture.addedItemIds).toEqual(created);
  });

  it('saves every line as a verified capture sentence and keeps the capture', async () => {
    const r = repos();
    await addCaptureItems(r, {
      capture: draft,
      words: [],
      grammar: [{ pattern: 'わけではない' }],
      now: NOW,
    });
    const sentences = await r.sentences.bySource('capture');
    expect(sentences).toHaveLength(3);
    const third = await r.sentences.get(captureSentenceId('cap1', 2));
    expect(third).toMatchObject({
      text: 'しかし、方言を話す人が減っているわけではない。',
      source: 'capture',
      sourceRef: 'cap1',
      verified: true,
      grammarIds: ['わけではない'],
    });
    expect(third?.wordIds).toEqual([W.hougen.id, W.hanasu.id, W.hito.id, W.heru.id]);
    expect((await r.sentences.containingWord(W.heru.id)).map((s) => s.id)).toEqual([third?.id]);
    const capture = await r.captures.get('cap1');
    expect(capture?.lines).toEqual(CAPTURE_LINES.map((l) => l.text));
    expect(capture?.sentenceIds).toEqual([0, 1, 2].map((i) => captureSentenceId('cap1', i)));
    expect(capture?.lesson).toBeUndefined();
    expect((await r.items.get('grammar:わけではない'))?.source.lesson).toBeUndefined();
  });

  it('is idempotent and leaves existing items alone', async () => {
    const r = repos();
    await know(r, [W.hito.id]);
    const input = {
      capture: draft,
      words: [W.hougen.id, W.hito.id],
      grammar: [{ pattern: '〜わけではない' }, { pattern: ' 〜 ' }],
      lesson: 'Tobira 第4課',
      now: NOW,
    };
    const first = await addCaptureItems(r, input);
    const items = await r.items.all();
    const second = await addCaptureItems(r, { ...input, now: LATER });
    expect(first.created).toEqual([`word:${W.hougen.id}`, 'grammar:わけではない']);
    expect(second.created).toEqual([]);
    expect(await r.items.all()).toEqual(items);
    expect(second.capture.addedItemIds).toEqual(first.created);
    expect(await r.captures.count()).toBe(1);
    expect(await r.sentences.count()).toBe(3);
    expect((await r.items.get(`word:${W.hito.id}`))?.source.kind).toBe('import');
    expect((await r.grammar.get('わけではない'))?.exampleSentenceIds).toHaveLength(1);
  });

  it('builds grammar ids from patterns', () => {
    expect(grammarIdOf('〜わけではない')).toBe('わけではない');
    expect(grammarIdOf('~ことが多い ')).toBe('ことが多い');
  });
});

describe('exerciseFromLine', () => {
  it('says the line is in the next session when it passes i+1', async () => {
    const r = repos();
    await know(r, BASICS);
    const words = [W.hougen.id, W.heru.id];
    const outcome = await exerciseFromLine(r, { capture: draft, line: 2, words, now: NOW });
    expect(outcome).toBe('next-session');
    expect((await r.items.get(`word:${W.heru.id}`))?.source.kind).toBe('capture');
  });

  it('serves the line first in the next session, over other sentences and due words', async () => {
    const r = repos();
    await know(r, BASICS);
    // Competition: a due known word with a sentence of its own, and another 方言 sentence.
    await r.sentences.putMany([tatoeba('t-nihon', W.nihon), tatoeba('t-hougen', W.hougen)]);
    const words = [W.hougen.id, W.heru.id];
    expect(await exerciseFromLine(r, { capture: draft, line: 2, words, now: NOW })).toBe(
      'next-session',
    );
    const [card] = await buildSession(r, { now: LATER, size: 1 });
    expect(card?.sentence.id).toBe(captureSentenceId('cap1', 2));
    expect(card?.targets.map((t) => t.surface)).toEqual(['方言', '減っ']);
  });

  it('drops the priority once the line was shown, and says so when turned again', async () => {
    const r = repos();
    await know(r, BASICS);
    await r.sentences.put(tatoeba('t-nihon', W.nihon));
    const input = { capture: draft, line: 2, words: [W.hougen.id, W.heru.id], now: NOW };
    await exerciseFromLine(r, input);
    await r.reviews.add({
      at: NOW,
      itemId: `word:${W.hougen.id}`,
      sentenceId: captureSentenceId('cap1', 2),
      answer: 'ほうげん',
      expected: 'ほうげん',
      verdict: 'correct',
      durationMs: 3000,
      mode: 'typed',
    });
    expect(await exerciseFromLine(r, input)).toBe('not-next');
    const [card] = await buildSession(r, { now: LATER, size: 1 });
    expect(card?.sentence.id).toBe('t-nihon');
  });

  it('is honest when the line has too many new words or none', async () => {
    const r = repos();
    const line1 = { capture: draft, line: 1, words: [W.eikyou.id], now: NOW, lesson: 'L4' };
    expect(await exerciseFromLine(r, line1)).toBe('too-many-new');
    await know(r, [W.hougen.id, W.hanasu.id, W.hito.id, W.heru.id]);
    const line2 = { capture: draft, line: 2, words: [], now: NOW };
    expect(await exerciseFromLine(r, line2)).toBe('all-known');
    expect(await exerciseFromLine(r, { ...line2, line: 9 })).toBe('too-many-new');
  });

  it('tokenizes fixture lines and falls back for other text', async () => {
    expect(await fixtureTokenize(CAPTURE_LINES[0]?.text ?? '')).toHaveLength(11);
    expect(await fixtureTokenize('他')).toEqual([
      { surface: '他', reading: '', base: '他', pos: 'noun', start: 0 },
    ]);
  });
});
