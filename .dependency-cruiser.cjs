/**
 * Layer rules for Kanji Tutor (see CLAUDE.md "Layers").
 * `scripts/arch-fixture.ts` runs these rules over deliberate violations and fails unless each
 * named rule fires, so a typo here cannot silently switch a rule off.
 */
const TEST = '\\.test\\.tsx?$';
const npm = (names) => `(^|node_modules/)(${names.join('|')})(/|$)`;
const REACT = npm(['react', 'react-dom', 'react-router']);
const DEXIE = npm(['dexie']);
const GENAI = npm(['@google/genai']);

module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      comment: 'src/domain is pure TS: no React, Dexie, network SDK, or other app layers.',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: [REACT, DEXIE, GENAI, '^src/(data|ai|features|ui|app|lang)/'] },
    },
    {
      name: 'lang-stays-below-ui',
      comment: 'src/lang never imports features, ai, ui, app or React.',
      severity: 'error',
      from: { path: '^src/lang/' },
      to: { path: [REACT, '^src/(features|ai|ui|app)/'] },
    },
    {
      name: 'ai-stays-below-ui',
      comment: 'src/ai never imports features, ui, app or React.',
      severity: 'error',
      from: { path: '^src/ai/' },
      to: { path: [REACT, '^src/(features|ui|app)/'] },
    },
    {
      name: 'ai-uses-domain-types-only',
      comment: 'CLAUDE.md: ai → lang | data. Domain types (ports, records) are fine; logic is not.',
      severity: 'error',
      from: { path: '^src/ai/' },
      to: { path: '^src/domain/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'data-is-a-leaf',
      comment: 'src/data only implements domain ports; it imports no other app layer.',
      severity: 'error',
      from: { path: '^src/data/' },
      to: { path: [REACT, '^src/(features|ui|app|ai|lang)/'] },
    },
    {
      name: 'features-use-modules-not-storage',
      comment:
        'Features reach storage through useServices() and AI through src/ai, never directly.',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: [DEXIE, GENAI, '^src/data/', '^src/app/'] },
    },
    {
      name: 'features-stay-apart',
      comment: 'Features never import each other; shared pieces go to src/ui or a module.',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/([^/]+)/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'ui-is-shared',
      comment:
        'src/ui is shared React; it never imports features, app, data or ai (ai types are fine).',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: {
        path: [DEXIE, GENAI, '^src/(features|app|data|ai)/'],
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'dexie-only-in-data',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/data/' },
      to: { path: DEXIE },
    },
    {
      name: 'genai-only-in-gemini-provider',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/ai/providers/gemini' },
      to: { path: GENAI },
    },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: ['(^|/)[.][^/]+[.](js|cjs|mjs|ts|json)$', '\\.d\\.ts$', TEST],
      },
      to: {},
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true, pathNot: ['^virtual:', '[?](raw|url|worker)$'] },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      from: { path: '^src/', pathNot: [TEST, '^src/test/'] },
      to: {
        dependencyTypes: ['npm-dev'],
        dependencyTypesNot: ['type-only'],
        pathNot: 'node_modules/@types/',
      },
    },
    {
      name: 'not-to-test',
      severity: 'error',
      from: { pathNot: [TEST, '^src/test/', '^tests/'] },
      to: { path: [TEST, '^src/test/'] },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules'] },
    exclude: { path: '^(dist|dev-dist|coverage)/' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'],
    },
  },
};
