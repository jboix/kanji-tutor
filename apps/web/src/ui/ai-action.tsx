/**
 * The one way a feature starts an AI task (A18). Every press that sends a request to Gemini
 * is an `AiAction`: the 解 seal, "uses AI" in its accessible name and a visible "1 request" hint.
 * Before it shows, it asks the cache (`peek`): an answer the tutor already gave reads "Saved",
 * and pressing it opens that answer with no request (the task answers from the cache, A15).
 *
 * Features never touch `useServices().ai`: the client reaches them only as the argument of
 * `run`, `peek` or `onAsk` below. `ai-action-usage.test.ts` fails on any other route.
 */
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useRef, useState } from 'react';
import type { AiClient } from '../ai/types.ts';
import styles from './ai-action.module.css';
import { AiSeal } from './ai-seal.tsx';
import { AskInput } from './ask-input.tsx';
import { Chip } from './chip.tsx';
import { cx } from './cx.ts';
import { DictationButton } from './dictation-button.tsx';
import { useT } from './i18n/i18n.tsx';
import { SendIcon } from './icons.tsx';
import { PillButton } from './pill-button.tsx';
import { useServices } from './services.tsx';

/** Starts the task with the client; called on the press (or once, for `auto`). */
export type AiRun = (client: AiClient) => void;
/** The cached answer for this press, from `client.peek`; never calls Gemini. Memoise it. */
export type AiPeek = (client: AiClient) => Promise<unknown>;

/**
 * chip: a follow-up pill (default) · primary / secondary: the 52px pill · text: a link line ·
 * icon: a 52px outlined circle with the seal at its corner (its hint is the tooltip).
 */
export type AiActionLook = 'chip' | 'primary' | 'secondary' | 'text' | 'icon';

export interface AiActionProps {
  /** The visible label, e.g. "Ask the tutor why". The accessible name adds "uses AI, 1 request". */
  label: string;
  run: AiRun;
  peek?: AiPeek | undefined;
  look?: AiActionLook;
  disabled?: boolean | undefined;
  /** Full width (pill looks). */
  block?: boolean;
  /**
   * Runs once by itself as soon as it is enabled. Only for the Settings opt-in "Also explain my
   * mistakes automatically" (A13); every other request waits for a press.
   */
  auto?: boolean | undefined;
  /** What the label shows when it is more than text, e.g. Japanese in Klee One. */
  content?: ReactNode;
  /** The icon of the `icon` look; its label is then the accessible name only. */
  icon?: ReactNode;
}

/** True once `peek` found a cached answer for the current input. */
function useSaved(peek: AiPeek | undefined, client: AiClient): boolean {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(false);
    if (!peek) return;
    let live = true;
    peek(client).then(
      (value) => live && setSaved(value !== undefined && value !== null),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [peek, client]);
  return saved;
}

function useAuto(auto: boolean, press: () => void) {
  const ran = useRef(false);
  const latest = useRef(press);
  latest.current = press;
  useEffect(() => {
    if (!auto || ran.current) return;
    ran.current = true;
    latest.current();
  }, [auto]);
}

/** The seal, the label and the hint: what every AI press shows, the same everywhere. */
export function AiActionContent(props: { label: ReactNode; saved: boolean }) {
  const t = useT();
  return (
    <>
      <AiSeal size={16} />
      <span className={styles.label}>{props.label}</span>{' '}
      <span className={cx(styles.hint, props.saved && styles.saved)} aria-hidden="true">
        {props.saved ? t('ui.aiActionSaved') : t('ui.aiActionCost')}
      </span>
    </>
  );
}

/**
 * "Ask the tutor why, 1 request, uses AI" or "…, saved, uses AI: no request": the visible label
 * and hint first, in order, so a voice command naming them works (WCAG 2.5.3).
 */
export function useAiActionName(label: string, saved = false): string {
  const t = useT();
  return t(saved ? 'ui.aiActionNameSaved' : 'ui.aiActionName', { label });
}

type ButtonBase = ButtonHTMLAttributes<HTMLButtonElement>;

function ActionButton(props: ButtonBase & { look: AiActionLook; block?: boolean }) {
  const { look, block, className, ...rest } = props;
  const classes = cx(styles.action, className);
  if (look === 'chip') return <Chip {...rest} data-look={look} className={classes} />;
  if (look === 'text' || look === 'icon') {
    const own = look === 'text' ? styles.text : styles.icon;
    return <button type="button" {...rest} data-look={look} className={cx(own, classes)} />;
  }
  return <PillButton {...rest} data-look={look} variant={look} block={block} className={classes} />;
}

/** The icon look: the icon, with the seal at its corner. */
function IconContent({ icon }: { icon: ReactNode }) {
  return (
    <>
      {icon}
      <span className={styles.badge}>
        <AiSeal size={16} />
      </span>
    </>
  );
}

/** A press that sends one request to the tutor (see the module comment). */
export function AiAction(props: AiActionProps) {
  const { ai } = useServices();
  const { label, run, look = 'chip', disabled } = props;
  const saved = useSaved(props.peek, ai);
  const name = useAiActionName(label, saved);
  const t = useT();
  const press = () => run(ai);
  useAuto(props.auto === true && !disabled, press);
  const icon = look === 'icon';
  return (
    <ActionButton
      look={look}
      block={props.block ?? false}
      aria-label={name}
      title={icon ? t(saved ? 'ui.aiActionSaved' : 'ui.aiActionCost') : undefined}
      data-ai-action={saved ? 'saved' : 'request'}
      disabled={disabled}
      onClick={press}
    >
      {icon ? (
        <IconContent icon={props.icon} />
      ) : (
        <AiActionContent label={props.content ?? label} saved={saved} />
      )}
    </ActionButton>
  );
}

/** The submit button of an `AiForm`: the same mark, for a form that sends one request. */
export function AiSubmit(props: {
  label: string;
  look?: AiActionLook;
  disabled?: boolean;
  block?: boolean;
}) {
  const name = useAiActionName(props.label);
  return (
    <ActionButton
      look={props.look ?? 'secondary'}
      block={props.block ?? false}
      type="submit"
      aria-label={name}
      data-ai-action="request"
      disabled={props.disabled}
    >
      <AiActionContent label={props.label} saved={false} />
    </ActionButton>
  );
}

/** A form whose submit sends one request: `onAsk` gets the client. Put an `AiSubmit` inside. */
export function AiForm(props: {
  onAsk: (client: AiClient) => void;
  className?: string | undefined;
  children: ReactNode;
}) {
  const { ai } = useServices();
  return (
    <form
      className={props.className}
      onSubmit={(event) => {
        event.preventDefault();
        props.onAsk(ai);
      }}
    >
      {props.children}
    </form>
  );
}

/**
 * Hands the client to a flow that a non-AI control starts and that ends in one request: the
 * voice answer (the request goes out when the recording stops) and dictated questions. The
 * control that starts it must carry the mark (`AiActionContent`, `useAiActionName`).
 */
export function useAiPress(): (run: AiRun) => void {
  const { ai } = useServices();
  return (run) => run(ai);
}

export interface AiAskInputProps {
  /** The field's label, e.g. "Ask about 待って". The accessible name adds "uses AI". */
  label: string;
  placeholder?: string;
  /** One question, typed or dictated: one request with the client. */
  onAsk: (client: AiClient, question: string) => void;
  /** The mic's label, e.g. "Ask by voice". */
  dictateLabel: string;
}

/**
 * The Ask box (A4): a question field whose every submit, typed or dictated, sends one request.
 * Its send button is the bare arrow of W-answered; its name says it uses AI, and the line
 * under it says what a question costs (A18).
 */
export function AiAskInput(props: AiAskInputProps) {
  const { ai } = useServices();
  const t = useT();
  const ask = (question: string) => props.onAsk(ai, question);
  const send = useAiActionName(t('ui.aiAskSend'));
  const trailing = (
    <>
      <DictationButton onText={ask} label={useAiActionName(props.dictateLabel)} />
      <button type="submit" className={styles.send} aria-label={send} data-ai-action="request">
        <SendIcon size={22} />
      </button>
    </>
  );
  return (
    <div className={styles.ask}>
      <AskInput
        label={props.label}
        placeholder={props.placeholder}
        onSubmit={ask}
        trailing={trailing}
      />
      <p className={styles.askHint}>{t('ui.aiAskHint')}</p>
    </div>
  );
}

/** The seal as it sits on every AI press, for a line that explains the mark (Settings, A18). */
export function AiPressSeal() {
  return (
    <span className={styles.legend}>
      <AiSeal size={16} />
    </span>
  );
}
