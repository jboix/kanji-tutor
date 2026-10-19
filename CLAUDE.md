# Kanji Tutor

Personal, phone-first PWA for reading Japanese kanji in context (N3 level). Contributor guide: `docs/CONTRIBUTING.md`.

Local notes live in `notes/`, which git ignores (`.git/info/exclude`) and which is not in the repository: the spec (`SPEC.md`), the decisions log (`DECISIONS.md`), progress (`STATUS.md`), the roadmap (`ROADMAP.md`), the design mockups (`design/`, tokens in `tokens.css`) and screenshots. Read them when present; never commit them.

## Hard rules

- Never `git push`, add a remote, open a PR, publish, deploy or release. Local commits only.
- Never write outside this folder. `../mattebox`, `../quanthea`, `../kosterio-app` are read-only convention references.
- Never commit API keys, `.env` secrets, raw data downloads (`data/raw/`), or textbook content (Minna, Tobira).
- No real AI calls in tests or builds; use the `mock` provider and fixtures.
- No gamification anywhere: no streaks, XP, points, badges, levels, confetti, celebratory copy, guilt notifications.
- Every reading shown to the user that came from AI must pass `verifyReading` or be visibly marked unverified.
- The AI red (`--ai`, hanko crimson) is reserved for AI explanations, the 解 seal and corrections. Japanese text always uses `--font-ja` (Klee One).

## Layers (enforced by dependency-cruiser)

`features → domain | lang | ai | ui`, `ai → lang | data`, `domain` is pure TS (no React, Dexie, network). Features never import Dexie or `@google/genai` directly, and never import each other.

## Commands

- `bun run dev`: Vite dev server.
- `bun run check`: typecheck, Biome, remark, dependency-cruiser and its fixture, knip, Vitest with coverage, build, and the 300 KB shell budget.
- `bun run test:e2e`: Playwright at 390×844 and 360×740, against a mock-AI build.
- `bun run packs`: the data pipeline.

Biome is strict: cognitive complexity ≤ 8, functions ≤ 25 lines, files ≤ 400 lines, kebab-case file names, no default exports. Never raise the limits or disable a rule to pass.

## Working style

- Conventional commits, small and focused.
- Open decisions: pick a sensible default, log it in `notes/DECISIONS.md`, keep going.
- Track progress per requirement ID in `notes/STATUS.md`.
