import { describe, expect, it } from 'vitest';
import { knowBasics, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import type { Token } from '../types.ts';
import { aiSentenceId, knownWordSample, saveAiSentences } from './ai-sentences.ts';

/** A tokenizer over the fixture sentences: returns their hand-made tokens by text. */
const FIXTURE_TOKENS = new Map<string, Token[]>(
  Object.values(S).map((sentence) => [sentence.text, sentence.tokens]),
);
const tokenize = async (text: string) => FIXTURE_TOKENS.get(text) ?? [];

const PLAIN = { text: S.waitPlain.text, translation: 'I wait for a friend at the station.' };
const STUDENT = { text: S.student.text, translation: 'A student reads a book.' };

async function repos() {
  const r = await readingRepos();
  await r.sentences.delete(S.waitPlain.id);
  await r.sentences.delete(S.student.id);
  await knowBasics(r);
  return r;
}

describe('saveAiSentences', () => {
  it('stores i+1 sentences with verified readings as AI sentences', async () => {
    const r = await repos();
    const saved = await saveAiSentences({ repos: r, tokenize }, [PLAIN], [], [W.matsu.id]);
    expect(saved.map((s) => s.text)).toEqual([S.waitPlain.text]);
    const stored = await r.sentences.get(aiSentenceId(S.waitPlain.text));
    expect(stored).toMatchObject({ source: 'ai', verified: true, translation: PLAIN.translation });
    expect(stored?.wordIds).toEqual([W.eki.id, W.tomodachi.id, W.matsu.id]);
  });

  it('counts the target as unknown even when it is already known', async () => {
    const r = await repos();
    await track(r, [[W.matsu, 3]]);
    const saved = await saveAiSentences({ repos: r, tokenize }, [PLAIN], [], [W.matsu.id]);
    expect(saved).toHaveLength(1);
  });

  it('drops sentences with an unverified reading', async () => {
    const r = await repos();
    const readings = [{ surface: '待つ', verified: false }];
    const saved = await saveAiSentences({ repos: r, tokenize }, [PLAIN], readings, [W.matsu.id]);
    expect(saved).toEqual([]);
    expect(await r.sentences.get(aiSentenceId(S.waitPlain.text))).toBeUndefined();
  });

  it('drops sentences that are not i+1 and ones already stored', async () => {
    const r = await repos();
    await track(r, [[W.matsu, 3]]);
    // 学生 is the one unknown word: kept. Without a target, every word of the plain sentence is
    // known, so it has no new item: dropped.
    const saved = await saveAiSentences({ repos: r, tokenize }, [PLAIN, STUDENT, STUDENT], [], []);
    expect(saved.map((s) => s.text)).toEqual([S.student.text]);
    const again = await saveAiSentences({ repos: r, tokenize }, [STUDENT], [], []);
    expect(again).toEqual([]);
  });
});

describe('knownWordSample', () => {
  it('lists written forms of words at level 3 or more', async () => {
    const r = await repos();
    await track(r, [[W.matsu, 2]]);
    expect(await knownWordSample(r)).toEqual(['駅', '友達', '本', '読む']);
    expect(await knownWordSample(r, 2)).toEqual(['本', '読む']);
  });
});
