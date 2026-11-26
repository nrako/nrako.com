import cloudflare from '@astrojs/cloudflare'
import preact from '@astrojs/preact'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import serverEnv from './src/integrations/server-env.ts'

// https://astro.build/config
export default defineConfig({
  site: 'https://nrako.com',

  // Ensure consistent URLs without trailing slashes
  trailingSlash: 'never',

  // Build pages as /contact.html instead of /contact/index.html
  build: {
    format: 'file',
  },

  // Every page is prerendered; opt in to server rendering with prerender: false
  output: 'static',

  // Cloudflare Workers adapter. On-demand routes always run in workerd; there
  // are none today, so the Worker only answers requests that match no asset.
  adapter: cloudflare({
    // Prerendered pages read posts from disk (node:fs) and run the MyST
    // pipeline, so they are built in Node rather than workerd.
    prerenderEnvironment: 'node',
    // No astro:assets images are used; do not provision an Images binding.
    imageService: 'passthrough',
  }),

  // Keep HTML-aware whitespace handling (the Astro 6 default). Astro 7 defaults
  // to 'jsx', which strips the spaces between adjacent inline elements.
  compressHTML: true,

  // Sessions are not used; do not provision a SESSION KV namespace.
  session: false,

  integrations: [
    // Preact integration for interactive islands
    preact(),
    // Expose GITHUB_TOKEN from .env to the prerendered pages
    serverEnv(),
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

  // Tailwind CSS v4
  vite: {
    plugins: [tailwindcss()],
  },
})
