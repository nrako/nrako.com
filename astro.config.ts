import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import deno from '@deno/astro-adapter'
import postsManifest from './src/integrations/posts-manifest.ts'

// https://astro.build/config
export default defineConfig({
  site: 'https://nrako.com',

  // Ensure consistent URLs without trailing slashes
  trailingSlash: 'never',

  // Build pages as /contact.html instead of /contact/index.html
  build: {
    format: 'file',
  },

  // Static by default, opt-in to server rendering for versioned posts with prerender: false
  output: 'static',

  // GITHUB_TOKEN is read directly from process.env (set via wrangler secret in
  // prod, or .env locally via the posts-manifest integration). We deliberately
  // do NOT declare it via `env.schema` / `astro:env`, because the Deno adapter
  // does not yet implement Astro's `getSecret` feature — declaring the schema
  // would surface a misleading config error at every build/check.

  // Deno adapter — produces a Deno-compatible server entry at dist/server/entry.mjs.
  // start: false disables the built-in Deno.serve so we can mount the `handle`
  // export inside a Cloudflare Worker fetch handler (see worker.ts).
  adapter: deno({ start: false }),

  integrations: [
    // Preact integration for interactive islands
    preact(),
    // Generate posts manifest at build time for SSR pages
    postsManifest(),
  ],

  // Image optimization
  image: {
    domains: ['nrako.com'],
    remotePatterns: [
      {
        protocol: 'https',
      },
    ],
  },

  // Vite configuration for Tailwind CSS v4
  vite: {
    css: {
      postcss: './postcss.config.mjs',
    },
    // Exclude dev dependencies and heavy MyST deps from SSR bundle
    ssr: {
      external: [
        'playwright',
        'playwright-core',
        '@playwright/test',
        'fsevents',
        'lightningcss',
      ],
    },
    optimizeDeps: {
      exclude: [
        'playwright',
        'playwright-core',
        '@playwright/test',
        'fsevents',
        'lightningcss',
      ],
    },
  },
})
