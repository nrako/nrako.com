/**
 * Cloudflare Worker entry that mounts the Astro server produced by
 * @deno/astro-adapter (dist/server/entry.mjs).
 *
 * The Deno adapter calls `setGetEnv((k) => Deno.env.get(k))` at module load,
 * so we install a minimal Deno shim *before* importing the entry. Per-request
 * env (Cloudflare bindings) is captured in `cfEnv` and read by the shim.
 *
 * Static assets and prerendered HTML are served by the Workers ASSETS binding
 * via the wrangler `assets` config; this Worker only runs for routes Astro
 * marks as `prerender: false`.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  GITHUB_TOKEN?: string
  [key: string]: unknown
}

// Minimal `Deno` global shim — only `env.get` is referenced by the adapter
// before any request; `Deno.serve` / `Deno.readDir` are gated behind start: false.
let cfEnv: Env | undefined
const denoShim = {
  env: {
    get(key: string): string | undefined {
      const v = cfEnv?.[key]
      return typeof v === 'string' ? v : undefined
    },
  },
}
;(globalThis as unknown as { Deno: typeof denoShim }).Deno = denoShim

// Dynamic import keeps the shim installation order-safe.
const entryPromise = import('./dist/server/entry.mjs') as Promise<{
  handle: (req: Request) => Response | Promise<Response>
}>

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    cfEnv = env
    const { handle } = await entryPromise
    return handle(request)
  },
}
