/**
 * Where a session is, over its progress bar: "Unit 3 · 家族 · 言葉 1/2" in a lesson, the scanned
 * lesson's title, the grammar point practised, or the kind of round ("Daily mix", "Kanji").
 */
import { type ReactNode, useEffect, useState } from 'react';
import { GRAMMAR_CATALOGUE } from '../../domain/grammar/index.ts';
import { readingLabel, SECTION_TITLES } from '../../domain/services/index.ts';
import { unitById } from '../../domain/themes/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { useServices } from '../../ui/services.tsx';
import type { SessionRequest } from './use-session.ts';

/** One piece of the line; Japanese pieces show in the Japanese font. */
interface Piece {
  text: string;
  ja?: boolean;
}

export interface SessionWhere {
  /** The line as plain text, for the progress bar's name. */
  label: string;
  content: ReactNode;
}

/** What the session request's lookups found: the lesson section's parts, the scan's title. */
interface Found {
  parts?: number | undefined;
  scanTitle?: string | undefined;
}

function lessonPieces(t: Translate, request: SessionRequest, found: Found): Piece[] {
  const unit = request.unit ? unitById(request.unit) : undefined;
  if (!unit) return [];
  const head: Piece[] = [{ text: t('readSession.whereUnit', { order: unit.order }) }];
  head.push({ text: unit.titleJa, ja: true });
  const { section } = request;
  if (!section) {
    return [...head, { text: t(request.passage ? 'units.stepReading' : 'units.stepPractice') }];
  }
  const part = request.part ?? 1;
  const of = found.parts && found.parts > 1 ? ` ${part}/${found.parts}` : '';
  return [
    ...head,
    { text: SECTION_TITLES[section], ja: true },
    { text: t(SECTION_NAME[section]) + of },
  ];
}

function roundPieces(t: Translate, request: SessionRequest): Piece[] {
  if (request.focus) {
    const { kanji, reading } = request.focus;
    return [{ text: `${kanji}  ${readingLabel(reading)}`, ja: true }];
  }
  if (request.grammar) {
    const entry = GRAMMAR_CATALOGUE.find((g) => g.id === request.grammar);
    return [{ text: t('ui.startGrammar') }, ...(entry ? [{ text: entry.pattern, ja: true }] : [])];
  }
  if (request.kanjiCards) return [{ text: t('ui.startKanji') }];
  if (request.drillShare === 0) return [{ text: t('ui.startReading') }];
  if (request.drillShare !== undefined) return [{ text: t('readSession.whereExercises') }];
  return [{ text: t('ui.startMix') }];
}

function piecesOf(t: Translate, request: SessionRequest, found: Found): Piece[] {
  if (request.scan) {
    const title = found.scanTitle ? [{ text: found.scanTitle }] : [];
    return [{ text: t('readSession.whereScan') }, ...title];
  }
  if (request.unit) return lessonPieces(t, request, found);
  return roundPieces(t, request);
}

/** The lesson section's number of parts, and the scanned lesson's title, once looked up. */
function useFound(request: SessionRequest): Found {
  const { repos } = useServices();
  const [found, setFound] = useState<Found>({});
  const { unit, section, scan } = request;
  useEffect(() => {
    let live = true;
    const parts = async () =>
      unit && section
        ? (await repos.settings.get()).unitStatus?.[unit]?.sections?.[section]?.parts
        : undefined;
    const scanTitle = async () => (scan ? (await repos.scans.get(scan))?.title : undefined);
    void Promise.all([parts(), scanTitle()]).then(([p, title]) => {
      if (live) setFound({ parts: p, scanTitle: title });
    });
    return () => {
      live = false;
    };
  }, [repos, unit, section, scan]);
  return found;
}

/** Where the session is (see the module comment). */
export function useSessionWhere(request: SessionRequest): SessionWhere {
  const t = useT();
  const pieces = piecesOf(t, request, useFound(request));
  const content = pieces.map((piece, i) => (
    <span key={piece.text}>
      {i > 0 && ' · '}
      {piece.ja ? <Ja>{piece.text}</Ja> : piece.text}
    </span>
  ));
  return { label: pieces.map((piece) => piece.text).join(' · '), content };
}
