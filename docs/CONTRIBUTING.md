# Contributing to Kanji Tutor

Thanks for contributing. Agents working in this repository also follow
[CLAUDE.md](../CLAUDE.md). Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Setup

You need Bun at the version in `.tool-versions`.

```sh
bun install
bun run dev        # http://localhost:5173
bun run check      # everything CI checks
bun run test:e2e   # Playwright, mock AI (the full suite)
```

`check` runs:

| Step                   | Tool               | Checks                                                |
| ---------------------- | ------------------ | ----------------------------------------------------- |
| `bun run typecheck`    | tsc                | Type errors, strict with `exactOptionalPropertyTypes` |
| `bun run lint`         | Biome              | Formatting, lint rules, complexity and length limits  |
| `bun run docs:check`   | remark             | Markdown formatting, broken links                     |
| `bun run arch`         | dependency-cruiser | Layer rules and cycles                                |
| `bun run arch:fixture` | dependency-cruiser | The layer rules still catch a known violation         |
| `bun run knip`         | knip               | Dead code, unused exports and dependencies            |
| `bun run test`         | Vitest             | Unit and component tests, with coverage               |
| `bun run build`        | Vite               | The PWA builds                                        |
| `bun run size`         | -                  | The app shell stays under 300 KB gzipped              |

`bun run test:e2e` runs Playwright at 390×844 and 360×740 against a build with the mock AI
provider. Tests never call a real AI. CI runs a quick subset on every pull request and push to
`main` (`bun run test:e2e:smoke`: the app starts, navigation, a reading session and the
accessibility scans), and the full suite nightly, on a pull request labelled `e2e`, and before
every release.

## Layout

The repository is a Bun workspace: one install and one lockfile at the root, which also holds
the shared tools (TypeScript, Biome, commitlint, dependency-cruiser, knip, remark). Each app has
its own `package.json` with its own dependencies.

| Path                     | Contents                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `apps/web`               | The PWA: Vite, React and Dexie                                                     |
| `apps/web/src/app`       | Startup, routes, wiring of the services                                            |
| `apps/web/src/features`  | One folder per screen or flow; features never import each other                    |
| `apps/web/src/domain`    | Pure TypeScript: scheduling, sessions, grading. No React, Dexie or network         |
| `apps/web/src/lang`      | Japanese: tokenizer, readings, kana input, conjugation                             |
| `apps/web/src/ai`        | The Gemini provider, its prompts, and the mock provider with its fixtures          |
| `apps/web/src/data`      | Dexie (IndexedDB) repositories and the dictionary packs                            |
| `apps/web/src/ui`        | Shared components, tokens and the typed message catalogues (en, fr, es)            |
| `apps/web/scripts/packs` | The data pipeline that builds `apps/web/public/packs`                              |
| `apps/web/tests/e2e`     | Playwright tests                                                                   |
| `apps/sync`              | The cloud-save server: Bun, Hono and SQLite ([its README](../apps/sync/README.md)) |

The layers are `features → domain | lang | ai | ui`, `ai → lang | data`. dependency-cruiser fails
the check when an import crosses them, or when one app imports the other. The root scripts run
the apps' own (`bun run dev`, `bun run sync:dev`); inside an app folder, `bun run <script>` runs
its scripts directly.

## Data packs

`apps/web/public/packs` is built from pinned JMdict, KANJIDIC2, KRADFILE, Tatoeba and JLPT sources
(`apps/web/scripts/packs/sources.ts`).

```sh
bun run packs                    # downloads into apps/web/data/raw/ (git-ignored), prunes, emits packs
bun run packs --refresh-tatoeba  # accept a newer weekly Tatoeba export
bun run packs --keep-previous    # set the current pack aside in public/packs/previous/ first
bun run packs:measure [previous] # sentence quality figures of the current (or previous) pack
```

A pack set aside with `--keep-previous` stays loadable until the new one has been checked:
`VITE_PACKS=previous bun run dev` (or `bun run build`) loads it instead of the current one.
Delete `public/packs/previous/` once the new pack is accepted.

The loader's kanji (`apps/web/src/ui/loader-kanji.ts`) carry stroke paths taken unchanged from
[KanjiVG](https://kanjivg.tagaini.net) (CC BY-SA 3.0), for a small curated set; any download goes
under `apps/web/data/raw/`.

Never commit `apps/web/data/raw/` or any textbook content.

`bun run credits` writes `apps/web/public/third-party-licenses.txt`, the licence texts that Settings →
About offers for download. Run it after adding or updating a runtime dependency; a test fails
when the file is out of date.

## Git hooks

`bun install` installs the hooks (husky):

- **pre-commit**: Biome on the staged files.
- **commit-msg**: commitlint.
- **pre-push**: the full `bun run check`.

## Commits

Conventional Commits (`type(scope): description`), in lower case, enforced locally and in CI.
Each commit passes `bun run check` on its own.

semantic-release cuts a release from the commit history when the Release workflow runs, then
deploys the site to GitHub Pages. The type you choose is the version bump you cause:

- `fix:` patch, `feat:` minor, a `BREAKING CHANGE:` footer major.
- `docs:`, `chore:`, `test:`, `refactor:`, `ci:`, `build:` produce no release.

Write the subject line for the changelog reader, not the diff reader.

## Product rules

- No gamification: no streaks, points, badges, levels, confetti or guilt notifications.
- A reading from AI passes `verifyReading` or shows as unverified.
- The crimson `--ai` is for AI explanations, the 解 seal and corrections only. Japanese text uses
  `--font-ja` (Klee One).
- Every user-visible string goes in the English, French and Spanish catalogues.

## Style

- Biome owns formatting and lint. The limits (cognitive complexity 8, 25 lines per function, 400
  lines per file) are errors: split the code rather than raising them.
- Comments, docs and interface copy use plain, direct language.

If `bun run check` passes, the style is right. Do not argue with a check in a pull request; open
an issue instead.

## Pull requests

Keep them scoped to one change. CI runs the same checks, the end-to-end tests and commit linting,
and comments with the coverage and the security scan's findings.
A pull request merges with a green `quality` check and a review from the maintainer.
