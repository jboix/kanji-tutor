import type { ReactNode } from 'react';
import styles from './external-link.module.css';
import { type ExternalSite, SITE_NAMES, tatoebaSentenceUrl } from './external-links.ts';
import { useI18n, useT } from './i18n/i18n.tsx';
import { ExternalIcon } from './icons.tsx';
import { useOnline } from './use-online.ts';

export interface ExternalLinkProps {
  site: ExternalSite;
  /** Built with `external-links.ts`. */
  href: string;
  /** What is looked up, for the label: "Open 待 on Jisho (new tab)". */
  subject?: string;
  /** Only the arrow, for a dense row; the label still names the site. */
  compact?: boolean;
}

/**
 * A link to an outside reference (R9) in a new tab, with no referrer. Offline it is muted and
 * says it needs a connection; it stays a link, since the connection may come back.
 */
export function ExternalLink({ site, href, subject, compact = false }: ExternalLinkProps) {
  const t = useT();
  const online = useOnline();
  const name = SITE_NAMES[site];
  const open = subject
    ? t('ui.externalOpenWhat', { what: subject, site: name })
    : t('ui.externalOpen', { site: name });
  const label = online ? open : t('ui.externalOffline', { label: open });
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={online ? styles.link : styles.offline}
      data-site={site}
    >
      {!compact && <span lang="en">{name}</span>}
      <ExternalIcon />
      {!online && !compact && <span className={styles.note}>{t('ui.externalNeedsNet')}</span>}
    </a>
  );
}

/** A quiet row of outside links: "Jisho ↗ Wiktionary ↗". */
export function ExternalLinks({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/** "Sentence from Tatoeba ↗" for a pack sentence that came from Tatoeba; nothing otherwise. */
export function SentenceSource(props: { source: string; sourceRef?: string | undefined }) {
  const { source, sourceRef } = props;
  const { rich } = useI18n();
  if (source !== 'tatoeba' || !sourceRef) return null;
  const link = (
    <ExternalLink site="tatoeba" href={tatoebaSentenceUrl(sourceRef)} subject={`#${sourceRef}`} />
  );
  return <p className={styles.source}>{rich('ui.sourceFrom', { site: link })}</p>;
}
