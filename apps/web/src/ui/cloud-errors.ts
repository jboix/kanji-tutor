import type { CloudReason } from '../domain/cloud.ts';
import type { PlainKey } from './i18n/types.ts';

/** What to tell the person when a cloud call fails, by reason. */
export const CLOUD_ERRORS: Record<CloudReason, PlainKey> = {
  offline: 'account.errorOffline',
  server: 'account.errorServer',
  'signed-out': 'account.errorSignedOut',
  'invite-needed': 'account.errorInviteNeeded',
  'passkey-cancelled': 'account.errorPasskeyCancelled',
  'passkey-refused': 'account.errorPasskeyRefused',
  'passkey-unknown': 'account.errorPasskeyUnknown',
  'challenge-expired': 'account.errorChallengeExpired',
  'code-expired': 'account.errorCodeExpired',
  'code-used': 'account.errorCodeUsed',
  'code-wrong': 'account.errorCodeWrong',
  'email-off': 'account.errorEmailOff',
  'email-failed': 'account.errorEmailFailed',
  'email-taken': 'account.errorEmailTaken',
  'too-many-codes': 'account.errorTooManyCodes',
  'slow-down': 'account.errorSlowDown',
  'bad-request': 'account.errorBadRequest',
};

/** The message for `reason`, or the general one for a reason this app does not know. */
export const cloudError = (reason: CloudReason): PlainKey =>
  CLOUD_ERRORS[reason] ?? 'account.errorServer';
