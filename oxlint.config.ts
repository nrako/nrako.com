import { defineConfig } from 'oxlint'

// Lints the TypeScript and JavaScript sources. `.astro` files belong to ESLint
// (`eslint.config.js`): Oxlint would only read their `<script>` blocks.
export default defineConfig({
  plugins: [
    'typescript',
    'react',
    'jsx-a11y',
    'import',
    'promise',
    'unicorn',
    'oxc',
  ],
  categories: { correctness: 'warn', perf: 'warn' },
  rules: {
    // What is awaited in a loop here is meant one after the other: the frames
    // of the introduction, the pages a post quotes, the cases of a test.
    'no-await-in-loop': 'off',
    // The places where the code tells the type checker to be quiet.
    'typescript/no-explicit-any': 'warn',
    'typescript/no-non-null-assertion': 'warn',
    // A warning or an error is how the build and the islands report; a
    // `console.log` is one that was left behind.
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  // Rules that need the types run through the `tsrs` backend.
  options: { typeAware: true },
  ignorePatterns: [
    'dist/',
    '.astro/',
    '.wrangler/',
    'playwright-report/',
    'test-results/',
    'public/',
    '**/*.astro',
  ],
  overrides: [
    {
      // After an assertion, `!` only says again what the test just checked:
      // a value that is missing fails the test.
      files: ['tests/**'],
      rules: { 'typescript/no-non-null-assertion': 'off' },
    },
    {
      // `test()` of `node:test` returns a promise that the runner awaits.
      files: ['tests/unit/**'],
      rules: { 'typescript/no-floating-promises': 'off' },
    },
    {
      // Astro's generated type entry uses triple-slash references by design.
      files: ['src/env.d.ts'],
      rules: { 'typescript/triple-slash-reference': 'off' },
    },
  ],
})
