import { type Config } from 'tailwindcss'
import typographyPlugin from 'npm:@tailwindcss/typography'

export default {
  plugins: [
    typographyPlugin
  ],
  content: [
    '{routes,islands,components}/**/*.{ts,tsx}',
    'posts/*.md',
    '../fresh-blog-plugin/components/**/*.tsx', // TODO replace by node_modules/fresh-blog-plugin ... ?
    '../fresh-blog-plugin/routes/**/*.tsx', // TODO replace by node_modules/fresh-blog-plugin ... ?
  ],
} satisfies Config
