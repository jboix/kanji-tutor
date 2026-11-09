/**
 * Vite plugin that writes `version.json` into the build: the version and the lines on what is
 * new, taken from the `feat` commits since the previous release tag (the card shows three, the
 * rest behind "more"). The running app
 * fetches it when a new version is waiting, to say which one and what it brings. The file is
 * not precached, so it always comes from the server.
 */
import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';

/** Lines kept in the file, at most: a safety cap, far above a release's features. */
const MAX_LINES = 30;

const FEAT = /^feat(\([^)]*\))?: (.+)$/;

/** "feat(web): a verdict on Use it" → "A verdict on Use it"; other commits drop out. */
export function featureLines(subjects: readonly string[]): string[] {
  return subjects
    .map((subject) => FEAT.exec(subject.trim())?.[2]?.trim() ?? '')
    .filter((line) => line.length > 0)
    .slice(0, MAX_LINES)
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1));
}

const git = (command: string) => execSync(`git ${command}`, { stdio: 'pipe' }).toString().trim();

/** The newest `feat` subjects since the tag before HEAD; none without git or tags. */
function releaseSubjects(): string[] {
  try {
    const previous = git('describe --tags --abbrev=0 HEAD^');
    return git(`log ${previous}..HEAD --format=%s`).split('\n');
  } catch {
    return [];
  }
}

/** Emits `version.json` with `version` and `notes`. */
export function versionFile(version: string): Plugin {
  return {
    name: 'kanji-tutor:version-file',
    apply: 'build',
    generateBundle() {
      const notes = featureLines(releaseSubjects());
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify({ version, notes })}\n`,
      });
    },
  };
}
