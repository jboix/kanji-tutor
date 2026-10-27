/**
 * The tutor's last raw replies, as the provider sent them, kept in memory for the diagnostics
 * developer mode saves: with them a reply that broke a screen can be replayed exactly. Gone on
 * reload; nothing is stored.
 */

export interface RawReply {
  at: number;
  task: string;
  model: string;
  /** It parsed and matched the task's schema. */
  ok: boolean;
  text: string;
}

const KEPT = 10;
/** A reply longer than this is cut, so ten of them stay small. */
const MAX_CHARS = 20_000;

const replies: RawReply[] = [];

export function keepReply(reply: RawReply): void {
  replies.push({ ...reply, text: reply.text.slice(0, MAX_CHARS) });
  if (replies.length > KEPT) replies.splice(0, replies.length - KEPT);
}

/** The kept replies, oldest first. */
export function recentReplies(): readonly RawReply[] {
  return [...replies];
}
