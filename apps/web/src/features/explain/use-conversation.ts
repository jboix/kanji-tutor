import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AiClient, Answer, ConversationTurn, QuestionInput } from '../../ai/types.ts';
import { saveLastConversation } from '../../ui/last-conversation.ts';
import type { AnsweredTurn, TutorTopic } from '../../ui/slots.tsx';
import { type AiState, settle, thrown } from './use-ai.ts';

/** One question to the tutor and where its answer stands. */
export interface Turn {
  id: number;
  question: string;
  state: AiState<Answer>;
}

/** Earlier turns sent with a question: enough to follow on, short enough to stay cheap. */
const HISTORY_TURNS = 4;

/** The turns answered so far, in order. */
function answered(turns: readonly Turn[]): AnsweredTurn[] {
  return turns.flatMap((turn) =>
    turn.state.status === 'done' ? [{ question: turn.question, answer: turn.state.value }] : [],
  );
}

function historyOf(turns: readonly Turn[]): ConversationTurn[] {
  return answered(turns)
    .map((turn) => ({ question: turn.question, answer: turn.answer.answer }))
    .slice(-HISTORY_TURNS);
}

/** An earlier conversation's turns, answered already: shown as saved, with no request. */
function resumed(turns: readonly AnsweredTurn[]): Turn[] {
  return turns.map((turn, id) => ({
    id,
    question: turn.question,
    state: { status: 'done', value: turn.answer, cached: true },
  }));
}

/** Scope of a question: the Tutor tab's general topic, a word, or the sentence. */
function scopeOf(topic: TutorTopic): QuestionInput['scope'] {
  if (topic.general) return 'general';
  return topic.surface ? 'word' : 'sentence';
}

/** The question as the tutor gets it: the topic, the question and the turns before it. */
export function questionInput(
  topic: TutorTopic,
  question: string,
  history: ConversationTurn[],
): QuestionInput {
  const input: QuestionInput = {
    scope: scopeOf(topic),
    sentence: topic.sentence,
    question,
  };
  if (topic.surface) input.surface = topic.surface;
  if (topic.grammar) input.grammar = topic.grammar;
  if (history.length > 0) input.history = history;
  return input;
}

/** False once the component is gone, so a late answer is dropped. */
function useLive() {
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  return live;
}

type SetTurns = Dispatch<SetStateAction<Turn[]>>;

/** Sends turn `id`'s question with the turns before it, and files the answer under it. */
function useSend(topic: TutorTopic, latest: RefObject<Turn[]>, setTurns: SetTurns) {
  const live = useLive();
  return useCallback(
    (client: AiClient, id: number, question: string) => {
      const before = latest.current.filter((turn) => turn.id < id);
      const input = questionInput(topic, question, historyOf(before));
      const update = (state: AiState<Answer>) =>
        live.current && setTurns((list) => list.map((t) => (t.id === id ? { ...t, state } : t)));
      update({ status: 'loading' });
      client.answerQuestion(input).then(
        (result) => update(settle(result)),
        (error: unknown) => update(thrown(error)),
      );
    },
    [topic, latest, setTurns, live],
  );
}

/** Keeps the conversation for the Tutor tab's "Carry on" each time a new answer comes. */
function useKeepLast(topic: TutorTopic, turns: readonly Turn[], from: number) {
  const count = answered(turns).length;
  useEffect(() => {
    if (count <= from) return;
    saveLastConversation({ topic, turns: answered(turns), at: Date.now() });
  }, [count, from, topic, turns]);
}

/**
 * A conversation with the tutor about one topic (A4): every question is one request, sent with
 * the answers before it so it can build on them. Each turn keeps its own answer; Retry asks
 * that turn again. `resume` carries on an earlier conversation from its answered turns.
 */
export function useConversation(topic: TutorTopic, resume: readonly AnsweredTurn[] = []) {
  const [turns, setTurns] = useState<Turn[]>(() => resumed(resume));
  const latest = useRef<Turn[]>(turns);
  latest.current = turns;
  const next = useRef(resume.length);
  useKeepLast(topic, turns, resume.length);
  const send = useSend(topic, latest, setTurns);
  const ask = useCallback(
    (client: AiClient, question: string) => {
      const turn: Turn = { id: next.current++, question, state: { status: 'loading' } };
      latest.current = [...latest.current, turn];
      setTurns((list) => [...list, turn]);
      send(client, turn.id, question);
    },
    [send],
  );
  const retry = useCallback(
    (client: AiClient, turn: Turn) => send(client, turn.id, turn.question),
    [send],
  );
  return { turns, ask, retry };
}
