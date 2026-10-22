import { useId, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import { AiForm, type AiRun, AiSubmit } from '../../ui/ai-action.tsx';
import { AiWriting } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useOnline } from '../../ui/use-online.ts';
import { Picker } from './candidate-picker.tsx';
import styles from './handwrite.module.css';
import { AiProblem, StatusLine } from './status-line.tsx';
import { type AiCandidate, type AiLookup, useDescribe } from './use-ai-lookup.ts';

function reasonsOf(candidates: readonly AiCandidate[]) {
  return Object.fromEntries(candidates.map((c) => [c.char, c.reason ?? '']));
}

function uncheckedOf(candidates: readonly AiCandidate[]) {
  return Object.fromEntries(candidates.map((c) => [c.char, c.unchecked ?? []]));
}

function DescribeResult({ lookup, onRetry }: { lookup: AiLookup; onRetry: AiRun }) {
  const t = useT();
  if (lookup.state === 'idle') return null;
  if (lookup.state === 'asking') {
    return <AiWriting tier="fast">{t('handwrite.lookingFor')}</AiWriting>;
  }
  if (lookup.state === 'failed') {
    const task = t('handwrite.taskDescribe');
    return <AiProblem error={lookup.error} task={task} onRetry={onRetry} />;
  }
  if (lookup.candidates.length === 0) return <StatusLine>{t('handwrite.noneFits')}</StatusLine>;
  const chars = lookup.candidates.map((c) => c.char);
  return (
    <Picker
      key={chars.join('')}
      chars={chars}
      reasons={reasonsOf(lookup.candidates)}
      unchecked={uncheckedOf(lookup.candidates)}
    />
  );
}

/** Describe mode (I5): a description in your own words → AI candidates with reasons. */
export function DescribePanel() {
  const id = useId();
  const [text, setText] = useState('');
  const online = useOnline();
  const { lookup, describe } = useDescribe();
  const t = useT();
  const submit = (client: AiClient) => {
    if (text.trim() !== '') describe(client, text.trim());
  };
  const busy = lookup.state === 'asking';
  return (
    <>
      <AiForm className={styles.describe} onAsk={submit}>
        <label htmlFor={id} className="visually-hidden">
          {t('handwrite.describeLabel')}
        </label>
        <textarea
          id={id}
          className={styles.description}
          placeholder={t('handwrite.describeExample')}
          value={text}
          rows={4}
          onChange={(event) => setText(event.target.value)}
        />
        <AiSubmit
          look="primary"
          block
          label={t('handwrite.find')}
          disabled={busy || !online || text.trim() === ''}
        />
      </AiForm>
      {online ? null : <StatusLine>{t('handwrite.describeOffline')}</StatusLine>}
      <DescribeResult lookup={lookup} onRetry={(client) => describe(client, text.trim())} />
    </>
  );
}
