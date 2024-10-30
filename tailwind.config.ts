import type { Config } from 'tailwindcss'
import typographyPlugin from '@tailwindcss/typography'

export default {
  plugins: [typographyPlugin],
  content: [
    '{routes,islands,components}/**/*.{ts,tsx}',
    './posts/**/*.md',
  ],
  darkMode: ['variant', [
    '@media (prefers-color-scheme: dark) { &:not(.light *) }',
    '&:is(.dark *)',
  ]],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
} satisfies Config
