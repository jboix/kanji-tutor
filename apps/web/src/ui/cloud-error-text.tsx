import type { CloudReason } from '../domain/cloud.ts';
import { cloudError } from './cloud-errors.ts';
import { useT } from './i18n/i18n.tsx';

/** Why the last cloud call failed, announced, or nothing. */
export function CloudErrorText({
  error,
  className,
}: {
  error: CloudReason | undefined;
  className?: string | undefined;
}) {
  const t = useT();
  if (!error) return null;
  return (
    <p className={className} role="alert">
      {t(cloudError(error))}
    </p>
  );
}
