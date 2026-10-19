import { describe, expect, it } from 'vitest';
import { createMockProvider } from './providers/mock.ts';
import { explainSentence, memoryHook, paraphraseQuestion } from './tasks.ts';
import { fakeLearner, fakeVerifier, scriptedProvider, testContext } from './testing/context.ts';

const VOICE = {
  text: '先生に新しい友達を紹介しました。',
  translation: 'I introduced a new friend.',
};
const HIDDEN = [{ surface: '紹介', readings: ['しょうかい'] }];

function context() {
  return testContext({
    provider: createMockProvider(),
    lang: fakeVerifier({ 時: ['とき'], 先生: ['せんせい'] }),
  });
}

async function value<T>(promise: Promise<{ ok: true; value: T } | { ok: false }>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(`task failed: ${JSON.stringify(result)}`);
  return result.value;
}

describe('explainSentence (L3)', () => {
  it('redacts the leaked reading in every form and says so', async () => {
    const input = { sentence: VOICE, grammar: [], hidden: HIDDEN };
    const result = await value(explainSentence(input, context()));
    const text = JSON.stringify(result);
    expect(text).not.toMatch(/しょうかい|shoukai|ショウカイ/i);
    expect(result.redacted).toBe(true);
    expect(result.readings.map((r) => r.surface)).toEqual(['先生']);
    expect(result).toMatchSnapshot();
  });

  it('keeps a clean reply as it is', async () => {
    const sentence = { text: '待つしかない。', translation: 'I can only wait.' };
    const grammar = [{ pattern: '〜しかない', meaning: 'have no choice but' }];
    const hidden = [{ surface: '待つ', readings: ['まつ'] }];
    const result = await value(explainSentence({ sentence, grammar, hidden }, context()));
    expect(result.redacted).toBe(false);
    expect(result.grammar[0]?.pattern).toBe('〜しかない');
  });

  it('tells the model the hidden readings and runs on the teacher tier with tools', async () => {
    const provider = scriptedProvider([
      JSON.stringify({ meaning: 'Plain.', grammar: [], readings: [] }),
    ]);
    const ctx = testContext({ provider, teacherModel: 'teacher-model', learner: fakeLearner() });
    await value(explainSentence({ sentence: VOICE, grammar: [], hidden: HIDDEN }, ctx));
    const [request] = provider.requests;
    expect(request?.model).toBe('teacher-model');
    expect(request?.tools).toBeDefined();
    expect(request?.prompt).toContain('紹介 (never write: しょうかい)');
  });

  it('filters a cached reply again for the targets of the call', async () => {
    const ctx = context();
    const input = { sentence: VOICE, grammar: [], hidden: HIDDEN };
    await value(explainSentence(input, ctx));
    const again = await explainSentence(input, ctx);
    expect(again.ok && again.cached).toBe(true);
    expect(JSON.stringify(again)).not.toContain('しょうかい');
  });
});

describe('explainSentence on a blank (A19)', () => {
  const sentence = { text: '寝る前に食べちゃダメよ。' };
  const blank = { shown: '（＿＿＿）前に食べちゃダメよ。', answer: '寝る' };
  const hidden = [{ surface: '寝る', readings: ['ねる'] }];

  it('gives the tutor the real sentence and the hidden answer under the no-spoil rule', async () => {
    const provider = scriptedProvider([
      JSON.stringify({ meaning: 'Hint.', grammar: [], readings: [] }),
    ]);
    const ctx = testContext({ provider, learner: fakeLearner() });
    await value(explainSentence({ sentence, grammar: [], hidden, blank }, ctx));
    const [request] = provider.requests;
    expect(request?.prompt).toContain(
      'The learner sees: （＿＿＿）前に食べちゃダメよ。. Hidden answer (never write it): 寝る',
    );
    expect(request?.prompt).toContain('寝る前に食べちゃダメよ。');
    expect(request?.system).toMatch(/hint that steers toward the\s+answer without saying it/);
    expect(request?.system).toContain('placeholder');
  });

  it('removes the answer, its stem and its reading if they leak', async () => {
    const leak = {
      meaning: 'It is 寝る: you 寝ます at night (ねる, neru). Before that, no eating.',
      grammar: [{ pattern: '〜前に', note: 'Before doing 寝る.' }],
      readings: [{ surface: '寝る', reading: 'ねる' }],
    };
    const provider = scriptedProvider([JSON.stringify(leak)]);
    const result = await value(
      explainSentence({ sentence, grammar: [], hidden, blank }, testContext({ provider })),
    );
    const text = JSON.stringify(result);
    expect(text).not.toMatch(/寝|ねる|neru/);
    expect(result.redacted).toBe(true);
    expect(result.readings).toEqual([]);
  });

  it('answers with a hint from the mock, never a placeholder message', async () => {
    const result = await value(
      explainSentence({ sentence, grammar: [], hidden, blank }, context()),
    );
    expect(result.meaning).toMatch(/^Hint:/);
    expect(result.meaning).not.toMatch(/placeholder/i);
    expect(result.redacted).toBe(false);
  });
});

describe('memoryHook (L1)', () => {
  it('builds a hook from parts and verifies its readings', async () => {
    const input = {
      word: { surface: '待つ', reading: 'まつ', meaning: 'to wait' },
      kanji: [
        {
          char: '待',
          meanings: ['wait'],
          parts: [{ char: '彳' }, { char: '寺', meaning: 'temple' }],
        },
      ],
    };
    const result = await value(memoryHook(input, context()));
    expect(result.hook).toContain('寺');
    expect(result.readings).toEqual([{ surface: '時', reading: 'とき', verified: true }]);
  });
});

describe('paraphraseQuestion (J6)', () => {
  const sentence = { text: '待つしかない。', translation: 'I can only wait.' };
  const EXTRA = {
    待つ: ['まつ'],
    待たなくても: ['またなくても'],
    待ちたくない: ['まちたくない'],
    待っても: ['まっても'],
  };

  it('is verified when every reading checks out', async () => {
    const ctx = testContext({ provider: createMockProvider(), lang: fakeVerifier(EXTRA) });
    const result = await value(paraphraseQuestion({ sentence, phrase: '待つしかない' }, ctx));
    expect(result.verified).toBe(true);
    expect(result.options).toHaveLength(4);
    expect(result.options[result.answerIndex]?.text).toBe('待つほかない。');
    expect(result.phrase).toBe('待つしかない');
  });

  it('is not verified when a reading fails, or the options are not four distinct ones', async () => {
    const strict = testContext({ provider: createMockProvider() });
    expect((await value(paraphraseQuestion({ sentence }, strict))).verified).toBe(false);
    const options = [1, 1, 2, 3].map((n) => ({ text: `${n}`, why: 'Because.' }));
    const provider = scriptedProvider([JSON.stringify({ options, answerIndex: 0, readings: [] })]);
    const twice = testContext({ provider, lang: fakeVerifier(EXTRA) });
    expect((await value(paraphraseQuestion({ sentence }, twice))).verified).toBe(false);
  });
});
