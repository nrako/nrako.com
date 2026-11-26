import js from '@eslint/js'
import astro from 'eslint-plugin-astro'
import tseslint from 'typescript-eslint'

// ESLint lints `.astro` files only: Oxlint reads their `<script>` blocks and
// nothing else of them. Every other source belongs to Oxlint
// (`oxlint.config.ts`), which leaves `.astro` files alone.
const astroFiles = ['**/*.astro', '**/*.astro/*.js', '**/*.astro/*.ts']

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.astro/',
      '**/.wrangler/',
      'playwright-report/',
      'test-results/',
      'public/',
    ],
  },
  ...[js.configs.recommended, ...tseslint.configs.recommended].map(
    (config) => ({ ...config, files: astroFiles }),
  ),
  ...astro.configs.recommended,
  {
    files: astroFiles,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
