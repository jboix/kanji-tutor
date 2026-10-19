/**
 * Proves the dependency-cruiser layer rules bite: runs them over `scripts/arch-fixture/src`, a tree
 * of deliberate violations, and fails unless every expected rule reports an error.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const work = join(root, '.cache', 'arch-fixture');
const expected = [
  'domain-is-pure',
  'lang-stays-below-ui',
  'ai-stays-below-ui',
  'ui-is-shared',
  'features-use-modules-not-storage',
  'features-stay-apart',
  'dexie-only-in-data',
  'genai-only-in-gemini-provider',
  'ai-uses-domain-types-only',
];

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
cpSync(join(import.meta.dir, 'arch-fixture', 'src'), join(work, 'src'), { recursive: true });
cpSync(join(root, '.dependency-cruiser.cjs'), join(work, '.dependency-cruiser.cjs'));
cpSync(join(root, 'tsconfig.json'), join(work, 'tsconfig.json'));
cpSync(join(root, 'package.json'), join(work, 'package.json'));

const run = spawnSync(
  join(root, 'node_modules', '.bin', 'depcruise'),
  ['src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'],
  { cwd: work, encoding: 'utf8' },
);
const report = JSON.parse(run.stdout) as { summary: { violations: { rule: { name: string } }[] } };
const fired = new Set(report.summary.violations.map((violation) => violation.rule.name));
const missing = expected.filter((name) => !fired.has(name));
rmSync(work, { recursive: true, force: true });

if (missing.length > 0) {
  console.error(`Layer rules that did not fire on the fixture: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`arch fixture: all ${expected.length} layer rules fire`);
