import { type FormEvent, useId, useState } from 'react';
import type { CloudPort } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { deviceName } from '../../ui/device-name.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { reopenApp, useCloudAction } from '../../ui/use-cloud-action.ts';
import styles from './log-in.module.css';

/** Log in with a code sent to the recovery email: the address, then the 6 digits. */
export function EmailWay({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const id = useId();
  const { busy, error, run } = useCloudAction();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const send = (event: FormEvent) => {
    event.preventDefault();
    void run(
      () => cloud.sendLogInCode(email),
      () => setSent(true),
    );
  };
  const verify = (event: FormEvent) => {
    event.preventDefault();
    void run(() => cloud.logInWithCode(email, code, deviceName(navigator.userAgent)), reopenApp);
  };
  return (
    <form className={styles.panel} onSubmit={sent ? verify : send}>
      <EmailField id={`${id}-email`} value={email} locked={sent} onChange={setEmail} />
      {sent && <p className={styles.message}>{t('account.emailSent')}</p>}
      {sent && <CodeField id={`${id}-code`} value={code} onChange={setCode} />}
      <PillButton block type="submit" disabled={busy}>
        {sent ? t('account.codeSubmit') : t('account.emailSend')}
      </PillButton>
      <CloudErrorText error={error} className={styles.error} />
    </form>
  );
}

function CodeField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  return (
    <label className={styles.field} htmlFor={id}>
      {t('account.codeLabel')}
      <input
        id={id}
        className={styles.input}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
      />
    </label>
  );
}

function EmailField(props: {
  id: string;
  value: string;
  locked: boolean;
  onChange: (v: string) => void;
}) {
  const t = useT();
  return (
    <label className={styles.field} htmlFor={props.id}>
      {t('account.emailLabel')}
      <input
        id={props.id}
        className={styles.input}
        type="email"
        autoComplete="email"
        required
        value={props.value}
        readOnly={props.locked}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}
