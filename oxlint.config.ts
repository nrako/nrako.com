import { defineConfig } from 'oxlint'

// Lints the TypeScript and JavaScript sources. `.astro` files belong to ESLint
// (`eslint.config.js`): Oxlint would only read their `<script>` blocks.
export default defineConfig({
  plugins: ['typescript'],
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
      // Astro's generated type entry uses triple-slash references by design.
      files: ['src/env.d.ts'],
      rules: { 'typescript/triple-slash-reference': 'off' },
    },
  ],
})
