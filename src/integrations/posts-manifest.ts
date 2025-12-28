import type { AstroIntegration } from 'astro'
import { writeManifest, defaultOptions } from '../lib/blogData'
import { join } from 'node:path'
import { loadEnv } from 'vite'

/**
 * Astro integration that generates a posts manifest at build time.
 * The manifest contains all posts metadata and version history,
 * allowing SSR pages to work without filesystem access.
 */
export default function postsManifestIntegration(): AstroIntegration {
  return {
    name: 'posts-manifest',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        // Load environment variables from .env files
        // loadEnv loads .env, .env.local, .env.[mode], .env.[mode].local
        const env = loadEnv('production', process.cwd(), '')

        if (env.GITHUB_TOKEN) {
          process.env.GITHUB_TOKEN = env.GITHUB_TOKEN
        }

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
