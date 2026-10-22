/**
 * Layer rules for Kanji Tutor (see CLAUDE.md "Layers"), over the whole workspace.
 * `apps/web/scripts/arch-fixture.ts` runs these rules over deliberate violations and fails unless each
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
      comment: 'apps/web/src/domain is pure TS: no React, Dexie, network SDK, or other app layers.',
      severity: 'error',
      from: { path: '^apps/web/src/domain/' },
      to: { path: [REACT, DEXIE, GENAI, '^apps/web/src/(data|ai|features|ui|app|lang)/'] },
    },
    {
      name: 'lang-stays-below-ui',
      comment: 'apps/web/src/lang never imports features, ai, ui, app or React.',
      severity: 'error',
      from: { path: '^apps/web/src/lang/' },
      to: { path: [REACT, '^apps/web/src/(features|ai|ui|app)/'] },
    },
    {
      name: 'ai-stays-below-ui',
      comment: 'apps/web/src/ai never imports features, ui, app or React.',
      severity: 'error',
      from: { path: '^apps/web/src/ai/' },
      to: { path: [REACT, '^apps/web/src/(features|ui|app)/'] },
    },
    {
      name: 'ai-uses-domain-types-only',
      comment: 'CLAUDE.md: ai → lang | data. Domain types (ports, records) are fine; logic is not.',
      severity: 'error',
      from: { path: '^apps/web/src/ai/' },
      to: { path: '^apps/web/src/domain/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'data-is-a-leaf',
      comment: 'apps/web/src/data only implements domain ports; it imports no other app layer.',
      severity: 'error',
      from: { path: '^apps/web/src/data/' },
      to: { path: [REACT, '^apps/web/src/(features|ui|app|ai|lang)/'] },
    },
    {
      name: 'features-use-modules-not-storage',
      comment:
        'Features reach storage through useServices() and AI through src/ai, never directly.',
      severity: 'error',
      from: { path: '^apps/web/src/features/' },
      to: { path: [DEXIE, GENAI, '^apps/web/src/data/', '^apps/web/src/app/'] },
    },
    {
      name: 'features-stay-apart',
      comment: 'Features never import each other; shared pieces go to src/ui or a module.',
      severity: 'error',
      from: { path: '^apps/web/src/features/([^/]+)/' },
      to: { path: '^apps/web/src/features/([^/]+)/', pathNot: '^apps/web/src/features/$1/' },
    },
    {
      name: 'ui-is-shared',
      comment:
        'src/ui is shared React; it never imports features, app, data or ai (ai types are fine).',
      severity: 'error',
      from: { path: '^apps/web/src/ui/' },
      to: {
        path: [DEXIE, GENAI, '^apps/web/src/(features|app|data|ai)/'],
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'dexie-only-in-data',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/data/' },
      to: { path: DEXIE },
    },
    {
      name: 'genai-only-in-gemini-provider',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/ai/providers/gemini' },
      to: { path: GENAI },
    },
    {
      name: 'apps-stay-apart',
      comment: 'The app and the sync server are separate programs; shared code goes to packages/.',
      severity: 'error',
      from: { path: '^apps/([^/]+)/' },
      to: { path: '^apps/([^/]+)/', pathNot: '^apps/$1/' },
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
      from: { path: '^apps/web/src/', pathNot: [TEST, '^apps/web/src/test/'] },
      to: {
        dependencyTypes: ['npm-dev'],
        dependencyTypesNot: ['type-only'],
        pathNot: 'node_modules/@types/',
      },
    },
    {
      name: 'not-to-test',
      severity: 'error',
      from: { pathNot: [TEST, '^apps/web/src/test/', '^apps/web/tests/', '^apps/[^/]+/scripts/'] },
      to: { path: [TEST, '^apps/web/src/test/'] },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules'] },
    exclude: { path: '^apps/[^/]+/(dist|dev-dist|coverage|[.]cache|deploy/app)/' },
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
