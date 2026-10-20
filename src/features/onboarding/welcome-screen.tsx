import { useEffect, useLayoutEffect, useState } from 'react';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { dropLaunch } from '../../ui/launch.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import styles from './welcome.module.css';
import { WelcomeLogo } from './welcome-logo.tsx';

/** The animation plays once per launch; coming back with Back shows the last frame. */
let played = false;

/** Any tap or key during the animation jumps to its last frame, so Start never waits. */
function useSkip(): boolean {
  const [skipped, setSkipped] = useState(played);
  useEffect(() => {
    played = true;
    if (skipped) return;
    const skip = () => setSkipped(true);
    const events = ['pointerdown', 'keydown'] as const;
    for (const name of events) document.addEventListener(name, skip, { once: true });
    return () => {
      for (const name of events) document.removeEventListener(name, skip);
    };
  }, [skipped]);
  return skipped;
}

/**
 * The welcome (P5, D134, D135), on a first launch only and with no launch screen before it: the
 * icon writes 漢 and the tutor stamps its seal and adds the reading, in about three seconds, then
 * the name, "Read Japanese with an AI tutor at your side" (as the social preview) and Start.
 * Reduced motion shows the last frame at once.
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { t, rich } = useI18n();
  const skipped = useSkip();
  // The welcome is its own opening: no launch screen before it (D135).
  useLayoutEffect(dropLaunch, []);
  return (
    <div className={styles.welcome} data-skipped={skipped || undefined}>
      <Screen
        enter={false}
        footer={
          <div className={styles.actions}>
            <PillButton block onClick={onStart}>
              {t('onboarding.welcomeStart')}
            </PillButton>
          </div>
        }
      >
        <div className={styles.stage}>
          <p className={styles.reading} lang="ja" aria-hidden="true">
            <span>か</span>
            <span>ん</span>
          </p>
          <WelcomeLogo id="welcome-glyph" />
          <h1 className={styles.name}>{t('onboarding.welcomeName')}</h1>
          <p className={styles.tagline}>
            {rich('onboarding.welcomeTagline', {
              tutor: <em className={styles.tutor}>{t('onboarding.welcomeTutor')}</em>,
            })}
          </p>
        </div>
      </Screen>
    </div>
  );
}
