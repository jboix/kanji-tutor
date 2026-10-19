import type { ReactNode } from 'react';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import styles from './credits.module.css';
import settings from './settings.module.css';

const EDRDG = 'https://www.edrdg.org/';
const REPO = 'https://github.com/jboix/kanji-reader';

/** Proper names, the same in every language. */
const NAMES = {
  edrdg: 'EDRDG',
  jlpt: 'yomitan-jlpt-vocab',
  canvas: 'KanjiCanvas',
  github: 'GitHub',
};

const BY_SA = { name: 'CC BY-SA 4.0', href: 'https://creativecommons.org/licenses/by-sa/4.0/' };

/** The full licence texts, written by `bun run credits`, served beside the app. */
const LICENCES_FILE = 'third-party-licenses.txt';

interface Credit {
  what: PlainKey;
  by: (rich: ReturnType<typeof useI18n>['rich']) => ReactNode;
  licence: { name: string; href?: string };
}

const CREDITS: readonly Credit[] = [
  {
    what: 'settings.creditsDictionary',
    by: (rich) =>
      rich('settings.creditsDictionaryBy', {
        jmdict: <a href={`${EDRDG}wiki/index.php/JMdict-EDICT_Dictionary_Project`}>JMdict</a>,
        kanjidic: <a href={`${EDRDG}wiki/index.php/KANJIDIC_Project`}>KANJIDIC2</a>,
        edrdg: <a href={EDRDG}>{NAMES.edrdg}</a>,
      }),
    licence: { name: BY_SA.name, href: `${EDRDG}edrdg/licence.html` },
  },
  {
    what: 'settings.creditsJlpt',
    by: (rich) =>
      rich('settings.creditsJlptBy', {
        link: <a href="https://github.com/stephenmk/yomitan-jlpt-vocab">{NAMES.jlpt}</a>,
      }),
    licence: BY_SA,
  },
  {
    what: 'settings.creditsSentences',
    by: () => <a href="https://tatoeba.org/">Tatoeba</a>,
    licence: { name: 'CC BY 2.0 FR', href: 'https://creativecommons.org/licenses/by/2.0/fr/' },
  },
  {
    what: 'settings.creditsHandwriting',
    by: (rich) =>
      rich('settings.creditsHandwritingBy', {
        link: <a href="https://github.com/asdfjkl/kanjicanvas">{NAMES.canvas}</a>,
      }),
    licence: { name: 'MIT' },
  },
  {
    what: 'settings.creditsFonts',
    by: () => 'Klee One, Zen Kaku Gothic New',
    licence: { name: 'SIL OFL 1.1', href: 'https://openfontlicense.org/' },
  },
  {
    what: 'settings.creditsLibraries',
    by: () =>
      'React, React Router, Dexie, kuromoji (IPADIC), ts-fsrs, WanaKana, Zod, Workbox, Google Gen AI SDK',
    licence: { name: 'MIT · Apache-2.0' },
  },
  {
    what: 'settings.creditsApp',
    by: (rich) => rich('settings.creditsAppBy', { link: <a href={REPO}>{NAMES.github}</a> }),
    licence: { name: 'MIT', href: `${REPO}/blob/main/LICENSE` },
  },
];

function Licence({ name, href }: Credit['licence']) {
  if (!href) return <span className={styles.licence}>{name}</span>;
  return (
    <a className={styles.licence} href={href}>
      {name}
    </a>
  );
}

/** What the app is built on, with each licence, and the full texts to download (IA5). */
export function CreditsSection() {
  const { t, rich } = useI18n();
  return (
    <section className={settings.section} aria-labelledby="credits">
      <h2 id="credits" className={settings.label}>
        {t('settings.credits')}
      </h2>
      <ul className={styles.list}>
        {CREDITS.map((credit) => (
          <li key={credit.what} className={styles.item}>
            <span className={styles.what}>{t(credit.what)}</span>
            <span className={styles.by}>{credit.by(rich)}</span>
            <Licence {...credit.licence} />
          </li>
        ))}
      </ul>
      <a
        className={`${settings.button} ${styles.download}`}
        href={`${import.meta.env.BASE_URL}${LICENCES_FILE}`}
        download="kanji-tutor-licences.txt"
      >
        {t('settings.creditsDownload')}
      </a>
    </section>
  );
}
