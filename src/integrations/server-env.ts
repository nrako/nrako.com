import type { AstroIntegration } from 'astro'
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
 * Astro integration that makes the GitHub token from `.env` available to the
 * prerendered pages, which fetch post version history and old versions.
 */
export default function serverEnvIntegration(): AstroIntegration {
  return {
    name: 'server-env',
    hooks: {
      'astro:config:setup': ({ command }) => {
        hoistServerEnv(command === 'build' ? 'production' : 'development')
      },
    },
  }
}
