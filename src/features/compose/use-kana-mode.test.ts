import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMode } from './use-kana-mode.ts';

describe('loadMode (D112)', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts on あ, and reads back what the session kept', () => {
    expect(loadMode()).toEqual({ mode: 'hiragana', chosen: false });
    sessionStorage.setItem('kanji-tutor:compose-typing', '{"mode":"native","chosen":false}');
    expect(loadMode()).toEqual({ mode: 'native', chosen: false });
    sessionStorage.setItem('kanji-tutor:compose-typing', '{"mode":"katakana","chosen":true}');
    expect(loadMode()).toEqual({ mode: 'katakana', chosen: true });
  });

  it('ignores a broken or unknown value, and a blocked storage', () => {
    sessionStorage.setItem('kanji-tutor:compose-typing', '{"mode":"klingon"}');
    expect(loadMode().mode).toBe('hiragana');
    sessionStorage.setItem('kanji-tutor:compose-typing', 'not json');
    expect(loadMode().mode).toBe('hiragana');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadMode().mode).toBe('hiragana');
  });
});
