import { type FormEvent, useEffect, useId, useState } from 'react';
import type { CloudPort } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useCloudAction } from '../../ui/use-cloud-action.ts';
import styles from './settings.module.css';

/** The current recovery email, or a line saying there is none. */
function Current({ email }: { email: string | null | undefined }) {
  const t = useT();
  if (email === undefined) return null;
  return (
    <p className={styles.status}>
      {email ? t('account.emailCurrent', { email }) : t('account.emailNone')}
    </p>
  );
}

interface FieldProps {
  id: string;
  /** The code sent to the new address, once sent; the address before. */
  code: boolean;
  value: string;
  onChange: (value: string) => void;
}

function EmailOrCode({ id, code, value, onChange }: FieldProps) {
  const t = useT();
  if (code)
    return (
      <input
        id={`${id}-code`}
        className={styles.input}
        aria-label={t('account.codeLabel')}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
      />
    );
  return (
    <input
      id={`${id}-email`}
      className={styles.input}
      aria-label={t('account.emailNew')}
      type="email"
      autoComplete="email"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** The address, then the code: what the section shows, and its one submit. */
function useEmailFlow(cloud: CloudPort) {
  const action = useCloudAction();
  const { run } = action;
  const [current, setCurrent] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | undefined>(undefined);
  useEffect(() => void run(() => cloud.email(), setCurrent), [cloud, run]);
  const confirmed = () => {
    setCurrent(sentTo);
    setSentTo(undefined);
    setCode('');
    setEmail('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (sentTo) void run(() => cloud.confirmEmail(code), confirmed);
    else
      void run(
        () => cloud.addEmail(email),
        () => setSentTo(email.trim()),
      );
  };
  const field = { value: sentTo ? code : email, onChange: sentTo ? setCode : setEmail };
  return { ...action, current, sentTo, field, submit };
}

/** The recovery email: a new address, then the code sent to it confirms it. */
export function CloudEmail({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const id = useId();
  const { busy, error, current, sentTo, field, submit } = useEmailFlow(cloud);
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('account.emailTitle')}</h2>
      <Current email={current} />
      <form className={styles.row} onSubmit={submit}>
        <EmailOrCode id={id} code={sentTo !== undefined} {...field} />
        <button type="submit" className={styles.button} disabled={busy}>
          {sentTo ? t('account.emailConfirm') : t('account.emailSendCode')}
        </button>
      </form>
      {sentTo && <p className={styles.status}>{t('account.emailCodeSent', { email: sentTo })}</p>}
      <CloudErrorText error={error} className={styles.status} />
    </section>
  );
}
