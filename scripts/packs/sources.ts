/**
 * Pinned inputs of the pack pipeline. Every file is downloaded once into the git-ignored
 * `data/raw/` and checked against its sha256 before use, so a build is reproducible.
 *
 * Tatoeba exports are rebuilt weekly and not versioned: their URLs always serve the latest dump.
 * The hashes below are those of the dump downloaded on `TATOEBA_DATE`. To move to a newer dump,
 * delete the three Tatoeba files from `data/raw/`, run `bun run packs --refresh-tatoeba`, and
 * copy the printed hashes and date here.
 */

export interface Source {
  /** Short id used in logs. */
  id: string;
  /** File name inside `data/raw/`. */
  file: string;
  url: string;
  sha256: string;
  /** Licence of the data. */
  licence: string;
  /** True when the URL serves a moving target (Tatoeba weekly exports). */
  moving?: boolean;
}

export const JMDICT_SIMPLIFIED_TAG = '3.6.2+20261012204142';
export const TATOEBA_DATE = '2026-10-17';
/** Commit of github.com/stephenmk/yomitan-jlpt-vocab (Waller JLPT lists with JMdict ids). */
export const JLPT_COMMIT = 'b062d4e38c4bdd0950ae1d4ec55f04b176182e03';

const JMDICT_BASE = `https://github.com/scriptin/jmdict-simplified/releases/download/${encodeURIComponent(
  JMDICT_SIMPLIFIED_TAG,
)}`;
const TATOEBA_BASE = 'https://downloads.tatoeba.org/exports/per_language';
const JLPT_BASE = `https://raw.githubusercontent.com/stephenmk/yomitan-jlpt-vocab/${JLPT_COMMIT}/original_data`;

const EDRDG = 'CC BY-SA 4.0 (EDRDG)';
const TATOEBA = 'CC BY 2.0 FR (Tatoeba)';
const WALLER = 'CC BY (Jonathan Waller) / CC BY-SA 4.0 (stephenmk)';

function jmdictSimplified(name: string, sha256: string): Source {
  const file = `${name}-${JMDICT_SIMPLIFIED_TAG}.json.tgz`;
  return {
    id: name,
    file,
    url: `${JMDICT_BASE}/${name}-${encodeURIComponent(JMDICT_SIMPLIFIED_TAG)}.json.tgz`,
    sha256,
    licence: EDRDG,
  };
}

function jlpt(level: number, sha256: string): Source {
  return {
    id: `jlpt-n${level}`,
    file: `jlpt-n${level}.csv`,
    url: `${JLPT_BASE}/n${level}.csv`,
    sha256,
    licence: WALLER,
  };
}

/** A Tatoeba per-language export, e.g. `fra/fra_sentences` → fra_sentences.tsv.bz2. */
function tatoeba(path: string, sha256: string): Source {
  const file = `${path.split('/')[1]}.tsv.bz2`;
  return {
    id: `tatoeba-${path.split('/')[1]}`,
    file,
    url: `${TATOEBA_BASE}/${path}.tsv.bz2`,
    sha256,
    licence: TATOEBA,
    moving: true,
  };
}

export const SOURCES = {
  jmdict: jmdictSimplified(
    'jmdict-eng',
    '4e742f7d5b0c59e6818c545b73ed3ca71618878de11f54876d3aa43a5f0cafa9',
  ),
  kanjidic: jmdictSimplified(
    'kanjidic2-en',
    'd3d6858b154fba544dba92bfab66531e0c381937edc83fcfb4b903fe4c2853ce',
  ),
  kradfile: jmdictSimplified(
    'kradfile',
    'd96943906af809402e1c9bf80f16f07dda4fbd525b4c67332105f4e358ce6cce',
  ),
  jpnSentences: {
    id: 'tatoeba-jpn',
    file: 'jpn_sentences.tsv.bz2',
    url: `${TATOEBA_BASE}/jpn/jpn_sentences.tsv.bz2`,
    sha256: '9b2f0c18f58a5633a0dfba22b6a5f7a2bbbd55f649aeafcc31107d1be5cc5c2b',
    licence: TATOEBA,
    moving: true,
  },
  engSentences: {
    id: 'tatoeba-eng',
    file: 'eng_sentences.tsv.bz2',
    url: `${TATOEBA_BASE}/eng/eng_sentences.tsv.bz2`,
    sha256: 'bb3dcc28a8984a26dc466ee14eb53c4210b0dd9bb111b9d686d1efc83ecf091c',
    licence: TATOEBA,
    moving: true,
  },
  links: {
    id: 'tatoeba-jpn-eng-links',
    file: 'jpn-eng_links.tsv.bz2',
    url: `${TATOEBA_BASE}/jpn/jpn-eng_links.tsv.bz2`,
    sha256: '0ba61c4a04647d246f388a71b630c009f85bd45ff5b93052e186a22e7e14299b',
    licence: TATOEBA,
    moving: true,
  },
  jmdictFre: jmdictSimplified(
    'jmdict-fre',
    'b5070866c0a6b657a326503459c58d3f4358597c48b47894480a40731d453cdc',
  ),
  jmdictSpa: jmdictSimplified(
    'jmdict-spa',
    'e8f61bd6df52f81e7ab89e6df463ef4b2f657319e1e5af3d61398a0d01c73b4f',
  ),
  fraSentences: tatoeba(
    'fra/fra_sentences',
    'b49a8777f4be14ba765eb591b7f4136b684e9d5a88a3b028a0ebcf172e1f6326',
  ),
  spaSentences: tatoeba(
    'spa/spa_sentences',
    'a11b96f9e2d20d24cd8bc72e54656e0ef5597fe0d5c59b9e91a5a0b14f4c1e14',
  ),
  fraLinks: tatoeba(
    'jpn/jpn-fra_links',
    '19a8cf8123a3ceccd7a7139aa0990536a8ed2be022297999e69bd7d598cb4501',
  ),
  spaLinks: tatoeba(
    'jpn/jpn-spa_links',
    '7d55b09e8913b1577366c77a9de145fa07daf42fdfc2e39f7727e8c99e3a37dd',
  ),
  jlpt5: jlpt(5, '07dc6f197b51cc076c65c3c9f23218d10c2b67f76545f5c1c4d9e3750495533a'),
  jlpt4: jlpt(4, 'a14dcc7fdc02259b22331a486c6ff66df74c16472c8aeb5a0ebe7e5fa8ee8eb4'),
  jlpt3: jlpt(3, 'bd4d68c59cfee861351e1bdf9d99818e434392201eabbed4d3657225fe53a3ac'),
  jlpt2: jlpt(2, '42a4413326e857d701dc9659b2711637ab612304a339fe0d09f4f0f042d3a214'),
  jlpt1: jlpt(1, '7a58f0584e9ec2b0299ccb9b109f3bd03e08b90d129a714307c0a1cb72f07b32'),
} satisfies Record<string, Source>;
