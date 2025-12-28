import { defineConfig, envField } from 'astro/config'
import preact from '@astrojs/preact'
import cloudflare from '@astrojs/cloudflare'
import postsManifest from './src/integrations/posts-manifest'

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

  // Environment variables schema
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },

  // Cloudflare Pages adapter
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),

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
