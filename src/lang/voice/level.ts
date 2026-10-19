/** Input level of a microphone stream for the recording waveform (voice.html), via Web Audio. */

export interface LevelMeter {
  /** 0–1, from the latest audio frame. */
  level(): number;
  close(): void;
}

const SILENT: LevelMeter = { level: () => 0, close: () => undefined };

/** Speech RMS rarely passes 0.25, so it is scaled up to fill the bars. */
const GAIN = 4;

/** 0–1 loudness of 8-bit time-domain samples centred on 128. */
export function rmsLevel(samples: Uint8Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) {
    const value = (sample - 128) / 128;
    sum += value * value;
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * GAIN);
}

type AudioContextConstructor = new () => AudioContext;

function audioContextConstructor(): AudioContextConstructor | undefined {
  const scope = globalThis as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/** A meter on the stream, or a silent one when Web Audio is missing (the bars stay still). */
export function createLevelMeter(stream: MediaStream): LevelMeter {
  const Context = audioContextConstructor();
  if (!Context) return SILENT;
  try {
    const context = new Context();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    void context.resume().catch(() => undefined);
    const samples = new Uint8Array(analyser.fftSize);
    return {
      level: () => {
        analyser.getByteTimeDomainData(samples);
        return rmsLevel(samples);
      },
      close: () => void context.close().catch(() => undefined),
    };
  } catch {
    return SILENT;
  }
}
