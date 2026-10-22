/** Starting a capture (C1): a photo through OCR, or pasted text, tokenized and saved. */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { AiClient, AiError } from '../../ai/types.ts';
import { saveCapture } from '../../domain/services/index.ts';
import { paths } from '../../ui/paths.ts';
import { type Services, useServices } from '../../ui/services.tsx';
import { prepareImage } from './image.ts';

/** Why a capture could not start: the AI, no text in the photo, or a thrown error. */
export type StartProblem =
  | { kind: 'ai'; error: AiError }
  | { kind: 'no-text' }
  | { kind: 'crash'; detail: string };

export type StartState =
  | { status: 'idle' }
  | { status: 'busy'; step: 'saving' | 'reading' }
  | { status: 'error'; problem: StartProblem; needsKey: boolean };

/** Link to a saved capture. */
export function captureHref(id: string): string {
  return `${paths.capture}?id=${encodeURIComponent(id)}`;
}

/** Non-empty trimmed lines of OCR output or pasted text. */
export function cleanLines(lines: readonly string[]): string[] {
  return lines
    .flatMap((line) => line.split(/\r?\n/u))
    .map((line) => line.trim())
    .filter(Boolean);
}

function failure(result: { ok: false; error: AiError }): StartState {
  return {
    status: 'error',
    problem: { kind: 'ai', error: result.error },
    needsKey: result.error.kind === 'no-key',
  };
}

const NO_TEXT: StartState = {
  status: 'error',
  problem: { kind: 'no-text' },
  needsKey: false,
};

/** Tokenizes and saves the lines as a new capture; returns its id. */
async function saveLines(services: Services, lines: string[], photo?: Blob): Promise<string> {
  const { repos, lang } = services;
  const tokenized = await Promise.all(
    lines.map(async (text) => ({ text, tokens: await lang.tokenize(text) })),
  );
  const { currentLesson } = await repos.settings.get();
  const id = crypto.randomUUID();
  await saveCapture(repos, {
    id,
    createdAt: Date.now(),
    lines: tokenized,
    ...(photo ? { photo } : {}),
    ...(currentLesson ? { lesson: currentLesson } : {}),
  });
  return id;
}

/** OCR of a photo (C1); offline is reported before any work, since OCR needs AI. */
async function readPhoto(client: AiClient, file: Blob): Promise<StartState | PhotoText> {
  if (!navigator.onLine) return failure({ ok: false, error: { kind: 'offline', message: '' } });
  const image = await prepareImage(file);
  const result = await client.extractFromImage({ image: image.media });
  if (!result.ok) return failure(result);
  const lines = cleanLines(result.value.lines);
  return lines.length === 0 ? NO_TEXT : { lines, photo: image.blob };
}

interface PhotoText {
  lines: string[];
  photo: Blob;
}

/**
 * Photo and paste entry points; on success the screen moves to the saved capture. A photo is
 * read with the client of the `AiAction` that opened the picker (A18).
 */
export function useCaptureStart() {
  const services = useServices();
  const navigate = useNavigate();
  const [state, setState] = useState<StartState>({ status: 'idle' });

  const save = async (lines: string[], photo?: Blob) => {
    setState({ status: 'busy', step: 'saving' });
    const id = await saveLines(services, lines, photo);
    setState({ status: 'idle' });
    navigate(captureHref(id));
  };
  const fromPhoto = async (client: AiClient, file: Blob) => {
    setState({ status: 'busy', step: 'reading' });
    const read = await readPhoto(client, file);
    if ('status' in read) setState(read);
    else await save(read.lines, read.photo);
  };
  const fromText = async (text: string) => {
    const lines = cleanLines([text]);
    if (lines.length > 0) await save(lines);
  };
  return { state, fromPhoto: guard(fromPhoto, setState), fromText: guard(fromText, setState) };
}

/** Turns a thrown error (a photo that will not decode, a tokenizer failure) into a message. */
function guard<A extends unknown[]>(
  run: (...args: A) => Promise<void>,
  setState: (state: StartState) => void,
) {
  return (...args: A) =>
    run(...args).catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : String(error);
      setState({ status: 'error', problem: { kind: 'crash', detail }, needsKey: false });
    });
}
