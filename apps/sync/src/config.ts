import { z } from 'zod';

/**
 * The server's settings, from the environment (`.env`, read by Docker Compose). It refuses to
 * start without the app's origin and a 32-byte save key.
 */
const isKey = (key: string) => {
  try {
    return atob(key).length === 32;
  } catch {
    return false;
  }
};

const SCHEMA = z.object({
  APP_ORIGIN: z.string().url(),
  /** Where the app lives, for invite links: by default the origin's root. */
  APP_URL: z.string().url().optional(),
  /**
   * The passkeys' relying party: the app's host name or a domain above it (`kanjitutor.ch` for
   * `app.kanjitutor.ch`), so passkeys still work if the app moves to another subdomain.
   */
  RP_ID: z.string().optional(),
  SAVE_KEY: z.string().refine(isKey, 'SAVE_KEY: 32 bytes, base64 (openssl rand -base64 32)'),
  DB_PATH: z.string().default('/data/sync.db'),
  PORT: z.coerce.number().int().default(3000),
  /** The caps, each with a default that suits invite-only use. */
  RATE_PER_MINUTE: z.coerce.number().int().positive().default(120),
  SIGNED_OUT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  SAVES_PER_HOUR: z.coerce.number().int().positive().default(120),
  MAX_BODY_KB: z.coerce.number().int().positive().default(64),
  MAX_SAVE_MB: z.coerce.number().int().positive().default(50),
  MAX_DEVICES: z.coerce.number().int().positive().default(20),
  /** Set by the image to the release it was built from; `dev` when run from the source. */
  SYNC_VERSION: z.string().default('dev'),
  /** Email codes, over any SMTP server; without a host and a sender, email is off. */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

export type Config = z.infer<typeof SCHEMA> & {
  APP_URL: string;
  RP_ID: string;
};

export function readConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = SCHEMA.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Bad server settings: ${problems.join('; ')}`);
  }
  const host = new URL(parsed.data.APP_ORIGIN).hostname;
  const { APP_URL = `${parsed.data.APP_ORIGIN}/`, RP_ID = host } = parsed.data;
  if (host !== RP_ID && !host.endsWith(`.${RP_ID}`)) {
    throw new Error(`Bad server settings: RP_ID: ${RP_ID} is not ${host} or a domain above it`);
  }
  return { ...parsed.data, APP_URL, RP_ID };
}
