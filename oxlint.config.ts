import { defineConfig } from 'oxlint'

// Lints the TypeScript and JavaScript sources. `.astro` files belong to ESLint
// (`eslint.config.js`): Oxlint would only read their `<script>` blocks.
export default defineConfig({
  plugins: ['typescript', 'react', 'jsx-a11y', 'import', 'promise'],
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
