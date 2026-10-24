import { useLocation } from 'react-router';
import type { AiClient } from '../../ai/types.ts';
import type { ComposeTarget } from '../../domain/services/index.ts';
import { ActionBar, ActionHint, ActionRow } from '../../ui/action-bar.tsx';
import { AiAction } from '../../ui/ai-action.tsx';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { AddGrammarForm } from './add-grammar-form.tsx';
import styles from './compose.module.css';
import { headerLine } from './compose-copy.ts';
import { CorrectionView, Prose } from './correction-view.tsx';
import { DraftEditor, ErrorLine } from './draft-editor.tsx';
import { useComposeTarget } from './use-compose-target.ts';
import { type Composer, useComposer } from './use-composer.ts';

function ComposeTopBar({ target }: { target?: ComposeTarget }) {
  const t = useT();
  return (
    <TopBar
      start={<BackButton parent={paths.add} label={t('common.back')} />}
      center={<h1 className={styles.title}>{headerLine(t, target)}</h1>}
    />
  );
}

function Footer({ composer }: { composer: Composer }) {
  const { correction, busy, text } = composer;
  const t = useT();
  if (!correction) {
    return (
      <ActionBar>
        <AiAction
          look="primary"
          label={busy ? t('compose.checking') : t('compose.check')}
          disabled={busy || text.trim() === ''}
          run={(client) => void composer.check(client)}
          peek={composer.peek}
        />
      </ActionBar>
    );
  }
  return (
    <ActionBar>
      <ActionRow>
        <PillButton variant="secondary" disabled={busy} onClick={composer.rewrite}>
          {t('compose.rewrite')}
        </PillButton>
        <PillButton grow={1.4} disabled={busy} onClick={() => void composer.accept()}>
          {t('compose.accept')}
        </PillButton>
      </ActionRow>
      <ActionHint>{t('compose.acceptHint')}</ActionHint>
    </ActionBar>
  );
}

/** "Saved to your sentences.", handed over by the sentence just accepted. */
function SavedNotice() {
  const state: unknown = useLocation().state;
  const notice =
    typeof state === 'object' && state !== null && 'notice' in state ? String(state.notice) : '';
  if (!notice) return null;
  return (
    <p className={styles.prompt} role="status">
      {notice}
    </p>
  );
}

function Composing({ target }: { target: ComposeTarget }) {
  const composer = useComposer(target);
  const { grammar } = target;
  const { t, rich } = useI18n();
  return (
    <Screen
      topBar={<ComposeTopBar target={target} />}
      top={16}
      footer={<Footer composer={composer} />}
    >
      <SavedNotice />
      <div className={styles.heading}>
        <p lang="ja" className={styles.pattern}>
          {grammar.pattern}
        </p>
        <p className={styles.meaning}>
          {rich('compose.meaningQuoted', { meaning: <Prose text={grammar.meaning} /> })}
        </p>
        <p className={styles.prompt}>{t('compose.prompt')}</p>
      </div>
      <ComposeBody composer={composer} pattern={grammar.pattern} />
    </Screen>
  );
}

/** The draft, or the tutor's correction; a tutor problem with its countdown and Retry (A14). */
function ComposeBody({ composer, pattern }: { composer: Composer; pattern: string }) {
  const retry = (client: AiClient) => void composer.check(client);
  const { correction, error, waitMs } = composer;
  if (!correction) {
    return (
      <DraftEditor
        text={composer.text}
        onChange={composer.setText}
        error={error}
        waitMs={waitMs}
        onRetry={retry}
        disabled={composer.busy}
      />
    );
  }
  return (
    <>
      {error && <ErrorLine kind={error} waitMs={waitMs} onRetry={retry} />}
      <CorrectionView text={composer.text} correction={correction} pattern={pattern} />
    </>
  );
}

/** Use it (A6, compose.html): write one sentence with a grammar point, get red-pen notes. */
export function ComposeScreen() {
  const [state, reload] = useComposeTarget();
  if (state.status === 'ready')
    return <Composing key={state.target.grammar.id} target={state.target} />;
  return (
    <Screen topBar={<ComposeTopBar />} top={16}>
      {state.status === 'none' && (
        <AddGrammarForm lesson={state.lesson} onAdded={() => void reload()} />
      )}
    </Screen>
  );
}
