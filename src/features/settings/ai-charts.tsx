/**
 * The AI use charts (A16): small hand-drawn SVGs, no library. Each has a text table for screen
 * readers (the SVG itself is hidden from them) and native tooltips on its bars.
 */
import type { ReactNode } from 'react';
import { cx } from '../../ui/cx.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import styles from './ai-charts.module.css';
import { type DayUse, type TaskUse, type TokenUse, taskLabelKey } from './ai-charts.ts';

const W = 320;
const H = 112;
const TOP = 14;
const BASE = H - 18;
const GAP = 2;

type I18n = ReturnType<typeof useI18n>;

/** "18 Oct" in the learner's language. */
const dayLabel = ({ format }: I18n, start: number) =>
  format.date(start, { day: 'numeric', month: 'short' });

/** A task's plain name, or the task's own name when it has none. */
const taskLabel = ({ t }: I18n, task: string) => {
  const key = taskLabelKey(task);
  return key ? t(key) : task;
};

function Chart(props: {
  title: string;
  legend?: ReactNode;
  table: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className={styles.chart}>
      <figcaption className={styles.title}>{props.title}</figcaption>
      {props.legend}
      <div aria-hidden="true">{props.children}</div>
      <table className="visually-hidden">{props.table}</table>
    </figure>
  );
}

function Legend({ items }: { items: readonly (readonly [string, string | undefined])[] }) {
  return (
    <ul className={styles.legend} aria-hidden="true">
      {items.map(([name, className]) => (
        <li key={name}>
          <span className={cx(styles.swatch, className)} />
          {name}
        </li>
      ))}
    </ul>
  );
}

interface Segment {
  value: number;
  className: string | undefined;
}

function Column(props: {
  x: number;
  width: number;
  scale: number;
  segments: Segment[];
  title: string;
}) {
  let y = BASE;
  return (
    <g>
      <title>{props.title}</title>
      <rect x={props.x} y={TOP} width={props.width} height={BASE - TOP} className={styles.hit} />
      {props.segments.map((segment) => {
        const height = segment.value * props.scale;
        if (height <= 0) return null;
        y -= height;
        const top = y;
        y -= GAP;
        return (
          <rect
            key={segment.className ?? 'bar'}
            x={props.x}
            y={top}
            width={props.width}
            height={height}
            rx={1.5}
            className={segment.className}
          />
        );
      })}
    </g>
  );
}

function DayAxis({ days, max, unit }: { days: readonly DayUse[]; max: string; unit: string }) {
  const i18n = useI18n();
  const first = days[0];
  const last = days.at(-1);
  return (
    <>
      <line x1={0} x2={W} y1={BASE + 0.5} y2={BASE + 0.5} className={styles.axis} />
      <text x={0} y={TOP - 4} className={styles.tick}>{`${max} ${unit}`}</text>
      <text x={0} y={H - 4} className={styles.tick}>
        {first && dayLabel(i18n, first.start)}
      </text>
      <text x={W} y={H - 4} textAnchor="end" className={styles.tick}>
        {last && dayLabel(i18n, last.start)}
      </text>
    </>
  );
}

function DayBars(props: {
  days: readonly DayUse[];
  max: number;
  maxLabel: string;
  unit: string;
  segments: (day: DayUse) => Segment[];
  title: (day: DayUse) => string;
}) {
  const { days } = props;
  const step = W / days.length;
  const scale = props.max > 0 ? (BASE - TOP - GAP) / props.max : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="presentation">
      <DayAxis days={days} max={props.maxLabel} unit={props.unit} />
      {days.map((day, i) => (
        <Column
          key={day.start}
          x={i * step + GAP / 2}
          width={step - GAP}
          scale={scale}
          segments={props.segments(day)}
          title={props.title(day)}
        />
      ))}
    </svg>
  );
}

/** The chart as a text table, for screen readers; the first column heads each row. */
function DataTable(props: { caption: string; head: readonly string[]; rows: readonly string[][] }) {
  const [first, ...rest] = props.head;
  return (
    <>
      <caption>{props.caption}</caption>
      <thead>
        <tr>
          <th scope="col">{first}</th>
          {rest.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.rows.map(([name = '', ...cells]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            {cells.map((cell, i) => (
              <td key={rest[i]}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );
}

const split = ({ t }: I18n): [string, string | undefined][] => [
  [t('settingsAi.toGemini'), styles.s1],
  [t('settingsAi.fromCache'), styles.s2],
];

const daySplit = (d: DayUse): Segment[] => [
  { value: d.real, className: styles.s1 },
  { value: d.cached, className: styles.s2 },
];

/** Calls per day over the last 30 days: requests to Gemini, and answers from the cache. */
export function CallsPerDay({ days }: { days: readonly DayUse[] }) {
  const i18n = useI18n();
  const { t, format } = i18n;
  const max = Math.max(1, ...days.map((d) => d.real + d.cached));
  const rows = days.map((d) => [dayLabel(i18n, d.start), String(d.real), String(d.cached)]);
  const head = [t('settingsAi.day'), t('settingsAi.toGemini'), t('settingsAi.fromCache')];
  const caption = t('settingsAi.callsPerDayCaption', { days: days.length });
  const title = (d: DayUse) =>
    t('settingsAi.callsTitle', { label: dayLabel(i18n, d.start), real: d.real, cached: d.cached });
  return (
    <Chart
      title={t('settingsAi.callsPerDay')}
      legend={<Legend items={split(i18n)} />}
      table={<DataTable caption={caption} head={head} rows={rows} />}
    >
      <DayBars
        days={days}
        max={max}
        maxLabel={format.number(max)}
        unit={t('settingsAi.callUnit', { n: max })}
        segments={daySplit}
        title={title}
      />
    </Chart>
  );
}

/** Estimated cost per day over the last 30 days. */
export function CostPerDay({ days }: { days: readonly DayUse[] }) {
  const i18n = useI18n();
  const { t, format } = i18n;
  const max = Math.max(0, ...days.map((d) => d.costUsd));
  const rows = days.map((d) => [dayLabel(i18n, d.start), format.cost(d.costUsd)]);
  const caption = t('settingsAi.costPerDayCaption', { days: days.length });
  const head = [t('settingsAi.day'), t('settingsAi.cost')];
  const title = (d: DayUse) =>
    t('settingsAi.valueTitle', { label: dayLabel(i18n, d.start), value: format.cost(d.costUsd) });
  return (
    <Chart
      title={t('settingsAi.costPerDay')}
      table={<DataTable caption={caption} head={head} rows={rows} />}
    >
      <DayBars
        days={days}
        max={max}
        maxLabel={format.cost(max)}
        unit=""
        segments={(d) => [{ value: d.costUsd, className: styles.s1 }]}
        title={title}
      />
    </Chart>
  );
}

const ROW = 26;
const LABEL_W = 132;

function TaskRow({ row, i, scale }: { row: TaskUse; i: number; scale: number }) {
  const i18n = useI18n();
  const label = taskLabel(i18n, row.task);
  const y = i * ROW;
  const real = row.real * scale;
  const cached = row.cached * scale;
  return (
    <g>
      <title>
        {i18n.t('settingsAi.callsTitle', { label, real: row.real, cached: row.cached })}
      </title>
      <text x={0} y={y + 16} className={styles.label}>
        {label}
      </text>
      {real > 0 && (
        <rect x={LABEL_W} y={y + 6} width={real} height={12} rx={1.5} className={styles.s1} />
      )}
      {cached > 0 && (
        <rect
          x={LABEL_W + real + (real > 0 ? GAP : 0)}
          y={y + 6}
          width={cached}
          height={12}
          rx={1.5}
          className={styles.s2}
        />
      )}
      <text x={LABEL_W + real + cached + 6} y={y + 16} className={styles.tick}>
        {row.real + row.cached}
      </text>
    </g>
  );
}

/** Calls by task, as horizontal bars split into Gemini and cache. */
export function CallsByTask({ rows }: { rows: readonly TaskUse[] }) {
  const i18n = useI18n();
  const { t } = i18n;
  if (rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => r.real + r.cached));
  const scale = (W - LABEL_W - 30) / max;
  const cells = rows.map((r) => [taskLabel(i18n, r.task), String(r.real), String(r.cached)]);
  const head = [t('settingsAi.task'), t('settingsAi.toGemini'), t('settingsAi.fromCache')];
  const caption = t('settingsAi.callsByTaskCaption', { days: 30 });
  const table = <DataTable caption={caption} head={head} rows={cells} />;
  return (
    <Chart
      title={t('settingsAi.callsByTask')}
      legend={<Legend items={split(i18n)} />}
      table={table}
    >
      <svg viewBox={`0 0 ${W} ${rows.length * ROW}`} className={styles.svg} role="presentation">
        {rows.map((row, i) => (
          <TaskRow key={row.task} row={row} i={i} scale={scale} />
        ))}
      </svg>
    </Chart>
  );
}

function TokenBar({ parts }: { parts: readonly [string, number, string | undefined][] }) {
  const { t, format } = useI18n();
  const total = parts.reduce((sum, [, value]) => sum + value, 0);
  const scale = total > 0 ? (W - GAP * 2) / total : 0;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${W} 16`} className={styles.svg} role="presentation">
      <rect x={0} y={0} width={W} height={16} rx={3} className={styles.track} />
      {parts.map(([name, value, className]) => {
        const width = value * scale;
        const at = x;
        x += width > 0 ? width + GAP : 0;
        if (width <= 0) return null;
        return (
          <rect key={name} x={at} y={0} width={width} height={16} rx={3} className={className}>
            <title>
              {t('settingsAi.valueTitle', { label: name, value: format.number(value) })}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}

/** Input tokens read in full, from Gemini's cache, and output tokens, as one stacked bar. */
export function TokensChart({ use }: { use: TokenUse }) {
  const { t, format } = useI18n();
  const parts: [string, number, string | undefined][] = [
    [t('settingsAi.tokensInput'), use.fresh, styles.s1],
    [t('settingsAi.tokensInputCached'), use.cached, styles.s2],
    [t('settingsAi.tokensOutput'), use.output, styles.s3],
  ];
  const item = (name: string, value: number) =>
    t('settingsAi.legendItem', { name, value: format.number(value) });
  const legend = <Legend items={parts.map(([name, value, c]) => [item(name, value), c])} />;
  const rows = parts.map(([name, value]) => [name, format.number(value)]);
  const caption = t('settingsAi.tokensCaption', { days: 30 });
  const head = [t('settingsAi.kind'), t('settingsAi.tokens')];
  const table = <DataTable caption={caption} head={head} rows={rows} />;
  return (
    <Chart title={t('settingsAi.tokens')} legend={legend} table={table}>
      <TokenBar parts={parts} />
    </Chart>
  );
}
