import type { AstroIntegration } from 'astro'
import { defaultOptions, writeManifest } from '../lib/blogData.ts'
import { join } from 'node:path'
import { loadEnv } from 'vite'
import process from 'node:process'

/**
 * Loads .env / .env.local / .env.[mode] / .env.[mode].local and copies
 * known server-only secrets onto `process.env` so library code that
 * reads them works in both dev and build.
 *
 * Vite normally only exposes VITE_* vars through `import.meta.env`; our
 * GitHub token is server-only and unprefixed, so we hoist it manually.
 */
function hoistServerEnv(mode: string): void {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN) {
    process.env.GITHUB_TOKEN = env.GITHUB_TOKEN
  }
}

/**
 * Astro integration that generates a posts manifest at build time.
 * The manifest contains all posts metadata and version history,
 * allowing SSR pages to work without filesystem access.
 */
export default function postsManifestIntegration(): AstroIntegration {
  return {
    name: 'posts-manifest',
    hooks: {
      'astro:config:setup': ({ command }) => {
        // Dev and preview need the token too (for the versioned-post SSR
        // page). Build mode is also covered here, plus again in
        // astro:build:start in case env vars changed between hooks.
        hoistServerEnv(command === 'build' ? 'production' : 'development')
      },
      'astro:build:start': async ({ logger }) => {
        hoistServerEnv('production')

        logger.info('Generating posts manifest...')

        try {
          // Generate manifest in the public directory so it's available as a static asset
          const outputPath = join(
            process.cwd(),
            'public',
            'posts-manifest.json',
          )
          await writeManifest(outputPath, defaultOptions)
          logger.info('Posts manifest generated successfully')
        } catch (error) {
          logger.error(`Failed to generate posts manifest: ${error}`)
          throw error
        }
      },
    },
  }
}
