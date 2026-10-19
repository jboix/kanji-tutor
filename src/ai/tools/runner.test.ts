import { describe, expect, it } from 'vitest';
import { fakeLearner } from '../testing/context.ts';
import { createToolRunner, TOOL_DECLARATIONS } from './runner.ts';

describe('TOOL_DECLARATIONS', () => {
  it('declares the four learner tools with JSON Schema parameters', () => {
    expect(TOOL_DECLARATIONS.map((tool) => tool.name)).toEqual([
      'get_learner_profile',
      'check_known',
      'lookup_word',
      'known_examples',
    ]);
    const lookup = TOOL_DECLARATIONS.find((tool) => tool.name === 'lookup_word');
    expect(lookup?.parameters).toMatchObject({
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    });
    expect(lookup?.parameters).not.toHaveProperty('$schema');
  });
});

describe('createToolRunner', () => {
  it('runs each handler on the learner view, keeping the call id and name', async () => {
    const learner = fakeLearner();
    const runner = createToolRunner(learner);
    const known = await runner.execute({
      id: 'call_1',
      name: 'check_known',
      args: { words: ['駅'] },
    });
    expect(known).toEqual({
      id: 'call_1',
      name: 'check_known',
      response: { output: [{ kind: 'word', text: '駅', found: true, state: 'known' }] },
    });
    await runner.execute({ name: 'get_learner_profile', args: {} });
    await runner.execute({ name: 'lookup_word', args: { text: '待つ' } });
    const examples = await runner.execute({ name: 'known_examples', args: { query: '待' } });
    expect(examples).toEqual({ name: 'known_examples', response: { output: [] } });
    expect(learner.calls).toEqual([
      'checkKnown',
      'getLearnerProfile',
      'lookupWord',
      'knownExamples',
    ]);
  });

  it('turns a handler error, an unknown tool and bad arguments into error results', async () => {
    const learner = fakeLearner({
      lookupWord: async () => {
        throw new Error('dictionary not loaded');
      },
      knownExamples: async () => {
        throw 'odd';
      },
    });
    const runner = createToolRunner(learner);
    expect(await runner.execute({ id: 'x', name: 'lookup_word', args: { text: '待つ' } })).toEqual({
      id: 'x',
      name: 'lookup_word',
      response: { error: 'dictionary not loaded' },
    });
    expect(await runner.execute({ name: 'known_examples', args: { query: '待' } })).toMatchObject({
      response: { error: 'The tool failed.' },
    });
    expect(await runner.execute({ name: 'delete_items', args: {} })).toMatchObject({
      response: { error: 'Unknown tool delete_items.' },
    });
    expect(await runner.execute({ name: 'lookup_word', args: { text: 3 } })).toMatchObject({
      response: { error: 'Bad arguments for lookup_word.' },
    });
  });
});
