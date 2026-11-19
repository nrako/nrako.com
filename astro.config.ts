import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'
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

  // GITHUB_TOKEN is read directly from process.env: the same library code runs
  // at build time in Node (posts-manifest integration, outside Vite, where
  // `astro:env` virtual modules do not exist) and at request time in workerd
  // (where `nodejs_compat` populates process.env from the Worker's secrets).

  // Cloudflare Workers adapter. On-demand routes always run in workerd.
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

  // Tailwind CSS v4
  vite: {
    plugins: [tailwindcss()],
  },
})
