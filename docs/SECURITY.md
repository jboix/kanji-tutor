# Security Policy

## Supported Versions

Only the latest release (the `main` branch, as deployed to GitHub Pages) gets security fixes.

## Reporting a Vulnerability

Do not open a GitHub issue for a security problem.
[Report a vulnerability](https://github.com/jboix/kanji-tutor/security/advisories/new) privately
on GitHub instead. We do not offer bounties; if you wish, we credit you in the release notes.

Before reporting, check that the problem exists on the latest release.

## What counts

Kanji Tutor runs entirely in your browser. It has no server and no accounts. It makes these
guarantees, and a way around any of them is a vulnerability:

- Your Gemini API key stays in this browser's IndexedDB. It is never in the build, a backup file, a
  log, a URL, or any request other than those to Gemini.
- The only requests the app makes at runtime go to its own origin and, with a key, to Gemini.
  Opening an outside reference (Jisho, Wiktionary, Tatoeba) sends only that link.
- No text from a model, a capture or a backup file runs as code or is rendered as HTML.
- Importing a backup file cannot change anything but your study data, and a malformed file changes
  nothing.

Some behaviour is by design and not a vulnerability:

- Anyone who can open your browser profile can read your study data and your key. Use the
  device's own lock.
- What you send to the AI tutor (sentences, photos, recordings) goes to Google under your own key
  and Google's terms.
