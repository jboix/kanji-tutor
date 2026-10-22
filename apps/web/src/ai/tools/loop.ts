/**
 * The bounded function-calling loop (A10, D35), shared by the Gemini and mock providers. Each
 * round runs every call the model made and answers each with exactly one result carrying the
 * call's id and name. After `MAX_TOOL_ROUNDS` (or the request's `maxToolRounds`) the model must
 * answer without tools: one press of a button makes at most 1 + rounds requests (D57).
 */
import type { AiResponse, ToolCall, ToolResult, ToolRunner } from '../types.ts';

/** Tool rounds per request: two, so a whole tool loop is three requests (D57, A14). */
export const MAX_TOOL_ROUNDS = 2;

/** One model turn: the calls it made (none for a final answer) and its text. */
export interface Turn {
  calls: ToolCall[];
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** Prompt tokens served from Gemini's implicit cache, part of `inputTokens` (A15). */
  cachedTokens?: number;
}

/** A conversation with the model. The provider keeps the history; the loop only drives it. */
export interface ToolSession {
  /** Sends the previous round's results (none on the first turn); `allowTools` false forces text. */
  next(results: ToolResult[] | undefined, allowTools: boolean): Promise<Turn>;
}

/** Runs the loop to a final answer, summing tokens over every turn. */
export async function runToolLoop(
  session: ToolSession,
  tools: ToolRunner,
  maxRounds = MAX_TOOL_ROUNDS,
): Promise<AiResponse> {
  let turn = await session.next(undefined, maxRounds > 0);
  let inputTokens = turn.inputTokens;
  let outputTokens = turn.outputTokens;
  let cachedTokens = turn.cachedTokens ?? 0;
  let rounds = 0;
  while (turn.calls.length > 0 && rounds < maxRounds) {
    rounds += 1;
    const results = await Promise.all(turn.calls.map((call) => tools.execute(call)));
    turn = await session.next(results, rounds < maxRounds);
    inputTokens += turn.inputTokens;
    outputTokens += turn.outputTokens;
    cachedTokens += turn.cachedTokens ?? 0;
  }
  return { text: turn.text, inputTokens, outputTokens, cachedTokens, toolRounds: rounds };
}
