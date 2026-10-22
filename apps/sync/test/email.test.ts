// @vitest-environment node

import { createTransport } from 'nodemailer';
import { describe, expect, it } from 'vitest';
import { handle } from '../src/app.ts';
import { smtpMailer, smtpOptions } from '../src/mail.ts';
import { call, testDeps } from './fakes.ts';
import { signedInAccount } from './helpers.ts';

async function withEmail(deps: ReturnType<typeof testDeps>, email = 'me@example.com') {
  const phone = await signedInAccount(deps);
  await handle(call('POST', '/email', { token: phone.token, body: { email } }), deps);
  const code = deps.sent.at(-1)?.code ?? '';
  await handle(call('POST', '/email/confirm', { token: phone.token, body: { code } }), deps);
  return phone;
}

describe('email codes (D133)', () => {
  it('confirms a recovery email with a code', async () => {
    const deps = testDeps();
    const phone = await withEmail(deps, ' Me@Example.com ');
    expect(deps.sent[0]?.to).toBe('me@example.com');
    expect((await deps.store.account(phone.accountId))?.email).toBe('me@example.com');
  });

  it('signs a new device in with an emailed code', async () => {
    const deps = testDeps();
    const phone = await withEmail(deps);
    await handle(call('POST', '/email/login', { body: { email: 'me@example.com' } }), deps);
    const code = deps.sent.at(-1)?.code ?? '';
    const verify = await handle(
      call('POST', '/email/login/verify', {
        body: { email: 'me@example.com', code, name: 'New phone' },
      }),
      deps,
    );
    const { token } = (await verify.json()) as { token: string };
    const me = await handle(call('GET', '/me', { token }), deps);
    expect(((await me.json()) as { accountId: string }).accountId).toBe(phone.accountId);
  });

  it('answers the same for an unknown address, and sends nothing', async () => {
    const deps = testDeps();
    const response = await handle(
      call('POST', '/email/login', { body: { email: 'nobody@example.com' } }),
      deps,
    );
    expect(await response.json()).toEqual({ ok: true });
    expect(deps.sent).toHaveLength(0);
  });

  it('allows five tries per code, and five codes per hour', async () => {
    const deps = testDeps();
    await withEmail(deps);
    const email = 'me@example.com';
    await handle(call('POST', '/email/login', { body: { email } }), deps);
    const guess = () =>
      handle(
        call('POST', '/email/login/verify', { body: { email, code: '000000', name: 'x' } }),
        deps,
      );
    for (let i = 0; i < 5; i++) await guess();
    const right = deps.sent.at(-1)?.code ?? '';
    const late = await handle(
      call('POST', '/email/login/verify', { body: { email, code: right, name: 'x' } }),
      deps,
    );
    expect(late.status).toBe(400);
    for (let i = 0; i < 3; i++)
      await handle(call('POST', '/email/login', { body: { email } }), deps);
    const limited = await handle(call('POST', '/email/login', { body: { email } }), deps);
    expect(limited.status).toBe(429);
  });
});

describe('the SMTP mailer', () => {
  const settings = {
    SMTP_HOST: 'mail.example.com',
    SMTP_PORT: 465,
    MAIL_FROM: 'Kanji Tutor <codes@example.com>',
  };

  it('is off, with a 503, until a server and a sender are set', async () => {
    await expect(smtpMailer({ SMTP_PORT: 465 })('me@example.com', '123456')).rejects.toMatchObject({
      status: 503,
    });
  });

  it('sends the code from the sender, built by nodemailer without a network', async () => {
    const json = createTransport({ jsonTransport: true });
    const messages: string[] = [];
    const transport = {
      sendMail: async (mail: Parameters<typeof json.sendMail>[0]) => {
        const info = await json.sendMail(mail);
        messages.push(info.message);
        return info;
      },
    };
    await smtpMailer(settings, transport)('me@example.com', '123456');
    expect(JSON.parse(messages[0] ?? '{}')).toMatchObject({
      from: { address: 'codes@example.com', name: 'Kanji Tutor' },
      to: [{ address: 'me@example.com' }],
      subject: 'Kanji Tutor code: 123456',
      text: expect.stringContaining('123456'),
    });
  });

  it('answers 502 when the server refuses the message', async () => {
    const refusing = { sendMail: () => Promise.reject(new Error('550 rejected')) };
    await expect(smtpMailer(settings, refusing)('me@example.com', '1')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('always encrypts: TLS on 465, STARTTLS required elsewhere, a login only with a user', () => {
    expect(smtpOptions({ ...settings, SMTP_USER: 'codes', SMTP_PASS: 'pw' })).toMatchObject({
      secure: true,
      requireTLS: true,
      auth: { user: 'codes', pass: 'pw' },
    });
    expect(smtpOptions({ ...settings, SMTP_PORT: 587 })).toMatchObject({
      secure: false,
      requireTLS: true,
      auth: undefined,
    });
  });
});
