import { createTransport, type Transporter } from 'nodemailer';
import { HttpError } from './http.ts';

/** Sends one email code; the server uses SMTP, tests pass a fake. */
export type Mailer = (to: string, code: string) => Promise<void>;

/** The mail settings from `.env`: any SMTP server, such as the one hosting the domain's mail. */
export type MailSettings = {
  SMTP_HOST?: string | undefined;
  SMTP_PORT: number;
  SMTP_USER?: string | undefined;
  SMTP_PASS?: string | undefined;
  MAIL_FROM?: string | undefined;
};

const text = (code: string) =>
  `Your Kanji Tutor code is ${code}.\n\nIt works for 10 minutes. If you did not ask for it, ignore this email.`;

/** Always encrypted: TLS from the start on 465, STARTTLS required on any other port. */
export const smtpOptions = (env: MailSettings) => ({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  requireTLS: true,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

/** The mailer over SMTP, or a 503 without a server and a sender: email codes are then off. */
export function smtpMailer(
  env: MailSettings,
  transport: Pick<Transporter, 'sendMail'> = createTransport(smtpOptions(env)),
): Mailer {
  return async (to, code) => {
    if (!env.SMTP_HOST || !env.MAIL_FROM) throw new HttpError(503, 'email-off');
    const message = {
      from: env.MAIL_FROM,
      to,
      subject: `Kanji Tutor code: ${code}`,
      text: text(code),
    };
    await transport.sendMail(message).catch(() => {
      throw new HttpError(502, 'email-failed');
    });
  };
}
