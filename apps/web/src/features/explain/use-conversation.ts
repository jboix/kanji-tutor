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
import type { TutorTopic } from '../../ui/slots.tsx';
import { type AiState, settle, thrown } from './use-ai.ts';

/** One question to the tutor and where its answer stands. */
export interface Turn {
  id: number;
  question: string;
  state: AiState<Answer>;
}

/** Earlier turns sent with a question: enough to follow on, short enough to stay cheap. */
const HISTORY_TURNS = 4;

function historyOf(turns: readonly Turn[]): ConversationTurn[] {
  return turns
    .flatMap((turn) =>
      turn.state.status === 'done'
        ? [{ question: turn.question, answer: turn.state.value.answer }]
        : [],
    )
    .slice(-HISTORY_TURNS);
}

/** The question as the tutor gets it: the topic, the question and the turns before it. */
export function questionInput(
  topic: TutorTopic,
  question: string,
  history: ConversationTurn[],
): QuestionInput {
  const input: QuestionInput = {
    scope: topic.surface ? 'word' : 'sentence',
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

/**
 * A conversation with the tutor about one topic (A4): every question is one request, sent with
 * the answers before it so it can build on them. Each turn keeps its own answer; Retry asks
 * that turn again.
 */
export function useConversation(topic: TutorTopic) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const latest = useRef<Turn[]>([]);
  latest.current = turns;
  const next = useRef(0);
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
