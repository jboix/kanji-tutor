<h1>
  <img src="apps/web/public/icons/icon.svg" width="44" height="44" align="absmiddle" alt="">
  Kanji Tutor
</h1>

[![Quality](https://github.com/jboix/kanji-tutor/actions/workflows/quality.yml/badge.svg)](https://github.com/jboix/kanji-tutor/actions/workflows/quality.yml)
[![Release](https://github.com/jboix/kanji-tutor/actions/workflows/release.yml/badge.svg)](https://github.com/jboix/kanji-tutor/actions/workflows/release.yml)
[![version](https://img.shields.io/github/v/release/jboix/kanji-tutor?label=version)](https://github.com/jboix/kanji-tutor/releases/latest)
[![bun](https://img.shields.io/badge/bun-1.4.2-brightgreen)](https://bun.sh)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

A phone-first web app for reading Japanese, from the first kanji up to JLPT N3. It teaches kanji
through words in real sentences, schedules reviews with FSRS, and can put an AI tutor beside each
exercise. Everything stays in your browser.

Open it at [app.kanjitutor.ch](https://app.kanjitutor.ch/) and add it to
your home screen. It works offline.

## Use it

On first run the app loads its dictionary packs into the browser. Tell it what you already know
(JLPT N5 or N4, a textbook lesson, or your own word list), then press **Start**. Reading, the
dictionary, kanji pages and handwriting work without an account and without a key.

The AI tutor (explanations, photo capture, voice answers, weekly notes) needs your own Gemini API
key: open **Settings → AI tutor**, paste a key from
[Google AI Studio](https://aistudio.google.com/apikey) and press **Test key**. The key stays in
this browser; it is never in the build or a backup.

Your data lives in this browser. **Settings → Backup and storage** saves it to a file and restores it.
With an invite, [cloud saves](apps/sync/README.md) keep it in step on all your devices.

## Run it locally

You need [Bun](https://bun.sh) at the version in `.tool-versions`.

```sh
bun install
bun run dev        # http://localhost:5173
```

[Contributing](docs/CONTRIBUTING.md) lists the checks, the layout and the data pipeline.

## Licences

The code is under the [MIT licence](./LICENSE). The data keeps its own licences:

- JMdict, KANJIDIC2 and KRADFILE: [EDRDG](https://www.edrdg.org/edrdg/licence.html), CC BY-SA 4.0.
- Example sentences: [Tatoeba](https://tatoeba.org), CC BY 2.0 FR.
- JLPT lists: Jonathan Waller (CC BY), via yomitan-jlpt-vocab (CC BY-SA 4.0).
- Stroke paths of the loading kanji: [KanjiVG](https://kanjivg.tagaini.net) by Ulrich Apel, CC BY-SA 3.0.
- Handwriting recognition: adapted from [KanjiCanvas](https://github.com/asdfjkl/kanjicanvas) (MIT).
- Fonts: Klee One and Zen Kaku Gothic New (SIL OFL).

The app shows these in **Settings → About**.
