import { type FormEvent, useId, useState } from 'react';
import type { CloudPort, LinkRequest } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useCloudAction } from '../../ui/use-cloud-action.ts';
import styles from './settings.module.css';

/** "K7F29Q" or "k7f-29q" as the server writes it: "K7F-29Q". */
const normalCode = (text: string) => {
  const letters = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return letters.length === 6 ? `${letters.slice(0, 3)}-${letters.slice(3)}` : letters;
};

interface AskProps {
  name: string;
  busy: boolean;
  onApprove: () => void;
  onCancel: () => void;
}

function LinkAsk({ name, busy, onApprove, onCancel }: AskProps) {
  const t = useT();
  return (
    <div className={styles.confirm}>
      <p className={styles.status}>{t('account.linkAsk', { name })}</p>
      <div className={styles.row}>
        <button type="button" className={styles.primary} onClick={onApprove} disabled={busy}>
          {t('account.linkApprove')}
        </button>
        <button type="button" className={styles.button} onClick={onCancel}>
          {t('account.cancel')}
        </button>
      </div>
    </div>
  );
}

/** The code typed, who asks with it, and letting them in. */
function useLinkApproval(cloud: CloudPort) {
  const action = useCloudAction();
  const { run } = action;
  const [code, setCode] = useState('');
  const [asking, setAsking] = useState<LinkRequest | undefined>(undefined);
  const [approved, setApproved] = useState<string | undefined>(undefined);
  const lookUp = (event: FormEvent) => {
    event.preventDefault();
    setApproved(undefined);
    void run(() => cloud.peekLink(normalCode(code)), setAsking);
  };
  const letIn = () => {
    setApproved(asking?.name);
    setAsking(undefined);
    setCode('');
  };
  const approve = () => void run(() => cloud.approveLink(normalCode(code)), letIn);
  return { ...action, code, setCode, asking, setAsking, approved, lookUp, approve };
}

/**
 * Link a device: the code the new device shows, then who asks, then letting it in. Seeing the
 * name before approving is the check: never approve a code someone else sent you.
 */
export function CloudLink({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const id = useId();
  const { busy, error, code, setCode, asking, setAsking, approved, lookUp, approve } =
    useLinkApproval(cloud);
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('account.linkTitle')}</h2>
      <p className={styles.hint}>{t('account.linkHint')}</p>
      <form className={styles.row} onSubmit={lookUp}>
        <input
          id={`${id}-code`}
          className={styles.input}
          aria-label={t('account.linkCodeLabel')}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="submit" className={styles.button} disabled={busy || !code.trim()}>
          {t('account.linkLookUp')}
        </button>
      </form>
      {asking && (
        <LinkAsk
          name={asking.name}
          busy={busy}
          onApprove={approve}
          onCancel={() => setAsking(undefined)}
        />
      )}
      {approved && (
        <p className={styles.status} role="status">
          {t('account.linkApproved', { name: approved })}
        </p>
      )}
      <CloudErrorText error={error} className={styles.status} />
    </section>
  );
}
