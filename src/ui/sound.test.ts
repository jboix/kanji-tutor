import { describe, expect, it, vi } from 'vitest';
import { canSpeak } from '../lang/speech.ts';
import { applySound, CUES, createSound, PEAK } from './sound.ts';

interface FakeNote {
  type: string;
  freq: number;
  start: number;
  stop: number;
  peak: number;
}

function fakeContext(state: AudioContextState = 'running') {
  const notes: FakeNote[] = [];
  const resume = vi.fn(async () => undefined);
  const context = {
    state,
    currentTime: 2,
    destination: {},
    resume,
    createOscillator() {
      const note: FakeNote = { type: '', freq: 0, start: -1, stop: -1, peak: 0 };
      notes.push(note);
      return {
        set type(value: string) {
          note.type = value;
        },
        frequency: { setValueAtTime: (value: number) => (note.freq = value) },
        connect: () => undefined,
        start: (at: number) => (note.start = at),
        stop: (at: number) => (note.stop = at),
      };
    },
    createGain() {
      const owner = () => notes.at(-1);
      return {
        gain: {
          setValueAtTime: () => undefined,
          linearRampToValueAtTime: (value: number) => {
            const note = owner();
            if (note) note.peak = value;
          },
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: () => undefined,
      };
    },
  };
  return { context: context as unknown as AudioContext, notes, resume };
}

describe('sound', () => {
  it('plays nothing until a gesture created the context (iOS)', () => {
    const fake = fakeContext();
    const make = vi.fn(() => fake.context);
    const player = createSound(make);
    player.play('correct');
    expect(make).not.toHaveBeenCalled();
    expect(fake.notes).toHaveLength(0);
  });

  it('plays a rising two-note for a right answer and one low note for a wrong one', () => {
    const fake = fakeContext();
    const player = createSound(() => fake.context);
    player.unlock();
    player.play('correct');
    expect(fake.notes.map((n) => n.freq)).toEqual([659.25, 880]);
    expect(fake.notes[0]?.start).toBe(2);
    expect(fake.notes[1]?.start ?? 0).toBeGreaterThan(fake.notes[0]?.start ?? 0);
    player.play('wrong');
    const low = fake.notes.at(-1);
    expect(low?.freq).toBeLessThan(300);
    expect(low?.type).toBe('sine');
    expect(fake.notes.every((n) => n.peak === PEAK && n.peak < 0.2)).toBe(true);
    expect(fake.notes.every((n) => n.stop > n.start)).toBe(true);
    expect(CUES.wrong).toHaveLength(1);
  });

  it('creates the context once and resumes it when suspended', () => {
    const fake = fakeContext('suspended');
    const make = vi.fn(() => fake.context);
    const player = createSound(make);
    const target = new EventTarget();
    const stop = player.listen(target);
    target.dispatchEvent(new Event('pointerdown'));
    target.dispatchEvent(new Event('keydown'));
    expect(make).toHaveBeenCalledTimes(1);
    expect(fake.resume).toHaveBeenCalledTimes(2);
    stop();
    target.dispatchEvent(new Event('keydown'));
    expect(fake.resume).toHaveBeenCalledTimes(2);
  });

  it('stays silent without Web Audio or when the context fails', () => {
    const none = createSound(() => undefined);
    none.unlock();
    expect(() => none.play('wrong')).not.toThrow();
    const broken = createSound(() => {
      throw new Error('blocked');
    });
    expect(() => broken.unlock()).not.toThrow();
    expect(() => broken.play('correct')).not.toThrow();
  });

  it('plays nothing while muted, and plays again once unmuted (D125)', () => {
    const fake = fakeContext();
    const player = createSound(() => fake.context);
    player.unlock();
    player.mute(true);
    player.play('correct');
    expect(fake.notes).toHaveLength(0);
    player.mute(false);
    player.play('wrong');
    expect(fake.notes).toHaveLength(1);
  });

  it('applies the setting to speech as well, on when unset', () => {
    vi.stubGlobal('speechSynthesis', { cancel: () => undefined });
    applySound(false);
    expect(canSpeak()).toBe(false);
    applySound(undefined);
    expect(canSpeak()).toBe(true);
    applySound(false);
    applySound(true);
    expect(canSpeak()).toBe(true);
    vi.unstubAllGlobals();
  });
});
