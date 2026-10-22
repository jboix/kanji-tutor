import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useT } from '../ui/i18n/i18n.tsx';
import { PillButton } from '../ui/pill-button.tsx';
import { Screen } from '../ui/screen.tsx';
import { isStaleChunk, reloadOnce } from './stale-chunks.ts';

/**
 * A route's error screen. A screen chunk missing after a new build reloads the page once, at the
 * address being opened; anything else gets a plain message and a Reload button.
 */
export function RouteError() {
  const error = useRouteError();
  const t = useT();
  const stale = isStaleChunk(error);
  useEffect(() => {
    if (stale) reloadOnce();
  }, [stale]);
  return (
    <Screen>
      <h1>{t('common.errorTitle')}</h1>
      <p>{t('common.errorBody')}</p>
      <PillButton type="button" onClick={() => location.reload()}>
        {t('common.reload')}
      </PillButton>
    </Screen>
  );
}
