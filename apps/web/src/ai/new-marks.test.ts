import { describe, expect, it } from 'vitest';
import { withoutNewMarks } from './new-marks.ts';

describe('withoutNewMarks', () => {
  it('takes the ［新］ marks out of every string of a reply', () => {
    const reply = {
      text: 'This represents your father ［\n新\n］.',
      hooks: [{ line: '鉛筆［新］で書きます', at: 2 }, '新しい [新] 本【新】'],
      ok: true,
    };
    expect(withoutNewMarks(reply)).toEqual({
      text: 'This represents your father.',
      hooks: [{ line: '鉛筆で書きます', at: 2 }, '新しい 本'],
      ok: true,
    });
  });
});
